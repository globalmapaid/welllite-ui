import { useQueryClient } from '@tanstack/react-query'
import * as L from 'leaflet'
import { Crosshair, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ReviewStatus, WellMarker } from '@/lib/api/types'
import type { WellBounds } from '@/lib/api/wells'
import { messageForError } from '@/lib/errorCodes'
import {
  BASEMAPS,
  boundsFromViewport,
  boundsKey,
  MARKER_COLORS,
  WORLD_BOUNDS,
  type Basemap,
} from '@/lib/map'
import { cn } from '@/lib/utils'
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANT,
  REVIEW_STATUSES,
  WELL_STATUS_LABELS,
  WELL_TYPE_LABELS,
} from '@/lib/wells'
import { useAuth } from '@/providers/auth-context'
import { useWellSearch, wellSearchOptions } from './queries'

/** Wait this long after the user stops panning before re-querying. */
const MOVE_DEBOUNCE_MS = 350
/** Opening view when the tenant has no wells to fit to. */
const WORLD_VIEW = { center: [5, 20] as L.LatLngTuple, zoom: 3 }
/** Don't zoom past this when auto-fitting, or a lone well fills the screen. */
const FIT_MAX_ZOOM = 13

function markerStyle(
  w: WellMarker,
  selected: boolean,
): L.CircleMarkerOptions {
  return {
    radius: selected ? 9 : 6,
    color: '#ffffff',
    weight: selected ? 3 : 1.5,
    opacity: 1,
    fillColor: MARKER_COLORS[w.review_status],
    fillOpacity: 0.9,
  }
}

interface Tracked {
  marker: L.CircleMarker
  data: WellMarker
}

export function WellsMap({
  reviewStatus,
}: {
  /** Shared with the list view; undefined means "all statuses". */
  reviewStatus: ReviewStatus | undefined
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef(new Map<string, Tracked>())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Auto-fit to the tenant's wells on the first load only — refitting on every
  // refetch would yank the map out from under someone who has zoomed in.
  const didFitRef = useRef(false)
  const prevSelectedRef = useRef<string | null>(null)

  const [bounds, setBounds] = useState<WellBounds>(WORLD_BOUNDS)
  const [basemap, setBasemap] = useState<Basemap>(BASEMAPS[0])
  const [selected, setSelected] = useState<WellMarker | null>(null)
  const [isFitting, setIsFitting] = useState(false)

  const queryClient = useQueryClient()
  const { currentClientId } = useAuth()
  const search = useWellSearch(bounds, reviewStatus)
  const items = search.data?.items
  const truncated = search.data?.truncated ?? false

  // --- map lifecycle -------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return
    const tracked = markersRef.current
    // Canvas keeps thousands of circle markers smooth while panning.
    const map = L.map(containerRef.current, {
      preferCanvas: true,
      // Our basemap/fit toolbar owns the top-left corner, so the zoom control
      // moves to the top right rather than sitting underneath it.
      zoomControl: false,
      worldCopyJump: true,
    }).setView(WORLD_VIEW.center, WORLD_VIEW.zoom)
    L.control.zoom({ position: 'topright' }).addTo(map)
    mapRef.current = map

    const syncBounds = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const next = boundsFromViewport(map.getBounds())
        // Returning the previous object when nothing moved keeps the query key
        // identical, so an idle nudge doesn't refetch.
        setBounds((prev) => (boundsKey(next) === boundsKey(prev) ? prev : next))
      }, MOVE_DEBOUNCE_MS)
    }
    map.on('moveend', syncBounds)

    // The container is sized by flex/CSS, which may settle after this tick.
    const raf = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(raf)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      map.off('moveend', syncBounds)
      map.remove()
      mapRef.current = null
      tileRef.current = null
      tracked.clear()
      // The map is gone, so nothing is framed or highlighted any more; a
      // remount (StrictMode, or a route revisit) starts from scratch.
      didFitRef.current = false
      prevSelectedRef.current = null
    }
  }, [])

  // Swap the basemap in place, keeping the current view.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    tileRef.current?.remove()
    tileRef.current = L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: basemap.maxZoom,
    }).addTo(map)
    tileRef.current.bringToBack()
  }, [basemap])

  // --- markers -------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current
    if (!map || !items) return
    const tracked = markersRef.current
    const seen = new Set<string>()

    for (const w of items) {
      seen.add(w.id)
      const existing = tracked.get(w.id)
      if (existing) {
        // Same well, possibly re-reviewed since we last drew it.
        if (existing.data.review_status !== w.review_status) {
          existing.marker.setStyle(markerStyle(w, prevSelectedRef.current === w.id))
        }
        existing.data = w
        continue
      }
      const marker = L.circleMarker(
        [w.latitude, w.longitude],
        markerStyle(w, false),
      )
        .bindTooltip(w.name || 'Unnamed well', {
          direction: 'top',
          offset: [0, -8],
        })
        .addTo(map)
      // Read from the tracking map rather than closing over `w`, so a marker
      // that outlives this render still opens the freshest data.
      marker.on('click', () => setSelected(tracked.get(w.id)?.data ?? w))
      tracked.set(w.id, { marker, data: w })
    }

    for (const [id, t] of tracked) {
      if (seen.has(id)) continue
      t.marker.remove()
      tracked.delete(id)
    }
  }, [items])

  // Restyle only the markers whose selection state actually changed.
  useEffect(() => {
    const tracked = markersRef.current
    const prev = prevSelectedRef.current
    const next = selected?.id ?? null
    if (prev === next) return

    if (prev) {
      const t = tracked.get(prev)
      if (t) t.marker.setStyle(markerStyle(t.data, false))
    }
    if (next) {
      const t = tracked.get(next)
      if (t) {
        t.marker.setStyle(markerStyle(t.data, true))
        t.marker.bringToFront()
      }
    }
    prevSelectedRef.current = next
  }, [selected])

  // First load: frame the tenant's wells. This fires a `moveend`, which swaps
  // the world query for the real viewport one.
  useEffect(() => {
    const map = mapRef.current
    if (!map || didFitRef.current || !items?.length) return
    didFitRef.current = true
    map.fitBounds(
      L.latLngBounds(items.map((w) => [w.latitude, w.longitude] as L.LatLngTuple)),
      { padding: [48, 48], maxZoom: FIT_MAX_ZOOM, animate: false },
    )
  }, [items])

  /**
   * Frame every well the tenant has, in a single map movement.
   *
   * Fetching the world box directly (rather than moving the map there and
   * letting the viewport query catch up) is what keeps this from zooming all
   * the way out and then back in. Usually served straight from cache, since
   * it's the same query key the map opened with.
   */
  const fitToAllWells = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    setSelected(null)
    setIsFitting(true)
    try {
      const data = await queryClient.fetchQuery(
        wellSearchOptions(currentClientId, WORLD_BOUNDS, reviewStatus),
      )
      if (!data.items.length) {
        map.setView(WORLD_VIEW.center, WORLD_VIEW.zoom)
        return
      }
      map.fitBounds(
        L.latLngBounds(
          data.items.map((w) => [w.latitude, w.longitude] as L.LatLngTuple),
        ),
        { padding: [48, 48], maxZoom: FIT_MAX_ZOOM },
      )
    } finally {
      setIsFitting(false)
    }
  }, [queryClient, currentClientId, reviewStatus])

  const count = items?.length ?? 0
  const isBusy = search.isLoading || search.isFetching || isFitting

  return (
    <div className="space-y-3">
      {search.isError && (
        <Alert variant="destructive">
          <AlertDescription>{messageForError(search.error)}</AlertDescription>
        </Alert>
      )}

      {/* Kept above the map rather than floating over it: the bottom corners
          belong to the legend and Leaflet's attribution, and an incomplete
          set of pins is worth more than a corner tooltip's worth of space. */}
      {truncated && (
        <Alert variant="info">
          <AlertDescription>
            Showing the first {count} wells in this area — there are more. Zoom
            in or shrink the viewport to load the rest.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative h-[600px] max-h-[calc(100vh-19rem)] min-h-[380px] overflow-hidden rounded-lg border border-border">
        <div ref={containerRef} className="size-full" />

        {/* Overlays sit above Leaflet's control pane (z-index 800) and stay
            click-through except where they hold real controls. */}
        <div className="pointer-events-none absolute inset-0 z-[900] flex flex-col justify-between p-3">
          {/* Top-left only — the top right is Leaflet's zoom control. */}
          <div className="flex items-start gap-2">
            <div className="pointer-events-auto flex overflow-hidden rounded-md border border-border bg-background shadow-sm">
              {BASEMAPS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBasemap(b)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    basemap.id === b.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="pointer-events-auto bg-background shadow-sm"
              onClick={fitToAllWells}
              disabled={isFitting}
            >
              <Crosshair className="size-4" />
              Fit to wells
            </Button>

            {isBusy && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="size-3.5 animate-spin" />
                Loading wells…
              </div>
            )}
          </div>

          <div className="flex items-end justify-between gap-3">
            {selected ? (
              <div className="pointer-events-auto w-72 rounded-lg border border-border bg-background p-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    {selected.name || (
                      <span className="text-muted-foreground">Unnamed well</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant={REVIEW_STATUS_VARIANT[selected.review_status]}>
                    {REVIEW_STATUS_LABELS[selected.review_status]}
                  </Badge>
                  {selected.well_status && (
                    <Badge
                      variant={
                        selected.well_status === 'working'
                          ? 'success'
                          : 'destructive'
                      }
                    >
                      {WELL_STATUS_LABELS[selected.well_status]}
                    </Badge>
                  )}
                  {selected.well_type && (
                    <Badge variant="secondary">
                      {WELL_TYPE_LABELS[selected.well_type]}
                    </Badge>
                  )}
                  {!selected.well_confirmed && (
                    <Badge variant="outline">Unconfirmed</Badge>
                  )}
                </div>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link to={`/wells/${selected.id}`}>View details</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-background/90 p-2.5 shadow-sm backdrop-blur">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Review status
                </p>
                <ul className="space-y-1">
                  {REVIEW_STATUSES.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-2.5 rounded-full ring-1 ring-white"
                        style={{ backgroundColor: MARKER_COLORS[s] }}
                      />
                      {REVIEW_STATUS_LABELS[s]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {!search.isLoading && count === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center">
            <p className="rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
              No wells in this area.
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {count === 0
          ? 'No wells in view'
          : `${count} well${count === 1 ? '' : 's'} in view${truncated ? ' (truncated)' : ''}`}
      </p>
    </div>
  )
}

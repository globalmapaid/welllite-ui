import * as L from 'leaflet'
import { Crosshair } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ReviewStatus } from '@/lib/api/types'
import { BASEMAPS, MARKER_COLORS, type Basemap } from '@/lib/map'
import { cn } from '@/lib/utils'

/** Region scale: the first question is "where in the country is this?", so the
 *  map opens wide enough to show the nearest towns and borders. Zoom in (or
 *  switch to satellite) for the site itself. */
const DEFAULT_ZOOM = 6

/**
 * A single well's position — a fixed, one-marker counterpart to `WellsMap`.
 *
 * There's no bounding-box query here: the coordinates come from the well
 * record we already have, so the map never talks to the API.
 */
export function WellLocationMap({
  latitude,
  longitude,
  reviewStatus,
  name,
}: {
  latitude: number
  longitude: number
  reviewStatus: ReviewStatus
  name?: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  // Leaflet needs a view before anything else touches the map; the effect
  // below then keeps it in step with the props.
  const initialViewRef = useRef<L.LatLngTuple>([latitude, longitude])

  const [basemap, setBasemap] = useState<Basemap>(BASEMAPS[0])

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      zoomControl: false,
      // The map sits mid-page, so the wheel belongs to the document until the
      // user actually engages with the map (click, or the zoom control).
      scrollWheelZoom: false,
    }).setView(initialViewRef.current, DEFAULT_ZOOM)
    L.control.zoom({ position: 'topright' }).addTo(map)
    // Clicking the map opts into wheel zoom; leaving it hands the wheel back,
    // so scrolling past the card never traps the page.
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())
    mapRef.current = map

    // The container is sized by CSS, which may settle after this tick.
    const raf = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(raf)
      map.remove()
      mapRef.current = null
      tileRef.current = null
      markerRef.current = null
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

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const position: L.LatLngTuple = [latitude, longitude]
    const style: L.CircleMarkerOptions = {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillColor: MARKER_COLORS[reviewStatus],
      fillOpacity: 0.9,
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(position).setStyle(style)
    } else {
      markerRef.current = L.circleMarker(position, style).addTo(map)
    }
    markerRef.current.bindTooltip(name || 'Unnamed well', {
      direction: 'top',
      offset: [0, -10],
    })
    map.setView(position, map.getZoom())
  }, [latitude, longitude, reviewStatus, name])

  const recenter = useCallback(() => {
    mapRef.current?.setView([latitude, longitude], DEFAULT_ZOOM)
  }, [latitude, longitude])

  return (
    <div className="relative h-[420px] overflow-hidden rounded-lg border border-border">
      <div ref={containerRef} className="size-full" />

      {/* Above Leaflet's control pane (z-index 800), click-through except on
          the controls themselves. */}
      <div className="pointer-events-none absolute inset-0 z-[900] p-3">
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
            onClick={recenter}
          >
            <Crosshair className="size-4" />
            Recenter
          </Button>
        </div>
      </div>
    </div>
  )
}

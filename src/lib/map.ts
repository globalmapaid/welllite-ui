/**
 * Basemap configuration and viewport→bounding-box helpers for the wells map.
 *
 * Both basemaps are keyless and attribution-only, so the console needs no map
 * vendor account. Point `VITE_MAP_TILE_URL` / `VITE_MAP_SATELLITE_URL` at a
 * keyed provider (Mapbox, MapTiler) to swap them without touching components;
 * `VITE_MAP_TILE_ATTRIBUTION` / `VITE_MAP_SATELLITE_ATTRIBUTION` override the
 * credit line, which most commercial providers require you to set.
 */
import type { LatLngBounds } from 'leaflet'
import type { WellBounds } from './api/wells'
import type { ReviewStatus } from './api/types'

export interface Basemap {
  id: 'streets' | 'satellite'
  label: string
  url: string
  attribution: string
  maxZoom: number
}

const env = import.meta.env

export const BASEMAPS: readonly Basemap[] = [
  {
    id: 'streets',
    label: 'Streets',
    url: env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      env.VITE_MAP_TILE_ATTRIBUTION ??
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url:
      env.VITE_MAP_SATELLITE_URL ??
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      env.VITE_MAP_SATELLITE_ATTRIBUTION ??
      'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
]

/** Marker fill per review status, mirroring the badge tones in `wells.ts`.
 *  These are literal colours rather than theme tokens: they sit on top of
 *  satellite imagery and must stay legible in both light and dark mode. */
export const MARKER_COLORS: Record<ReviewStatus, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  discarded: '#ef4444',
}

/** The whole world — the opening query, used to fit the map to the tenant's
 *  wells before we know where they are. */
export const WORLD_BOUNDS: WellBounds = {
  min_lat: -90,
  min_lon: -180,
  max_lat: 90,
  max_lon: 180,
}

// 3 decimal places ≈ 100 m. Snapping the viewport to a grid keeps the query
// key stable across sub-pixel map jitter, so panning back re-uses the cache.
const PRECISION = 1000
const STEP = 1 / PRECISION

const floorTo = (v: number) => Math.floor(v * PRECISION) / PRECISION
const ceilTo = (v: number) => Math.ceil(v * PRECISION) / PRECISION
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Wrap a longitude into [-180, 180). */
function wrapLon(lon: number): number {
  return (((lon + 180) % 360) + 360) % 360 - 180
}

/**
 * Convert a Leaflet viewport into a bounding box the API will accept.
 *
 * Leaflet reports latitudes beyond ±90 and longitudes beyond ±180 when the map
 * is zoomed out or panned across copies of the world; the API rejects those
 * with 422, and rejects a `min` that isn't strictly below its `max` with 400
 * `WELL_INVALID_BOUNDS`. We clamp, snap outwards to the grid, and widen a
 * degenerate edge by one step so both invariants always hold.
 */
export function boundsFromViewport(b: LatLngBounds): WellBounds {
  const west = b.getWest()
  const east = b.getEast()

  let min_lon: number
  let max_lon: number
  if (east - west >= 360) {
    // Zoomed out past a full world width — just ask for everything.
    min_lon = -180
    max_lon = 180
  } else {
    min_lon = floorTo(clamp(wrapLon(west), -180, 180))
    max_lon = ceilTo(clamp(wrapLon(east), -180, 180))
    // Wrapping puts min above max when the viewport straddles the antimeridian.
    // Splitting into two queries isn't worth it here, so widen to the full
    // range — a superset, which the client then draws normally.
    if (min_lon >= max_lon) {
      min_lon = -180
      max_lon = 180
    }
  }

  let min_lat = floorTo(clamp(b.getSouth(), -90, 90))
  let max_lat = ceilTo(clamp(b.getNorth(), -90, 90))
  if (min_lat >= max_lat) {
    // Collapsed against a pole after clamping.
    if (max_lat >= 90) min_lat = floorTo(90 - STEP)
    else max_lat = ceilTo(min_lat + STEP)
  }

  return { min_lat, min_lon, max_lat, max_lon }
}

/** Stable cache key for a bounding box (already grid-snapped above). */
export function boundsKey(b: WellBounds): string {
  return `${b.min_lat},${b.min_lon},${b.max_lat},${b.max_lon}`
}

import { LngLatBounds, type LngLatBoundsLike } from 'maplibre-gl'

/**
 * Check if the viewport covers the entire max bounds area
 * with a small tolerance (0.1 degrees) to account for floating point precision
 */
export function isAtMaxBoundsLimit(
  viewportBounds: LngLatBounds | null,
  maxBounds: LngLatBoundsLike
): boolean {
  if (!viewportBounds) return false

  // Convert maxBounds to LngLatBounds using MapLibre's native converter
  const bounds = LngLatBounds.convert(maxBounds)

  const tolerance = 0.1
  const viewport = {
    west: viewportBounds.getWest(),
    south: viewportBounds.getSouth(),
    east: viewportBounds.getEast(),
    north: viewportBounds.getNorth(),
  }

  const maxBoundsCoords = {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }

  // Check if viewport touches the bounds on BOTH sides of at least one axis
  // (either west AND east, OR south AND north)
  const touchesWest = viewport.west <= maxBoundsCoords.west + tolerance
  const touchesEast = viewport.east >= maxBoundsCoords.east - tolerance
  const touchesSouth = viewport.south <= maxBoundsCoords.south + tolerance
  const touchesNorth = viewport.north >= maxBoundsCoords.north - tolerance

  const touchesBothHorizontal = touchesWest && touchesEast
  const touchesBothVertical = touchesSouth && touchesNorth

  // Viewport is at max bounds if it touches both sides of at least one axis
  return touchesBothHorizontal || touchesBothVertical
}

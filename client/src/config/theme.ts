// Shared theme configuration
// Centralizes colors for components that need visual consistency

export const THEME = {
  // Minimap viewport indicator showing the main map's visible area
  minimapViewport: {
    rectangle: {
      fill: 'rgba(255, 255, 255, 0.15)',
      stroke: 'rgba(148, 163, 184, 0.50)',
    },
    point: {
      fill: 'rgba(148, 163, 184, 0.75)',
    },
  },
} as const

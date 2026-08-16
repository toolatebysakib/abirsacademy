export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateFitZoom(availableWidth, pageWidth, minimum = 0.55, maximum = 1.6) {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(pageWidth) || pageWidth <= 0) return minimum;
  return Number(clamp(availableWidth / pageWidth, minimum, maximum).toFixed(4));
}

export function layoutWidthChanged(previousWidth, nextWidth, threshold = 1) {
  return !Number.isFinite(previousWidth) || Math.abs(nextWidth - previousWidth) >= threshold;
}

export function zoomChanged(previousZoom, nextZoom, threshold = 0.002) {
  return !Number.isFinite(previousZoom) || Math.abs(nextZoom - previousZoom) >= threshold;
}

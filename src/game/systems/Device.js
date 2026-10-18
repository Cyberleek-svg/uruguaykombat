// Deteccion simple de dispositivo tactil.
export function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
}

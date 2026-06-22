/** Short vibration burst for tactile confirmation on supported (mobile) devices. */
export function vibrateTap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}

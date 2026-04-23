export function useHaptics() {
  function tap(
    pattern: "light" | "medium" | "heavy" | "success" | "error" = "light",
  ) {
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 30, 50],
    };

    navigator.vibrate(patterns[pattern]);
  }

  return { tap };
}

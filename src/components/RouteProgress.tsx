import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Thin progress bar at the top of the screen while the router is
 * loading or transitioning between pages.
 */
export function RouteProgress() {
  const isNavigating = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading || s.isTransitioning,
  });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isNavigating) {
      if (!visible) return;
      setProgress(100);
      const timeout = window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 280);
      return () => window.clearTimeout(timeout);
    }

    setVisible(true);
    setProgress(12);
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.max(1, (90 - prev) * 0.12)));
    }, 180);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
      role="progressbar"
      aria-label="Memuat halaman"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary to-primary-glow shadow-[0_0_10px_hsl(var(--primary)/0.6)]",
          "transition-[width,opacity] duration-200 ease-out",
        )}
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}

import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen = ({ onComplete, durationMs = 800 }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, Math.min(durationMs, 800));

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-6">
        <img
          src="/logo-splash.png"
          alt="Pace"
          className="h-24 w-24 rounded-2xl animate-in zoom-in-75 fade-in duration-300"
        />

        <h1 className="text-5xl font-bold tracking-tight text-white animate-in slide-in-from-top-2 fade-in duration-300">
          Pace
        </h1>

        <p className="text-sm text-muted-foreground animate-in slide-in-from-bottom-2 fade-in duration-300">
          Your running coach
        </p>

        <div
          className="mt-2 h-1 w-20 rounded-full animate-in fade-in zoom-in-50 duration-300"
          style={{ backgroundColor: "hsl(45 97% 54%)" }}
        />
      </div>
    </div>
  );
};

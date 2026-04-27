import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDuration } from "@/lib/runFormatters";

function formatPaceFromSeconds(paceSecPerKm: number): string {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) return "--:--";
  const minutes = Math.floor(paceSecPerKm / 60);
  const seconds = Math.round(paceSecPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type RunShareCardProps = {
  distance: number;
  duration: number;
  pace: number;
  date: string;
  userName: string;
};

export function RunShareCard({ distance, duration, pace, date, userName }: RunShareCardProps) {
  return (
    <div
      id="run-share-card"
      style={{
        width: 400,
        height: 400,
        background: "linear-gradient(135deg, #1DB954 0%, #0a8a3a 100%)",
        borderRadius: 24,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div>
        <div style={{ fontSize: 13, opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          PACE · {format(new Date(date), "dd MMM yyyy", { locale: fr })}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, opacity: 0.9 }}>{userName}</div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: "-4px" }}>{distance.toFixed(2)}</div>
        <div style={{ fontSize: 20, opacity: 0.8, marginTop: 4 }}>kilomètres</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatDuration(duration)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>durée</div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatPaceFromSeconds(pace)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>allure /km</div>
        </div>
      </div>

      <div style={{ textAlign: "center", opacity: 0.6, fontSize: 12 }}>pace-app.com</div>
    </div>
  );
}

interface GpsPoint {
  lat: number;
  lng: number;
  time: number;
  altitude?: number;
  heart_rate?: number;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateGpx(points: GpsPoint[], activityName: string, startTime: string): string {
  const safeName = escapeXml(activityName || "Course");
  const trackPoints = points
    .map((p) => {
      const time = new Date(p.time).toISOString();
      const ele = typeof p.altitude === "number" ? `<ele>${p.altitude.toFixed(1)}</ele>` : "";
      const hr =
        typeof p.heart_rate === "number"
          ? "<extensions><gpxtpx:TrackPointExtension>" +
            `<gpxtpx:hr>${Math.round(p.heart_rate)}</gpxtpx:hr>` +
            "</gpxtpx:TrackPointExtension></extensions>"
          : "";
      return `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}">
        ${ele}
        <time>${time}</time>
        ${hr}
      </trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pace Running App"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata>
    <name>${safeName}</name>
    <time>${new Date(startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>${safeName}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

export function downloadGpx(gpxContent: string, filename: string): void {
  const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

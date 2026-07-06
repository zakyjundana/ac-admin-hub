/**
 * Bangun URL "Add to Google Calendar" (calendar.google.com/render).
 * Tanpa OAuth — pelanggan tinggal klik, Google buka form event yang sudah terisi.
 * Format tanggal: YYYYMMDDTHHmmssZ (UTC) atau YYYYMMDD/YYYYMMDD (all-day).
 */
export function buildGoogleCalendarUrl(params: {
  title: string;
  startISO: string; // ISO 8601 local, e.g. 2026-07-10T09:00:00
  endISO: string;
  details?: string;
  location?: string;
}): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    // Google butuh format basic ISO tanpa tanda pemisah, dalam UTC.
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };

  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${fmt(params.startISO)}/${fmt(params.endISO)}`,
  });
  if (params.details) search.set("details", params.details);
  if (params.location) search.set("location", params.location);

  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

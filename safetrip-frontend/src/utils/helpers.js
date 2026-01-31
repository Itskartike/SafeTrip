export const cn = (...classes) =>
  classes.filter(Boolean).join(' ');

/**
 * Normalize to (latitude, longitude). Latitude must be -90 to 90, longitude -180 to 180.
 * If values are swapped (e.g. API returns lng,lat as lat,lng), correct them.
 */
export const normalizeLatLng = (a, b) => {
  const x = Number(a);
  const y = Number(b);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  if (x >= -90 && x <= 90 && y >= -180 && y <= 180) return { lat: x, lng: y };
  if (y >= -90 && y <= 90 && x >= -180 && x <= 180) return { lat: y, lng: x };
  return { lat: x, lng: y };
};

/**
 * Build Google Maps URL for a location. Auto-corrects if lat/lng are swapped.
 */
export const getGoogleMapsUrl = (latitude, longitude) => {
  const n = normalizeLatLng(latitude, longitude);
  if (!n) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${n.lat},${n.lng}`;
};

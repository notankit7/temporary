// Live weather + rain forecast from Open-Meteo (https://open-meteo.com).
// It's free and needs no API key. The farm location typed at registration
// is geocoded once and the coordinates are cached on the user.

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_MS = 30 * 60_000;
const TIMEOUT_MS = 6000;

const cache = new Map(); // userId -> { at, data }

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Weather service responded ${res.status}`);
  return res.json();
}

async function geocode(location) {
  // "Pune, Maharashtra" -> search "Pune", prefer a match in that state/country.
  const [place, ...rest] = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (!place) return null;
  const hint = rest.join(' ').toLowerCase();

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(place)}&count=10&language=en&format=json`;
  const { results = [] } = await getJson(url);
  if (!results.length) return null;

  const match =
    (hint && results.find((r) => [r.admin1, r.country].some((v) => v && hint.includes(v.toLowerCase())))) ||
    results.find((r) => r.country_code === 'IN') ||
    results[0];

  return {
    lat: match.latitude,
    lon: match.longitude,
    label: [match.name, match.admin1, match.country].filter(Boolean).join(', '),
  };
}

async function ensureCoords(user) {
  if (user.coords?.lat != null) return user.coords;
  if (!user.location) return null;
  const coords = await geocode(user.location);
  if (coords) {
    user.coords = coords;
    await user.save();
  }
  return coords;
}

export async function getForecast(user) {
  const key = user._id.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS && hit.location === user.location) return hit.data;

  const coords = await ensureCoords(user);
  if (!coords) return null;

  const params = new URLSearchParams({
    latitude: coords.lat,
    longitude: coords.lon,
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    hourly: 'precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    forecast_days: '3',
    timezone: 'auto',
  });
  const w = await getJson(`${FORECAST_URL}?${params}`);

  // Sum rain over the next 48 hours, starting from the current hour.
  const currentHour = `${w.current.time.slice(0, 13)}:00`;
  const start = Math.max(0, w.hourly.time.findIndex((t) => t >= currentHour));
  const rainNext48hMm = Math.round(
    w.hourly.precipitation.slice(start, start + 48).reduce((a, b) => a + (b || 0), 0) * 10
  ) / 10;

  const data = {
    location: coords.label,
    coords: { lat: coords.lat, lon: coords.lon },
    current: {
      temperature: w.current.temperature_2m,
      humidity: w.current.relative_humidity_2m,
      precipitation: w.current.precipitation,
      windSpeed: w.current.wind_speed_10m,
      time: w.current.time,
    },
    rainNext48hMm,
    daily: w.daily.time.map((date, i) => ({
      date,
      tempMax: w.daily.temperature_2m_max[i],
      tempMin: w.daily.temperature_2m_min[i],
      rainMm: w.daily.precipitation_sum[i],
      rainChance: w.daily.precipitation_probability_max[i],
    })),
    source: 'open-meteo.com',
  };

  cache.set(key, { at: Date.now(), location: user.location, data });
  return data;
}

// Same as getForecast but never throws — the advisory still works offline.
export async function tryGetForecast(user) {
  try {
    return await getForecast(user);
  } catch (err) {
    console.warn(`Weather lookup failed: ${err.message}`);
    return null;
  }
}

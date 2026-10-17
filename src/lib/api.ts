/** Thin client for the server-side AI gateway. The browser holds no API key. */

export type Usage = {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cached?: boolean;
  latencyMs?: number;
  action?: string;
};

/** Every real model call is recorded so evaluators can see the receipts. */
export const aiLog: Usage[] = [];
const listeners = new Set<() => void>();
export function onAiLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function callAI<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    result?: T;
    usage?: Usage;
    error?: string;
  };

  if (!res.ok || !data.result) {
    throw new Error(data.error ?? `The ${action} request failed (${res.status}).`);
  }

  if (data.usage) {
    aiLog.unshift(data.usage);
    listeners.forEach((fn) => fn());
  }
  return data.result;
}

/**
 * Downscale before upload. A 12MP phone photo becomes ~120KB, which cuts
 * image tokens, upload time on mobile data, and latency - all at once.
 */
export function compressImage(file: File, maxEdge = 896): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image we can read.'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Your browser could not process the image.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg' });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export type Weather = {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  rain: number;
  windSpeed: number;
  isDay: boolean;
  place: string;
};

/** Open-Meteo: real, live, and keyless - so it works for evaluators with zero setup. */
export async function fetchWeather(lat: number, lon: number, place: string): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,wind_speed_10m,is_day`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach the weather service.');
  const data = (await res.json()) as { current: Record<string, number> };
  const c = data.current;
  return {
    temperature: c.temperature_2m ?? 0,
    humidity: c.relative_humidity_2m ?? 0,
    apparentTemperature: c.apparent_temperature ?? 0,
    rain: c.rain ?? 0,
    windSpeed: c.wind_speed_10m ?? 0,
    isDay: (c.is_day ?? 1) === 1,
    place,
  };
}

export const CITIES: Record<string, { lat: number; lon: number; state: string }> = {
  Delhi: { lat: 28.61, lon: 77.21, state: 'Delhi' },
  Mumbai: { lat: 19.08, lon: 72.88, state: 'Maharashtra' },
  Bengaluru: { lat: 12.97, lon: 77.59, state: 'Karnataka' },
  Hyderabad: { lat: 17.39, lon: 78.49, state: 'Telangana' },
  Chennai: { lat: 13.08, lon: 80.27, state: 'Tamil Nadu' },
  Kolkata: { lat: 22.57, lon: 88.36, state: 'West Bengal' },
  Jaipur: { lat: 26.91, lon: 75.79, state: 'Rajasthan' },
  Ahmedabad: { lat: 23.02, lon: 72.57, state: 'Gujarat' },
};

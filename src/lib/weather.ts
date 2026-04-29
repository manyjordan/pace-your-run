import { format } from "date-fns";

export interface RunWeather {
  temperature: number;
  feelsLike?: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  description: string;
  emoji: string;
}

const WEATHER_CODES: Record<number, { description: string; emoji: string }> = {
  0: { description: "Ciel degage", emoji: "☀️" },
  1: { description: "Peu nuageux", emoji: "🌤️" },
  2: { description: "Partiellement nuageux", emoji: "⛅" },
  3: { description: "Couvert", emoji: "☁️" },
  45: { description: "Brouillard", emoji: "🌫️" },
  51: { description: "Bruine legere", emoji: "🌦️" },
  61: { description: "Pluie legere", emoji: "🌧️" },
  63: { description: "Pluie moderee", emoji: "🌧️" },
  65: { description: "Pluie forte", emoji: "🌧️" },
  71: { description: "Neige legere", emoji: "🌨️" },
  80: { description: "Averses legeres", emoji: "🌦️" },
  95: { description: "Orage", emoji: "⛈️" },
};

type OpenMeteoHourly = {
  temperature_2m?: number[];
  weathercode?: number[];
  windspeed_10m?: number[];
  relativehumidity_2m?: number[];
};

type OpenMeteoCurrent = {
  temperature_2m?: number;
  apparent_temperature?: number;
  weathercode?: number;
  windspeed_10m?: number;
  relativehumidity_2m?: number;
};

export async function fetchRunWeather(lat: number, lng: number, startTime: string): Promise<RunWeather | null> {
  try {
    const date = new Date(startTime);
    const dateStr = format(date, "yyyy-MM-dd");
    const hour = date.getHours();

    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set("start_date", dateStr);
    url.searchParams.set("end_date", dateStr);
    url.searchParams.set("hourly", "temperature_2m,weathercode,windspeed_10m,relativehumidity_2m");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as { hourly?: OpenMeteoHourly };
    if (!data.hourly) return null;

    const temp = data.hourly.temperature_2m?.[hour] ?? 0;
    const code = data.hourly.weathercode?.[hour] ?? 0;
    const wind = data.hourly.windspeed_10m?.[hour] ?? 0;
    const humidity = data.hourly.relativehumidity_2m?.[hour] ?? 0;

    const weather = WEATHER_CODES[code] ?? { description: "Conditions inconnues", emoji: "🌡️" };

    return {
      temperature: Math.round(temp),
      weatherCode: code,
      windSpeed: Math.round(wind),
      humidity: Math.round(humidity),
      description: weather.description,
      emoji: weather.emoji,
    };
  } catch {
    return null;
  }
}

export async function fetchCurrentWeather(lat: number, lng: number): Promise<RunWeather | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set(
      "current",
      "temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature",
    );
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: OpenMeteoCurrent };
    const current = data.current;
    if (!current) return null;

    const code = current.weathercode ?? 0;
    const weather = WEATHER_CODES[code] ?? { description: "Conditions inconnues", emoji: "🌡️" };

    return {
      temperature: Math.round(current.temperature_2m ?? 0),
      feelsLike: Math.round(current.apparent_temperature ?? 0),
      weatherCode: code,
      windSpeed: Math.round(current.windspeed_10m ?? 0),
      humidity: Math.round(current.relativehumidity_2m ?? 0),
      description: weather.description,
      emoji: weather.emoji,
    };
  } catch {
    return null;
  }
}

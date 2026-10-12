
"use strict";

// ========================================
// SKYCAST - WEATHER FORECAST APPLICATION
// API: Open-Meteo (No API key required)
// ========================================

const API = {
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast"
};

const $ = (id) => document.getElementById(id);

const elements = {
  form: $("searchForm"),
  input: $("cityInput"),
  button: $("searchButton"),
  status: $("statusMessage"),
  location: $("locationName"),
  time: $("localTime"),
  badge: $("conditionBadge"),
  temperature: $("temperature"),
  condition: $("conditionText"),
  feelsLike: $("feelsLike"),
  high: $("todayHigh"),
  low: $("todayLow"),
  art: $("weatherArt"),
  humidity: $("humidity"),
  wind: $("windSpeed"),
  rain: $("rainChance"),
  pressure: $("pressure"),
  forecast: $("forecastGrid")
};

let requestNumber = 0;

// Weather codes follow the WMO interpretation codes.
function getWeatherInfo(code, isDay = true) {
  if (code === 0) {
    return {
      text: isDay ? "Clear sky" : "Clear night",
      icon: isDay ? "☀️" : "🌙"
    };
  }

  if (code === 1) {
    return { text: "Mainly clear", icon: isDay ? "🌤️" : "🌙" };
  }

  if (code === 2) {
    return { text: "Partly cloudy", icon: "⛅" };
  }

  if (code === 3) {
    return { text: "Overcast", icon: "☁️" };
  }

  if ([45, 48].includes(code)) {
    return { text: "Foggy", icon: "🌫️" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { text: "Drizzle", icon: "🌦️" };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return { text: "Rain", icon: "🌧️" };
  }

  if ([71, 73, 75, 77].includes(code)) {
    return { text: "Snow", icon: "🌨️" };
  }

  if ([80, 81, 82].includes(code)) {
    return { text: "Rain showers", icon: "🌦️" };
  }

  if ([85, 86].includes(code)) {
    return { text: "Snow showers", icon: "🌨️" };
  }

  if (code === 95) {
    return { text: "Thunderstorm", icon: "⛈️" };
  }

  if ([96, 99].includes(code)) {
    return { text: "Thunderstorm with hail", icon: "⛈️" };
  }

  return { text: "Weather unavailable", icon: "🌡️" };
}

function showStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function formatTemperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "--°";
}

function formatNumber(value, digits = 0) {
  return Number.isFinite(value)
    ? Number(value).toFixed(digits)
    : "--";
}

function formatDay(dateString, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en", {
    weekday: "short"
  }).format(date);
}

function getLocalTime(timezone) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short"
    }).format(new Date());
  } catch {
    return "Local time unavailable";
  }
}

// Fetch JSON with a timeout and HTTP error checking.
async function fetchJSON(url) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || "Weather service error.");
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// Find city coordinates using the geocoding API.
async function findCity(city) {
  const url = new URL(API.geocoding);

  url.search = new URLSearchParams({
    name: city,
    count: "10",
    language: "en",
    format: "json"
  });

  const data = await fetchJSON(url);

  if (!data.results || data.results.length === 0) {
    throw new Error(
      `No city found for "${city}". Check the spelling and try again.`
    );
  }

  // Prefer a result in India when multiple cities have the same name.
  const results = data.results;
  const indiaResult = results.find(
    (place) => place.country_code === "IN"
  );

  return indiaResult || results[0];
}

// Get current conditions and seven daily forecasts.
async function getForecast(place) {
  const url = new URL(API.forecast);

  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "pressure_msl"
    ].join(","),

    hourly: [
      "precipitation_probability"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max"
    ].join(","),

    forecast_days: "7",
    timezone: "auto"
  });

  return fetchJSON(url);
}

function renderCurrentWeather(place, data) {
  const current = data.current;
  const daily = data.daily;

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1
  );

  elements.location.textContent = [
    place.name,
    place.admin1,
    place.country
  ].filter(Boolean).join(", ");

  elements.time.textContent = getLocalTime(data.timezone);

  elements.temperature.textContent = Number.isFinite(
    current.temperature_2m
  ) ? Math.round(current.temperature_2m) : "--";

  elements.condition.textContent = info.text;
  elements.art.textContent = info.icon;
  elements.badge.textContent = info.text.toUpperCase();

  elements.feelsLike.textContent =
    formatTemperature(current.apparent_temperature);

  elements.humidity.textContent =
    formatNumber(current.relative_humidity_2m);

  elements.wind.textContent =
    formatNumber(current.wind_speed_10m);

  elements.pressure.textContent =
    formatNumber(current.pressure_msl);

  elements.high.textContent =
    formatTemperature(daily.temperature_2m_max[0]);

  elements.low.textContent =
    formatTemperature(daily.temperature_2m_min[0]);

  // Find the nearest available hourly precipitation forecast.
  const hourlyTimes = data.hourly.time;
  let hourlyIndex = 0;
  let smallestDifference = Infinity;

  for (let i = 0; i < hourlyTimes.length; i++) {
    const difference = Math.abs(
      new Date(hourlyTimes[i]).getTime() -
      new Date(current.time).getTime()
    );

    if (difference < smallestDifference) {
      smallestDifference = difference;
      hourlyIndex = i;
    }
  }

  const probability =
    data.hourly.precipitation_probability[hourlyIndex];

  elements.rain.textContent = Number.isFinite(probability)
    ? probability
    : "--";
}

function renderForecast(daily) {
  const fragment = document.createDocumentFragment();

  daily.time.forEach((date, index) => {
    const info = getWeatherInfo(daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const day = document.createElement("div");
    day.className = "forecast-day";
    day.textContent = formatDay(date, index);

    const icon = document.createElement("div");
    icon.className = "forecast-icon";
    icon.textContent = info.icon;

    const condition = document.createElement("div");
    condition.className = "forecast-condition";
    condition.textContent = info.text;

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-temps";

    const high = document.createElement("span");
    high.textContent = formatTemperature(
      daily.temperature_2m_max[index]
    );

    const low = document.createElement("span");
    low.className = "low";
    low.textContent = formatTemperature(
      daily.temperature_2m_min[index]
    );

    temperatures.append(high, low);

    const rain = document.createElement("div");
    rain.className = "forecast-rain";

    const chance = daily.precipitation_probability_max[index];

    rain.textContent = Number.isFinite(chance)
      ? `💧 ${chance}% rain`
      : "Rain: --";

    card.append(day, icon, condition, temperatures, rain);
    fragment.appendChild(card);
  });

  elements.forecast.replaceChildren(fragment);
}

async function loadWeather(city) {
  const query = city.trim();

  if (!query) {
    showStatus("Please enter a city name.", true);
    elements.input.focus();
    return;
  }

  // Ignore older responses if the user starts another search.
  const thisRequest = ++requestNumber;

  elements.button.disabled = true;
  elements.button.textContent = "Loading...";
  elements.input.disabled = true;

  showStatus(`Fetching live weather for ${query}...`);

  try {
    const place = await findCity(query);

    if (thisRequest !== requestNumber) return;

    const data = await getForecast(place);

    if (thisRequest !== requestNumber) return;

    if (!data.current || !data.daily || !data.hourly) {
      throw new Error("Weather data is incomplete. Please try again.");
    }

    renderCurrentWeather(place, data);
    renderForecast(data.daily);

    elements.input.value = place.name;

    showStatus(
      `Weather updated for ${place.name}. Forecast timezone: ${data.timezone}.`
    );
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    console.error("SkyCast error:", error);

    const message = error.name === "AbortError"
      ? "The request timed out. Please check your connection and try again."
      : error.message || "Unable to load weather. Please try again.";

    showStatus(message, true);
  } finally {
    if (thisRequest === requestNumber) {
      elements.button.disabled = false;
      elements.button.textContent = "Search ↗";
      elements.input.disabled = false;
    }
  }
}

// Search form.
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(elements.input.value);
});

// Popular city shortcuts.
document.querySelectorAll(".city-chip").forEach((button) => {
  button.addEventListener("click", () => {
    loadWeather(button.dataset.city);
  });
});

// Load the default city on the first visit.
loadWeather("Vijayawada");

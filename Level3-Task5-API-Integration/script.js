
"use strict";

/* =========================================
   SKYCAST PRO - WEATHER APPLICATION
   API: Open-Meteo
   No API key or backend required
========================================= */

const API = {
  geo: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast"
};

const $ = (id) => document.getElementById(id);

const el = {
  form: $("searchForm"),
  input: $("cityInput"),
  search: $("searchButton"),
  status: $("statusMessage"),
  suggestions: $("suggestions"),
  location: $("locationName"),
  time: $("localTime"),
  temperature: $("temperature"),
  condition: $("conditionText"),
  feels: $("feelsLike"),
  high: $("todayHigh"),
  low: $("todayLow"),
  art: $("weatherArt"),
  caption: $("visualCaption"),
  humidity: $("humidity"),
  humidityBar: $("humidityBar"),
  wind: $("windSpeed"),
  windDirection: $("windDirection"),
  windBar: $("windBar"),
  rain: $("rainChance"),
  rainBar: $("rainBar"),
  uv: $("uvIndex"),
  uvLevel: $("uvLevel"),
  uvDescription: $("uvDescription"),
  uvBar: $("uvBar"),
  visibility: $("visibility"),
  visibilityBar: $("visibilityBar"),
  pressure: $("pressure"),
  pressureBar: $("pressureBar"),
  timezone: $("weatherTimezone"),
  chart: $("hourlyChart"),
  hourly: $("hourlyStrip"),
  forecast: $("forecastGrid"),
  insightTitle: $("insightTitle"),
  insight: $("weatherInsight"),
  recent: $("recentCities"),
  locationButton: $("locationButton"),
  unitToggle: $("unitToggle")
};

let isFahrenheit = false;
let latestRequest = 0;
let currentPlace = null;
let currentWeather = null;
let suggestionTimer = null;
let suggestionRequest = 0;

const weatherCodes = {
  0: ["Clear sky", "☀️", "🌙"],
  1: ["Mainly clear", "🌤️", "🌙"],
  2: ["Partly cloudy", "⛅", "☁️"],
  3: ["Overcast", "☁️", "☁️"],
  45: ["Foggy", "🌫️", "🌫️"],
  48: ["Rime fog", "🌫️", "🌫️"],
  51: ["Light drizzle", "🌦️", "🌦️"],
  53: ["Drizzle", "🌦️", "🌦️"],
  55: ["Heavy drizzle", "🌧️", "🌧️"],
  56: ["Freezing drizzle", "🌧️", "🌧️"],
  57: ["Freezing drizzle", "🌧️", "🌧️"],
  61: ["Light rain", "🌦️", "🌧️"],
  63: ["Moderate rain", "🌧️", "🌧️"],
  65: ["Heavy rain", "🌧️", "🌧️"],
  66: ["Freezing rain", "🌧️", "🌧️"],
  67: ["Heavy freezing rain", "🌧️", "🌧️"],
  71: ["Light snow", "🌨️", "🌨️"],
  73: ["Snow", "🌨️", "🌨️"],
  75: ["Heavy snow", "❄️", "❄️"],
  77: ["Snow grains", "🌨️", "🌨️"],
  80: ["Rain showers", "🌦️", "🌧️"],
  81: ["Rain showers", "🌧️", "🌧️"],
  82: ["Heavy showers", "⛈️", "⛈️"],
  85: ["Snow showers", "🌨️", "🌨️"],
  86: ["Heavy snow showers", "❄️", "❄️"],
  95: ["Thunderstorm", "⛈️", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️", "⛈️"],
  99: ["Severe thunderstorm", "⛈️", "⛈️"]
};

function weatherInfo(code, isDay = true) {
  const info = weatherCodes[code];

  if (!info) {
    return ["Conditions unavailable", "🌡️", "🌡️"];
  }

  return [info[0], isDay ? info[1] : info[2], info[0]];
}

function temperature(value) {
  if (!Number.isFinite(value)) return "--";

  const result = isFahrenheit ? value * 9 / 5 + 32 : value;
  return String(Math.round(result));
}

function temperatureLabel(value) {
  return `${temperature(value)}°`;
}

function number(value, decimals = 0) {
  if (!Number.isFinite(value)) return "--";

  return Number(value).toFixed(decimals);
}

function setText(id, value) {
  $(id).textContent = value;
}

function setBar(element, value, max = 100) {
  const percentage = Number.isFinite(value)
    ? Math.max(0, Math.min(100, value / max * 100))
    : 0;

  element.style.width = `${percentage}%`;
}

function showStatus(message = "", isError = false) {
  el.status.textContent = message;
  el.status.classList.toggle("error", isError);
}

function safeStorageGet(key, fallback = []) {
  try {
    const result = JSON.parse(localStorage.getItem(key));
    return Array.isArray(result) ? result : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The website still works when storage is unavailable.
  }
}

async function fetchJSON(url, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `Weather service returned error ${response.status}.`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || "Weather API error.");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Check your internet and try again.");
    }

    if (error instanceof TypeError) {
      throw new Error("Network error. Check your internet connection.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------------------
// CITY SEARCH
// -----------------------------------------

async function findCity(query) {
  const url = new URL(API.geo);

  url.search = new URLSearchParams({
    name: query,
    count: "10",
    language: "en",
    format: "json"
  });

  const data = await fetchJSON(url);

  if (!data.results?.length) {
    throw new Error(`No city found for "${query}". Try another spelling.`);
  }

  const india = data.results.find(
    (place) => place.country_code === "IN"
  );

  return india || data.results[0];
}

function placeLabel(place) {
  return [
    place.name,
    place.admin1,
    place.country
  ].filter(Boolean).join(", ");
}

function placeDetails(place) {
  return [
    place.admin1,
    place.country
  ].filter(Boolean).join(", ");
}

function showSuggestions(places) {
  el.suggestions.replaceChildren();

  places.forEach((place) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";

    const name = document.createElement("span");
    name.textContent = place.name;

    const detail = document.createElement("small");
    detail.textContent = placeDetails(place);

    button.append(name, detail);

    button.addEventListener("click", () => {
      el.input.value = place.name;
      el.suggestions.hidden = true;
      loadWeather(place);
    });

    el.suggestions.appendChild(button);
  });

  el.suggestions.hidden = places.length === 0;
}

el.input.addEventListener("input", () => {
  clearTimeout(suggestionTimer);

  const query = el.input.value.trim();
  const thisSuggestionRequest = ++suggestionRequest;

  if (query.length < 3) {
    el.suggestions.hidden = true;
    return;
  }

  suggestionTimer = setTimeout(async () => {
    try {
      const url = new URL(API.geo);

      url.search = new URLSearchParams({
        name: query,
        count: "5",
        language: "en",
        format: "json"
      });

      const data = await fetchJSON(url);

      if (thisSuggestionRequest !== suggestionRequest) return;
      if (el.input.value.trim() !== query) return;

      showSuggestions(data.results || []);
    } catch {
      if (thisSuggestionRequest === suggestionRequest) {
        el.suggestions.hidden = true;
      }
    }
  }, 350);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-area")) {
    el.suggestions.hidden = true;
  }
});

// -----------------------------------------
// WEATHER API
// -----------------------------------------

async function getForecast(latitude, longitude) {
  const url = new URL(API.forecast);

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "pressure_msl"
    ].join(","),

    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "uv_index",
      "visibility"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "uv_index_max",
      "sunrise",
      "sunset"
    ].join(","),

    forecast_days: "7",
    forecast_hours: "24",
    timezone: "auto"
  });

  return fetchJSON(url);
}

function getHourlyIndex(data) {
  const currentTime = new Date(data.current.time).getTime();

  let bestIndex = 0;
  let smallestDifference = Infinity;

  data.hourly.time.forEach((time, index) => {
    const difference = Math.abs(
      new Date(time).getTime() - currentTime
    );

    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function formatLocalTime(time, timezone) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short"
    }).format(time);
  } catch {
    return time;
  }
}

function formatDay(date, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatHour(dateString, timezone) {
  try {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      timeZone: timezone
    }).format(new Date(dateString));
  } catch {
    return dateString.slice(11, 16);
  }
}

// -----------------------------------------
// CURRENT WEATHER
// -----------------------------------------

function renderCurrent(place, data) {
  const current = data.current;
  const daily = data.daily;
  const index = getHourlyIndex(data);
  const codeInfo = weatherInfo(current.weather_code, current.is_day === 1);

  el.location.textContent = placeLabel(place);
  el.time.textContent = formatLocalTime(new Date(), data.timezone);
  el.timezone.textContent = `Timezone: ${data.timezone || "Local time"}`;

  el.temperature.textContent = temperature(current.temperature_2m);
  el.condition.textContent = codeInfo[0];
  el.art.textContent = codeInfo[1];
  el.caption.textContent = codeInfo[0];

  el.feels.textContent = temperatureLabel(current.apparent_temperature);
  el.high.textContent = temperatureLabel(daily.temperature_2m_max[0]);
  el.low.textContent = temperatureLabel(daily.temperature_2m_min[0]);

  el.humidity.textContent = number(current.relative_humidity_2m);
  setBar(el.humidityBar, current.relative_humidity_2m);

  el.wind.textContent = number(current.wind_speed_10m);
  el.windDirection.textContent =
    `Direction: ${number(current.wind_direction_10m)}°`;

  setBar(el.windBar, current.wind_speed_10m, 100);

  const rain = data.hourly.precipitation_probability[index];

  el.rain.textContent = number(rain);
  setBar(el.rainBar, rain);

  const uv = data.hourly.uv_index[index];

  el.uv.textContent = number(uv, 1);

  const uvLevel = !Number.isFinite(uv) ? "N/A"
    : uv <= 2 ? "Low"
    : uv <= 5 ? "Moderate"
    : uv <= 7 ? "High"
    : uv <= 10 ? "Very high"
    : "Extreme";

  el.uvLevel.textContent = uvLevel;
  el.uvDescription.textContent = "Forecast UV index";
  setBar(el.uvBar, uv, 11);

  const visibilityMetres = data.hourly.visibility[index];

  el.visibility.textContent = Number.isFinite(visibilityMetres)
    ? number(visibilityMetres / 1000, 1)
    : "--";

  setBar(el.visibilityBar, visibilityMetres / 1000, 20);

  el.pressure.textContent = number(current.pressure_msl);
  setBar(el.pressureBar, current.pressure_msl - 950, 100);

  renderInsight(place, data, index);
}

function renderInsight(place, data, index) {
  const current = data.current;
  const daily = data.daily;
  const rain = data.hourly.precipitation_probability[index];
  const uv = data.hourly.uv_index[index];

  let title = "A fresh look at your day";
  let message =
    `${place.name} is currently ${weatherInfo(current.weather_code, current.is_day === 1)[0].toLowerCase()}, ` +
    `with a temperature of ${temperatureLabel(current.temperature_2m)}.`;

  if (Number.isFinite(rain) && rain >= 60) {
    title = "Keep an eye on the rain";
    message += " Rain is likely in the nearest forecast hour. Consider carrying an umbrella.";
  } else if (current.temperature_2m >= 35) {
    title = "It's a warm day";
    message += " Stay hydrated and take breaks from direct sunlight.";
  } else if (current.temperature_2m <= 10) {
    title = "A cooler day ahead";
    message += " A light extra layer may help you stay comfortable.";
  } else if (Number.isFinite(uv) && uv >= 6) {
    title = "Mind the midday sun";
    message += " UV levels may be high. Consider shade and sun protection outdoors.";
  } else {
    message += " Check the hourly outlook to plan your activities.";
  }

  const todayHigh = daily.temperature_2m_max[0];
  const todayLow = daily.temperature_2m_min[0];

  message += ` Today's forecast range is ${temperatureLabel(todayLow)} to ${temperatureLabel(todayHigh)}.`;

  el.insightTitle.textContent = title;
  el.insight.textContent = message;
}

// -----------------------------------------
// HOURLY TEMPERATURE CHART
// -----------------------------------------

function renderHourly(data) {
  const hourly = data.hourly;
  const timezone = data.timezone;

  const items = hourly.time.map((time, index) => ({
    time,
    temp: hourly.temperature_2m[index],
    rain: hourly.precipitation_probability[index],
    code: hourly.weather_code[index]
  })).slice(0, 24);

  const chartItems = items.filter((item, index) => index % 3 === 0);

  if (chartItems.length < 2) {
    el.chart.textContent = "Hourly forecast is currently unavailable.";
    return;
  }

  const width = 760;
  const height = 180;
  const left = 30;
  const right = 20;
  const top = 25;
  const bottom = 30;

  const values = chartItems.map((item) =>
    isFahrenheit ? item.temp * 9 / 5 + 32 : item.temp
  );

  const min = Math.floor(Math.min(...values) / 5) * 5 - 5;
  const max = Math.ceil(Math.max(...values) / 5) * 5 + 5;
  const range = Math.max(max - min, 1);

  const x = (index) =>
    left + index * (width - left - right) / (chartItems.length - 1);

  const y = (value) =>
    top + (max - value) / range * (height - top - bottom);

  const points = chartItems.map((item, index) => ({
    x: x(index),
    y: y(values[index]),
    temp: values[index],
    label: formatHour(item.time, timezone)
  }));

  const linePath = points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ");

  const areaPath =
    `${linePath} L ${points[points.length - 1].x} ${height - bottom}` +
    ` L ${points[0].x} ${height - bottom} Z`;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Temperature trend for the next 24 hours");

  function addSVG(tag, attributes, textContent) {
    const node = document.createElementNS(svgNS, tag);

    Object.entries(attributes).forEach(([key, value]) => {
      node.setAttribute(key, value);
    });

    if (textContent !== undefined) {
      node.textContent = textContent;
    }

    svg.appendChild(node);
    return node;
  }

  [0, 0.5, 1].forEach((fraction) => {
    const yy = top + fraction * (height - top - bottom);

    addSVG("line", {
      x1: left,
      y1: yy,
      x2: width - right,
      y2: yy,
      class: "chart-grid-line"
    });
  });

  const defs = document.createElementNS(svgNS, "defs");
  const gradient = document.createElementNS(svgNS, "linearGradient");

  gradient.setAttribute("id", "chartFill");
  gradient.setAttribute("x1", "0");
  gradient.setAttribute("y1", "0");
  gradient.setAttribute("x2", "0");
  gradient.setAttribute("y2", "1");

  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#63D4FF");
  stop1.setAttribute("stop-opacity", "0.24");

  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#63D4FF");
  stop2.setAttribute("stop-opacity", "0.01");

  gradient.append(stop1, stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  addSVG("path", {
    d: areaPath,
    fill: "url(#chartFill)"
  });

  addSVG("path", {
    d: linePath,
    class: "chart-line"
  });

  points.forEach((point) => {
    addSVG("circle", {
      cx: point.x,
      cy: point.y,
      r: 3.5,
      class: "chart-point"
    });

    addSVG("text", {
      x: point.x,
      y: point.y - 10,
      "text-anchor": "middle",
      class: "chart-temp"
    }, `${Math.round(point.temp)}°`);

    addSVG("text", {
      x: point.x,
      y: height - 8,
      "text-anchor": "middle",
      class: "chart-label"
    }, point.label);
  });

  el.chart.replaceChildren(svg);

  el.hourly.replaceChildren();

  items.filter((item, index) => index % 3 === 0)
    .slice(0, 8)
    .forEach((item) => {
      const card = document.createElement("div");
      card.className = "hour-item";

      const time = document.createElement("div");
      time.className = "hour-time";
      time.textContent = formatHour(item.time, timezone);

      const icon = document.createElement("div");
      icon.className = "hour-icon";
      icon.textContent = weatherInfo(item.code)[1];

      const temp = document.createElement("div");
      temp.className = "hour-temp";
      temp.textContent = temperatureLabel(item.temp);

      const rain = document.createElement("div");
      rain.className = "hour-rain";
      rain.textContent = Number.isFinite(item.rain)
        ? `☂ ${item.rain}%`
        : "Rain --";

      card.append(time, icon, temp, rain);
      el.hourly.appendChild(card);
    });
}

// -----------------------------------------
// SEVEN-DAY FORECAST
// -----------------------------------------

function renderForecast(daily) {
  const fragment = document.createDocumentFragment();

  daily.time.forEach((date, index) => {
    const info = weatherInfo(daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const day = document.createElement("div");
    day.className = "forecast-day";
    day.textContent = formatDay(date, index);

    const dateLabel = document.createElement("div");
    dateLabel.className = "forecast-date";
    dateLabel.textContent = formatDate(date);

    const icon = document.createElement("div");
    icon.className = "forecast-icon";
    icon.textContent = info[1];

    const condition = document.createElement("div");
    condition.className = "forecast-condition";
    condition.textContent = info[0];

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-temps";

    const high = document.createElement("span");
    high.textContent = temperatureLabel(daily.temperature_2m_max[index]);

    const low = document.createElement("span");
    low.className = "low";
    low.textContent = temperatureLabel(daily.temperature_2m_min[index]);

    temperatures.append(high, low);

    const rain = document.createElement("div");
    rain.className = "forecast-rain";

    const chance = daily.precipitation_probability_max[index];

    rain.textContent = Number.isFinite(chance)
      ? `☂ ${chance}% rain`
      : "Rain: --";

    card.append(day, dateLabel, icon, condition, temperatures, rain);
    fragment.appendChild(card);
  });

  el.forecast.replaceChildren(fragment);
}

// -----------------------------------------
// RECENT SEARCHES
// -----------------------------------------

function saveRecent(place) {
  const recent = safeStorageGet("skycast_recent");

  const updated = [
    {
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      country: place.country || "",
      admin1: place.admin1 || ""
    },
    ...recent.filter((item) =>
      item.name !== place.name ||
      item.latitude !== place.latitude ||
      item.longitude !== place.longitude
    )
  ].slice(0, 5);

  safeStorageSet("skycast_recent", updated);
  renderRecent();
}

function renderRecent() {
  const recent = safeStorageGet("skycast_recent");
  el.recent.replaceChildren();

  if (recent.length === 0) {
    const empty = document.createElement("span");
    empty.className = "section-note";
    empty.textContent = "Cities you search will appear here.";
    el.recent.appendChild(empty);
    return;
  }

  recent.forEach((place) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-city";

    const symbol = document.createElement("span");
    symbol.textContent = "⌖";

    const textBox = document.createElement("span");
    textBox.textContent = place.name;

    const detail = document.createElement("small");
    detail.textContent = place.country || place.admin1 || "Saved city";

    textBox.appendChild(detail);
    button.append(symbol, textBox);

    button.addEventListener("click", () => {
      loadWeather(place);
    });

    el.recent.appendChild(button);
  });
}

$("clearRecent").addEventListener("click", () => {
  safeStorageSet("skycast_recent", []);
  renderRecent();
});

// -----------------------------------------
// SEARCH AND REQUEST HANDLING
// -----------------------------------------

async function loadWeather(input) {
  const thisRequest = ++latestRequest;

  try {
    let place;

    if (typeof input === "string") {
      const query = input.trim();

      if (!query) {
        showStatus("Enter a city name to search.", true);
        return;
      }

      el.input.value = query;
      el.suggestions.hidden = true;
      el.search.disabled = true;
      el.search.textContent = "Loading...";

      showStatus(`Finding ${query}...`);
      place = await findCity(query);
    } else {
      place = input;
      el.suggestions.hidden = true;
      el.search.disabled = true;
      el.search.textContent = "Loading...";
      showStatus(`Loading weather for ${place.name}...`);
    }

    if (thisRequest !== latestRequest) return;

    showStatus(`Fetching live weather for ${place.name}...`);

    const data = await getForecast(place.latitude, place.longitude);

    if (thisRequest !== latestRequest) return;

    if (!data.current || !data.hourly || !data.daily ||
        !data.hourly.time?.length || !data.daily.time?.length) {
      throw new Error("Weather data is incomplete. Please try again.");
    }

    currentPlace = place;
    currentWeather = data;

    renderCurrent(place, data);
    renderHourly(data);
    renderForecast(data.daily);
    saveRecent(place);

    el.input.value = place.name;

    showStatus(
      `Weather successfully updated for ${place.name}. Forecast timezone: ${data.timezone}.`
    );

    // Update the browser tab title with the current city.
    document.title = `${place.name} Weather | SkyCast Pro`;

    // Scroll to results after a search from the homepage.
    $("today").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    if (thisRequest !== latestRequest) return;

    console.error("SkyCast Pro:", error);

    showStatus(
      error.message || "Unable to load weather. Please try again.",
      true
    );
  } finally {
    if (thisRequest === latestRequest) {
      el.search.disabled = false;
      el.search.innerHTML = 'Explore <span>↗</span>';
    }
  }
}

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(el.input.value);
});

document.querySelectorAll(".city-chip").forEach((button) => {
  button.addEventListener("click", () => {
    loadWeather(button.dataset.city);
  });
});

// -----------------------------------------
// CELSIUS / FAHRENHEIT
// -----------------------------------------

el.unitToggle.addEventListener("click", () => {
  isFahrenheit = !isFahrenheit;

  el.unitToggle.setAttribute(
    "aria-label",
    isFahrenheit
      ? "Switch to Celsius"
      : "Switch to Fahrenheit"
  );

  el.unitToggle.innerHTML = isFahrenheit
    ? '<strong>°C</strong> <span>/</span> °F'
    : '°C <span>/</span> <strong>°F</strong>';

  if (currentWeather && currentPlace) {
    renderCurrent(currentPlace, currentWeather);
    renderHourly(currentWeather);
    renderForecast(currentWeather.daily);
  }
});

// -----------------------------------------
// CURRENT LOCATION
// -----------------------------------------

el.locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Your browser does not support location services.", true);
    return;
  }

  el.locationButton.disabled = true;
  el.locationButton.textContent = "Finding location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const place = {
          name: "Your location",
          latitude,
          longitude,
          country: "Local area"
        };

        // Look up a nearby named place for a friendlier label.
        const reverseURL = new URL(
          "https://geocoding-api.open-meteo.com/v1/reverse"
        );

        reverseURL.search = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          language: "en",
          format: "json"
        });

        try {
          const reverse = await fetchJSON(reverseURL, 8000);

          if (reverse.results?.length) {
            Object.assign(place, reverse.results[0], {
              latitude,
              longitude
            });
          }
        } catch {
          // Forecast can still load using GPS coordinates.
        }

        loadWeather(place);
      } catch (error) {
        showStatus(error.message || "Could not find local weather.", true);
      } finally {
        el.locationButton.disabled = false;
        el.locationButton.innerHTML = "<span>◎</span> My location";
      }
    },
    (error) => {
      const message = error.code === 1
        ? "Location permission denied. Allow location access in your browser."
        : error.code === 2
          ? "Your location could not be determined."
          : "Location request timed out. Please try again.";

      showStatus(message, true);
      el.locationButton.disabled = false;
      el.locationButton.innerHTML = "<span>◎</span> My location";
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
});

// -----------------------------------------
// NAVIGATION AND INITIAL LOAD
// -----------------------------------------

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

$("footerYear").textContent = new Date().getFullYear();

renderRecent();
loadWeather("Vijayawada");

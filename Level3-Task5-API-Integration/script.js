
const API_URL =
  "https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population,cca2,currencies,languages,subregion,timezones,area,maps";

const PAGE_SIZE = 9;

const elements = {
  grid: document.getElementById("countryGrid"),
  count: document.getElementById("countryCount"),
  updated: document.getElementById("lastUpdated"),
  status: document.getElementById("apiStatus"),
  statusDot: document.getElementById("statusDot"),
  search: document.getElementById("searchInput"),
  region: document.getElementById("regionFilter"),
  sort: document.getElementById("sortFilter"),
  results: document.getElementById("resultsLabel"),
  empty: document.getElementById("emptyState"),
  pageInfo: document.getElementById("pageInfo"),
  pageNumber: document.getElementById("pageNumber"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),
  refresh: document.getElementById("refreshBtn"),
  clear: document.getElementById("clearBtn"),
  dialog: document.getElementById("countryDialog"),
  dialogContent: document.getElementById("dialogContent"),
  closeDialog: document.getElementById("closeDialog"),
  toast: document.getElementById("toast")
};

let countries = [];
let filteredCountries = [];
let currentPage = 1;
let toastTimer;
let requestController = null;
let requestNumber = 0;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getName(country) {
  return country.name?.common || "Unknown country";
}

function getCapital(country) {
  return country.capital?.[0] || "No capital listed";
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-IN").format(number || 0);
}

function setStatus(message, state = "online") {
  elements.status.textContent = message;
  elements.status.parentElement.classList.toggle("error", state === "error");
  elements.status.parentElement.classList.toggle("loading", state === "loading");
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 3000);
}

function showLoading() {
  elements.grid.innerHTML = `
    <div class="loading-card">
      <span class="loader"></span>
      <p>Fetching live country data...</p>
    </div>`;
  elements.empty.hidden = true;
  elements.results.textContent = "Connecting to API...";
}

function showError(message) {
  elements.grid.innerHTML = `
    <div class="loading-card">
      <div style="font-size:30px;color:#ff7889">!</div>
      <h3>Unable to load data</h3>
      <p>${escapeHTML(message)}</p>
      <button class="secondary-btn" id="retryBtn" type="button">
        Try again
      </button>
    </div>`;

  document.getElementById("retryBtn")
    .addEventListener("click", loadCountries);

  elements.count.textContent = "—";
  elements.updated.textContent = "Unavailable";
  elements.results.textContent = "API connection failed";
  elements.pageInfo.textContent = "No results available";
  elements.pageNumber.textContent = "—";
  elements.prev.disabled = true;
  elements.next.disabled = true;
  elements.empty.hidden = true;
  setStatus("Connection failed", "error");
}

async function loadCountries() {
  const myRequest = ++requestNumber;

  if (requestController) {
    requestController.abort();
  }

  requestController = new AbortController();

  elements.refresh.disabled = true;
  elements.refresh.classList.add("refreshing");
  setStatus("Connecting...", "loading");
  showLoading();

  try {
    const response = await fetch(API_URL, {
      signal: requestController.signal
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected API response.");
    }

    if (myRequest !== requestNumber) return;

    countries = data.filter(country => country.name?.common)
      .sort((a, b) => getName(a).localeCompare(getName(b)));

    elements.count.textContent = formatNumber(countries.length);
    elements.updated.textContent = new Date().toLocaleTimeString(
      "en-IN",
      { hour: "2-digit", minute: "2-digit" }
    );

    setStatus("API Connected", "online");
    applyFilters();
    showToast("Country data loaded successfully!");
  } catch (error) {
    if (error.name === "AbortError") return;
    if (myRequest !== requestNumber) return;

    console.error("API error:", error);
    showError(
      "Please check your internet connection and try again."
    );
  } finally {
    if (myRequest === requestNumber) {
      elements.refresh.disabled = false;
      elements.refresh.classList.remove("refreshing");
    }
  }
}

function applyFilters() {
  const query = elements.search.value.trim().toLowerCase();
  const selectedRegion = elements.region.value;
  const selectedSort = elements.sort.value;

  filteredCountries = countries.filter(country => {
    const name = getName(country).toLowerCase();
    const capital = getCapital(country).toLowerCase();
    const region = country.region || "Other";

    const matchesSearch =
      name.includes(query) || capital.includes(query);

    const matchesRegion =
      selectedRegion === "All" || region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  if (selectedSort === "population") {
    filteredCountries.sort(
      (a, b) => (b.population || 0) - (a.population || 0)
    );
  } else if (selectedSort === "region") {
    filteredCountries.sort((a, b) =>
      (a.region || "Other").localeCompare(b.region || "Other") ||
      getName(a).localeCompare(getName(b))
    );
  } else {
    filteredCountries.sort((a, b) =>
      getName(a).localeCompare(getName(b))
    );
  }

  currentPage = 1;
  renderCountries();
}

function renderCountries() {
  const total = filteredCountries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageCountries = filteredCountries.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  elements.results.textContent =
    `${formatNumber(total)} countries found`;

  elements.empty.hidden = total !== 0;
  elements.grid.hidden = total === 0;

  if (total === 0) {
    elements.grid.innerHTML = "";
  } else {
    elements.grid.innerHTML = pageCountries
      .map((country, index) => createCountryCard(country, index))
      .join("");

    elements.grid.querySelectorAll(".details-btn")
      .forEach(button => {
        button.addEventListener("click", () => {
          const country = countries.find(
            item => item.cca2 === button.dataset.code
          );

          if (country) openCountryDetails(country);
        });
      });
  }

  elements.pageInfo.textContent = total
    ? `Showing ${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, total)} of ${formatNumber(total)}`
    : "No matching countries";

  elements.pageNumber.textContent =
    totalPages ? `${currentPage} / ${totalPages}` : "0 / 0";

  elements.prev.disabled = currentPage <= 1;
  elements.next.disabled =
    totalPages === 0 || currentPage >= totalPages;
}

function createCountryCard(country, index) {
  const name = getName(country);
  const capital = getCapital(country);
  const region = country.region || "Other";
  const flag = country.flags?.svg || country.flags?.png || "";
  const code = country.cca2 || "";
  const population = formatNumber(country.population);

  return `
    <article class="country-card" style="animation-delay:${index * 35}ms">
      <div class="flag-wrap">
        <img
          src="${escapeHTML(flag)}"
          alt="${escapeHTML(name)} flag"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
        <span class="region-chip">${escapeHTML(region)}</span>
      </div>

      <div class="country-content">
        <div class="country-title-row">
          <h3>${escapeHTML(name)}</h3>
          <span class="country-code">${escapeHTML(code || "—")}</span>
        </div>

        <p class="country-capital">⌖ ${escapeHTML(capital)}</p>

        <div class="country-divider"></div>

        <div class="country-meta">
          <div>
            <span class="meta-label">POPULATION</span>
            <span class="meta-value">${population}</span>
          </div>
          <div>
            <span class="meta-label">REGION</span>
            <span class="meta-value">${escapeHTML(region)}</span>
          </div>
        </div>

        <button
          class="details-btn"
          type="button"
          data-code="${escapeHTML(code)}"
          aria-label="View details for ${escapeHTML(name)}"
        >
          View country details <span>↗</span>
        </button>
      </div>
    </article>
  `;
}

function getCurrencies(country) {
  const currencies = country.currencies || {};
  const values = Object.values(currencies).map(currency =>
    `${currency.name || "Unknown"} (${currency.symbol || "—"})`
  );

  return values.join(", ") || "Not available";
}

function getLanguages(country) {
  return Object.values(country.languages || {}).join(", ") ||
    "Not available";
}

function openCountryDetails(country) {
  const name = getName(country);
  const flag = country.flags?.svg || country.flags?.png || "";
  const mapsURL = country.maps?.googleMaps;

  const fields = [
    ["Capital", getCapital(country)],
    ["Region", country.region || "Not available"],
    ["Subregion", country.subregion || "Not available"],
    ["Population", formatNumber(country.population)],
    ["Area", country.area != null
      ? `${formatNumber(country.area)} km²`
      : "Not available"],
    ["Currency", getCurrencies(country)],
    ["Languages", getLanguages(country)],
    ["Time zones", (country.timezones || []).join(", ") || "Not available"]
  ];

  elements.dialogContent.innerHTML = `
    <img class="dialog-flag"
      src="${escapeHTML(flag)}"
      alt="${escapeHTML(name)} flag">

    <h2 class="dialog-title">${escapeHTML(name)}</h2>
    <p class="dialog-subtitle">
      Country code: ${escapeHTML(country.cca2 || "—")}
    </p>

    <div class="dialog-grid">
      ${fields.map(([label, value]) => `
        <div class="dialog-field">
          <small>${escapeHTML(label)}</small>
          <strong>${escapeHTML(value)}</strong>
        </div>
      `).join("")}
    </div>

    ${mapsURL && /^https:\/\/www\.google\.com\/maps/.test(mapsURL)
      ? `<p style="margin:20px 0 0">
          <a class="primary-btn" href="${escapeHTML(mapsURL)}"
            target="_blank" rel="noopener noreferrer">
            Open on Google Maps ↗
          </a>
        </p>`
      : ""}
  `;

  if (!elements.dialog.open) {
    elements.dialog.showModal();
  }
}

elements.search.addEventListener("input", applyFilters);
elements.region.addEventListener("change", applyFilters);
elements.sort.addEventListener("change", applyFilters);

elements.refresh.addEventListener("click", loadCountries);

elements.prev.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderCountries();
    elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

elements.next.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredCountries.length / PAGE_SIZE);

  if (currentPage < totalPages) {
    currentPage++;
    renderCountries();
    elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

elements.clear.addEventListener("click", () => {
  elements.search.value = "";
  elements.region.value = "All";
  elements.sort.value = "name";
  applyFilters();
});

elements.closeDialog.addEventListener("click", () => {
  elements.dialog.close();
});

elements.dialog.addEventListener("click", event => {
  if (event.target === elements.dialog) {
    elements.dialog.close();
  }
});

// Start the application.
loadCountries();


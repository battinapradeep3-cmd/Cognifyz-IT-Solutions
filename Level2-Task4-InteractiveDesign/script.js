
const products = [
  {
    id: 1, name: "Sculpted Ceramic Vase", category: "home",
    categoryLabel: "Home & Living", price: 899, rating: 4.8,
    badge: "BEST LOVED", emoji: "🏺", bg: "#e7e3d4",
    description: "A softly sculpted accent for shelves, desks and cosy corners."
  },
  {
    id: 2, name: "Everyday Wireless Buds", category: "tech",
    categoryLabel: "Tech", price: 1499, rating: 4.7,
    badge: "NOVA PICK", emoji: "🎧", bg: "#dce6e4",
    description: "A compact everyday companion for music, calls and commutes."
  },
  {
    id: 3, name: "Canvas Carry Tote", category: "accessories",
    categoryLabel: "Accessories", price: 499, rating: 4.6,
    badge: "EVERYDAY", emoji: "👜", bg: "#eadcc9",
    description: "A lightweight carry-all for errands, books and daily essentials."
  },
  {
    id: 4, name: "Soft Glow Desk Lamp", category: "home",
    categoryLabel: "Home & Living", price: 1299, rating: 4.9,
    badge: "TOP RATED", emoji: "💡", bg: "#e9e4d8",
    description: "A warm desk accent for reading, work and slower mornings."
  },
  {
    id: 5, name: "Pocket Journal Set", category: "accessories",
    categoryLabel: "Accessories", price: 349, rating: 4.5,
    badge: "SMALL JOY", emoji: "📔", bg: "#e2e8d9",
    description: "A pocket-sized place for ideas, lists and passing thoughts."
  },
  {
    id: 6, name: "Hydration Bottle", category: "wellness",
    categoryLabel: "Wellness", price: 699, rating: 4.7,
    badge: "DAILY ESSENTIAL", emoji: "🧴", bg: "#dbe5df",
    description: "A reusable everyday companion for work, workouts and weekends."
  },
  {
    id: 7, name: "Minimal Phone Stand", category: "tech",
    categoryLabel: "Tech", price: 399, rating: 4.4,
    badge: "SMART PICK", emoji: "📱", bg: "#e5e2dc",
    description: "A clean, compact stand for hands-free calls and desk viewing."
  },
  {
    id: 8, name: "Calm Time Candle", category: "wellness",
    categoryLabel: "Wellness", price: 599, rating: 4.8,
    badge: "WIND DOWN", emoji: "🕯️", bg: "#eadfd2",
    description: "A simple home ritual for a quiet corner or relaxing evening."
  }
];

const $ = (selector) => document.querySelector(selector);

const productGrid = $("#productGrid");
const searchInput = $("#productSearch");
const categoryFilter = $("#categoryFilter");
const sortSelect = $("#sortSelect");
const emptyState = $("#emptyState");
const resultsMessage = $("#resultsMessage");
const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
const cartItems = $("#cartItems");
const cartEmpty = $("#cartEmpty");
const cartBottom = $("#cartBottom");
const modalBackdrop = $("#modalBackdrop");
const toast = $("#toast");

let cart = {};
let wishlist = new Set();
let wishlistOnly = false;
let activeProduct = null;
let toastTimer;

const formatPrice = (price) =>
  "₹" + price.toLocaleString("en-IN");

function getFilteredProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  let filtered = products.filter((product) => {
    const searchableText = [
      product.name,
      product.categoryLabel,
      product.description
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory;
    const matchesWishlist =
      !wishlistOnly || wishlist.has(product.id);

    return matchesSearch && matchesCategory && matchesWishlist;
  });

  switch (sortSelect.value) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      filtered.sort((a, b) => a.id - b.id);
  }

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  productGrid.innerHTML = filtered.map((product, index) => {
    const isSaved = wishlist.has(product.id);

    return `
      <article class="product-card"
        style="animation-delay:${Math.min(index * 40, 240)}ms">

        <div class="product-visual"
          style="--product-bg:${product.bg}"
          data-view="${product.id}"
          role="button"
          tabindex="0"
          aria-label="View ${product.name}">

          <span class="product-label">${product.badge}</span>
          <span class="product-art" aria-hidden="true">${product.emoji}</span>

          <button class="heart-btn ${isSaved ? "saved" : ""}"
            data-wishlist="${product.id}"
            aria-label="${isSaved ? "Remove from" : "Add to"} wishlist"
            aria-pressed="${isSaved}">
            ${isSaved ? "♥" : "♡"}
          </button>

          <button class="quick-view" data-view="${product.id}">
            Quick view ↗
          </button>
        </div>

        <div class="product-info">
          <div class="product-meta">
            <span>${product.categoryLabel}</span>
            <span class="product-rating">★ ${product.rating.toFixed(1)}</span>
          </div>

          <div class="product-title-row">
            <button class="product-title" data-view="${product.id}">
              ${product.name}
            </button>
            <span class="product-price">${formatPrice(product.price)}</span>
          </div>

          <p class="product-description">${product.description}</p>

          <button class="add-btn" data-add="${product.id}">
            Add to bag <span>＋</span>
          </button>
        </div>
      </article>
    `;
  }).join("");

  productGrid.hidden = filtered.length === 0;
  emptyState.hidden = filtered.length !== 0;

  resultsMessage.textContent = wishlistOnly
    ? `${filtered.length} saved ${filtered.length === 1 ? "item" : "items"}`
    : `Showing ${filtered.length} of ${products.length} products`;

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle(
      "active",
      chip.dataset.category === categoryFilter.value
    );
  });

  $("#wishlistMode").textContent = wishlistOnly
    ? "← View all products"
    : "♡ View wishlist";
}

function showToast(message) {
  $("#toastMessage").textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function updateCounts() {
  const totalItems = Object.values(cart).reduce(
    (sum, item) => sum + item.quantity, 0
  );

  $("#cartCount").textContent = totalItems;
  $("#drawerCount").textContent = `(${totalItems})`;
  $("#wishlistCount").textContent = wishlist.size;
  $("#wishlistShortcut").setAttribute(
    "aria-label", `View wishlist, ${wishlist.size} items`
  );
}

function addToCart(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;

  if (cart[product.id]) {
    cart[product.id].quantity += 1;
  } else {
    cart[product.id] = { ...product, quantity: 1 };
  }

  updateCounts();
  renderCart();
  showToast(`${product.name} added to your bag`);
}

function renderCart() {
  const items = Object.values(cart);

  cartEmpty.hidden = items.length > 0;
  cartBottom.hidden = items.length === 0;

  cartItems.innerHTML = items.map((item) => `
    <div class="cart-row">
      <div class="cart-thumb" style="--product-bg:${item.bg}">
        ${item.emoji}
      </div>

      <div>
        <p class="cart-item-name">${item.name}</p>
        <span class="cart-item-price">${formatPrice(item.price)}</span>

        <div class="quantity-control">
          <button data-quantity="${item.id}" data-delta="-1"
            aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-quantity="${item.id}" data-delta="1"
            aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="remove-item" data-remove="${item.id}">
        Remove
      </button>
    </div>
  `).join("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  $("#cartSubtotal").textContent = formatPrice(subtotal);
}

function openCart() {
  closeModal();

  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.classList.add("show");
  document.body.classList.add("locked");
  $("#closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.classList.remove("show");

  if (!modalBackdrop.classList.contains("show")) {
    document.body.classList.remove("locked");
  }
}

function openModal(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;

  activeProduct = product;

  $("#modalArt").style.setProperty("--product-bg", product.bg);
  $("#modalArt").textContent = product.emoji;
  $("#modalCategory").textContent = product.categoryLabel.toUpperCase();
  $("#modalTitle").textContent = product.name;
  $("#modalRating").textContent = `★ ${product.rating.toFixed(1)} rating`;
  $("#modalDescription").textContent = product.description;
  $("#modalPrice").textContent = formatPrice(product.price);

  updateModalWishlist();

  modalBackdrop.classList.add("show");
  document.body.classList.add("locked");
  $("#closeModal").focus();
}

function closeModal() {
  modalBackdrop.classList.remove("show");

  if (!cartDrawer.classList.contains("open")) {
    document.body.classList.remove("locked");
  }
}

function updateModalWishlist() {
  if (!activeProduct) return;

  const saved = wishlist.has(activeProduct.id);
  $("#modalWishlist").textContent = saved ? "♥" : "♡";
  $("#modalWishlist").classList.toggle("saved", saved);
  $("#modalWishlist").setAttribute("aria-pressed", String(saved));
}

function toggleWishlist(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;

  if (wishlist.has(product.id)) {
    wishlist.delete(product.id);
    showToast("Removed from wishlist");
  } else {
    wishlist.add(product.id);
    showToast("Saved to wishlist ♡");
  }

  updateCounts();
  renderProducts();
  updateModalWishlist();
}

function resetFilters() {
  searchInput.value = "";
  categoryFilter.value = "all";
  sortSelect.value = "featured";
  wishlistOnly = false;
  renderProducts();
}

function toggleWishlistView() {
  wishlistOnly = !wishlistOnly;
  renderProducts();

  if (wishlistOnly) {
    $("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* Product-card interactions */
productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const heartButton = event.target.closest("[data-wishlist]");
  const viewButton = event.target.closest("[data-view]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  } else if (heartButton) {
    event.stopPropagation();
    toggleWishlist(heartButton.dataset.wishlist);
  } else if (viewButton) {
    openModal(viewButton.dataset.view);
  }
});

productGrid.addEventListener("keydown", (event) => {
  const viewButton = event.target.closest("[data-view]");

  if (
    viewButton &&
    (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    openModal(viewButton.dataset.view);
  }
});

/* Cart quantity and remove buttons */
cartItems.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    const id = Number(quantityButton.dataset.quantity);
    if (!cart[id]) return;

    cart[id].quantity += Number(quantityButton.dataset.delta);

    if (cart[id].quantity <= 0) {
      delete cart[id];
    }

    updateCounts();
    renderCart();
  }

  if (removeButton) {
    delete cart[Number(removeButton.dataset.remove)];
    updateCounts();
    renderCart();
    showToast("Item removed from your bag");
  }
});

/* Search, category filters and sorting */
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);

$("#clearSearch").addEventListener("click", () => {
  searchInput.value = "";
  renderProducts();
  searchInput.focus();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    categoryFilter.value = chip.dataset.category;
    renderProducts();
  });
});

$("#resetFilters").addEventListener("click", resetFilters);
$("#emptyReset").addEventListener("click", resetFilters);
$("#wishlistMode").addEventListener("click", toggleWishlistView);

$("#wishlistShortcut").addEventListener("click", () => {
  wishlistOnly = true;
  renderProducts();
  $("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#searchFocus").addEventListener("click", () => {
  $("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => searchInput.focus(), 300);
});

/* Cart drawer */
$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#continueShopping").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

/* Product quick-view modal */
$("#closeModal").addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});

$("#modalAdd").addEventListener("click", () => {
  if (activeProduct) addToCart(activeProduct.id);
  closeModal();
});

$("#modalWishlist").addEventListener("click", () => {
  if (activeProduct) toggleWishlist(activeProduct.id);
});

/* Demo checkout: no payment is processed */
$("#checkoutButton").addEventListener("click", () => {
  showToast("Demo checkout only — no payment was taken");
});

/* Demo newsletter: no email is stored or sent */
$("#newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("#newsletterEmail").value.trim();
  if (!email) return;

  showToast("Thanks for your interest!");
  event.target.reset();
});

/* Mobile navigation */
const menuToggle = $("#menuToggle");
const navigation = $("#navigation");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

/* Escape key closes overlays and mobile menu */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeModal();
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }
});

/* Footer year and initial page rendering */
$("#currentYear").textContent = new Date().getFullYear();

renderProducts();
renderCart();
updateCounts();

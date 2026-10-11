
"use strict";

const products = [
  {
    id: 1, name: "Sculpted Ceramic Vase", category: "Home",
    price: 899, oldPrice: 1199, rating: 4.8, reviews: 124,
    badge: "BESTSELLER",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=700&q=80",
    description: "A timeless ceramic accent with a sculptural silhouette. Style it on a shelf, side table or dining table."
  },
  {
    id: 2, name: "Wireless Studio Buds", category: "Electronics",
    price: 1499, oldPrice: 1999, rating: 4.7, reviews: 89,
    badge: "POPULAR",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80",
    description: "A sleek everyday audio accessory for music, calls and your daily commute."
  },
  {
    id: 3, name: "Everyday Canvas Tote", category: "Fashion",
    price: 649, oldPrice: 799, rating: 4.6, reviews: 76,
    badge: "EVERYDAY PICK",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80",
    description: "A versatile carry-all with an understated look for errands, classes and weekends."
  },
  {
    id: 4, name: "Modern Desk Lamp", category: "Home",
    price: 1299, oldPrice: 1599, rating: 4.9, reviews: 102,
    badge: "TOP RATED",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",
    description: "Bring a warm, considered touch to your desk, reading corner or bedside table."
  },
  {
    id: 5, name: "Minimal Daily Journal", category: "Accessories",
    price: 399, oldPrice: 499, rating: 4.5, reviews: 58,
    badge: "UNDER ₹500",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80",
    description: "A simple place for daily notes, ideas, plans and the little things worth remembering."
  },
  {
    id: 6, name: "Insulated Hydration Bottle", category: "Accessories",
    price: 749, oldPrice: 999, rating: 4.7, reviews: 94,
    badge: "DAILY ESSENTIAL",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",
    description: "A clean, practical bottle design to keep close at work, while travelling or at the gym."
  },
  {
    id: 7, name: "Foldable Phone Stand", category: "Electronics",
    price: 499, oldPrice: 649, rating: 4.4, reviews: 43,
    badge: "SMART PICK",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=700&q=80",
    description: "A handy desk accessory for video calls, viewing recipes or watching content hands-free."
  },
  {
    id: 8, name: "Botanical Scented Candle", category: "Home",
    price: 599, oldPrice: 749, rating: 4.8, reviews: 111,
    badge: "CUSTOMER FAVOURITE",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80",
    description: "A simple home accent for slow evenings, cosy corners and thoughtful gifting."
  }
];

const $ = (selector) => document.querySelector(selector);

const productGrid = $("#productGrid");
const productSearch = $("#productSearch");
const categoryButtons = $("#categoryButtons");
const sortSelect = $("#sortSelect");
const emptyState = $("#emptyState");
const resultsMessage = $("#resultsMessage");
const clearSearch = $("#clearSearch");

const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
const cartItems = $("#cartItems");
const cartEmpty = $("#cartEmpty");
const cartBottom = $("#cartBottom");
const cartSubtotal = $("#cartSubtotal");
const cartCount = $("#cartCount");
const drawerCount = $("#drawerCount");
const wishlistCount = $("#wishlistCount");
const toast = $("#toast");

let activeCategory = "All";
let wishlistMode = false;
let toastTimer;

const cart = new Map();
const wishlist = new Set();

function formatPrice(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function getProduct(id) {
  return products.find((product) => product.id === Number(id));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function renderProducts() {
  const query = productSearch.value.trim().toLowerCase();

  let visibleProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);

    const matchesWishlist = !wishlistMode || wishlist.has(product.id);

    return matchesCategory && matchesSearch && matchesWishlist;
  });

  switch (sortSelect.value) {
    case "price-low":
      visibleProducts.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      visibleProducts.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      visibleProducts.sort((a, b) => b.rating - a.rating);
      break;
    case "name":
      visibleProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  productGrid.innerHTML = visibleProducts.map((product) => {
    const isSaved = wishlist.has(product.id);

    return `
      <article class="product-card">
        <div class="product-art">
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/600x700/f0eee7/173f35?text=NovaMart';"
          >
          <span class="product-badge">${product.badge}</span>
          <button
            class="wishlist-button ${isSaved ? "active" : ""}"
            data-action="wishlist"
            data-id="${product.id}"
            aria-label="${isSaved ? "Remove from" : "Add to"} wishlist"
            aria-pressed="${isSaved}"
          >${isSaved ? "♥" : "♡"}</button>
        </div>
        <div class="product-info">
          <p class="product-category">${product.category === "Home" ? "Home & Living" : product.category}</p>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating" aria-label="${product.rating} out of 5 stars">
            ★★★★★ <span>${product.rating} (${product.reviews})</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">${formatPrice(product.price)}</span>
            <span class="old-price">${formatPrice(product.oldPrice)}</span>
          </div>
          <button class="add-button" data-action="add" data-id="${product.id}">
            Add to bag&nbsp; +
          </button>
        </div>
      </article>
    `;
  }).join("");

  emptyState.hidden = visibleProducts.length !== 0;
  productGrid.hidden = visibleProducts.length === 0;

  if (wishlistMode) {
    resultsMessage.textContent = `${visibleProducts.length} wishlist item${visibleProducts.length === 1 ? "" : "s"}`;
  } else {
    resultsMessage.textContent =
      `${visibleProducts.length} product${visibleProducts.length === 1 ? "" : "s"} to discover`;
  }

  clearSearch.hidden = productSearch.value.length === 0;

  document.querySelectorAll(".category-button").forEach((button) => {
    button.classList.toggle(
      "active",
      !wishlistMode && button.dataset.category === activeCategory
    );
  });

  $("#wishlistShortcut").setAttribute("aria-pressed", String(wishlistMode));
}

function setCategory(category) {
  activeCategory = category;
  wishlistMode = false;
  renderProducts();
}

function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return;

  if (wishlist.has(product.id)) {
    wishlist.delete(product.id);
    showToast(`${product.name} removed from wishlist`);
  } else {
    wishlist.add(product.id);
    showToast(`${product.name} added to wishlist`);
  }

  wishlistCount.textContent = wishlist.size;
  renderProducts();
}

function addToCart(id) {
  const product = getProduct(id);
  if (!product) return;

  const current = cart.get(product.id);
  if (current) {
    current.quantity += 1;
  } else {
    cart.set(product.id, { productId: product.id, quantity: 1 });
  }

  renderCart();
  showToast(`${product.name} added to your bag`);
}

function changeQuantity(id, amount) {
  const item = cart.get(Number(id));
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.delete(Number(id));
  }

  renderCart();
}

function removeFromCart(id) {
  const item = cart.get(Number(id));
  if (!item) return;

  const product = getProduct(id);
  cart.delete(Number(id));
  renderCart();

  if (product) showToast(`${product.name} removed from your bag`);
}

function renderCart() {
  let totalQuantity = 0;
  let subtotal = 0;

  cart.forEach((item) => {
    const product = getProduct(item.productId);
    if (!product) return;

    totalQuantity += item.quantity;
    subtotal += product.price * item.quantity;
  });

  cartCount.textContent = totalQuantity;
  drawerCount.textContent = `(${totalQuantity})`;
  cartSubtotal.textContent = formatPrice(subtotal);

  const isEmpty = cart.size === 0;
  cartEmpty.hidden = !isEmpty;
  cartBottom.hidden = isEmpty;
  cartItems.hidden = isEmpty;

  if (isEmpty) {
    cartItems.innerHTML = "";
    return;
  }

  cartItems.innerHTML = [...cart.values()].map((item) => {
    const product = getProduct(item.productId);
    if (!product) return "";

    return `
      <div class="cart-line">
        <img src="${product.image}" alt="${product.name}"
          onerror="this.onerror=null;this.src='https://placehold.co/160x180/f0eee7/173f35?text=NovaMart';">
        <div>
          <h3>${product.name}</h3>
          <div class="line-price">${formatPrice(product.price * item.quantity)}</div>
          <div class="quantity-control">
            <button data-cart-action="decrease" data-id="${product.id}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button data-cart-action="increase" data-id="${product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="remove-line" data-cart-action="remove" data-id="${product.id}" aria-label="Remove ${product.name}">×</button>
      </div>
    `;
  }).join("");
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  $("#closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

function showWishlist() {
  wishlistMode = !wishlistMode;
  activeCategory = "All";

  if (wishlistMode) {
    productSearch.value = "";
    sortSelect.value = "featured";
  }

  renderProducts();

  $("#shop").scrollIntoView({ behavior: "smooth" });

  if (wishlistMode) {
    showToast(wishlist.size ? "Showing your saved favourites" : "Your wishlist is empty. Tap ♡ on a product to save it.");
  } else {
    showToast("Showing all products");
  }
}

function resetFilters() {
  productSearch.value = "";
  sortSelect.value = "featured";
  activeCategory = "All";
  wishlistMode = false;
  renderProducts();
}

categoryButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  setCategory(button.dataset.category);
});

productSearch.addEventListener("input", () => {
  wishlistMode = false;
  renderProducts();
});

sortSelect.addEventListener("change", renderProducts);

clearSearch.addEventListener("click", () => {
  productSearch.value = "";
  renderProducts();
  productSearch.focus();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.dataset.action === "add") addToCart(id);
  if (button.dataset.action === "wishlist") toggleWishlist(id);
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.cartAction;

  if (action === "increase") changeQuantity(id, 1);
  if (action === "decrease") changeQuantity(id, -1);
  if (action === "remove") removeFromCart(id);
});

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

$("#continueShopping").addEventListener("click", () => {
  closeCart();
  $("#shop").scrollIntoView({ behavior: "smooth" });
});

$("#continueShoppingBottom").addEventListener("click", closeCart);

$("#wishlistShortcut").addEventListener("click", showWishlist);
$("#footerWishlist").addEventListener("click", () => {
  closeCart();
  if (!wishlistMode) {
    wishlistMode = true;
    activeCategory = "All";
    productSearch.value = "";
    renderProducts();
  }
  $("#shop").scrollIntoView({ behavior: "smooth" });
});

$("#footerCart").addEventListener("click", openCart);
$("#resetFilters").addEventListener("click", resetFilters);
$("#emptyReset").addEventListener("click", resetFilters);

$("#searchFocus").addEventListener("click", () => {
  $("#shop").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => productSearch.focus(), 350);
});

$("#checkoutButton").addEventListener("click", () => {
  if (cart.size === 0) {
    showToast("Your bag is empty.");
    return;
  }

  showToast("Demo checkout only — no payment has been processed.");
});

$("#newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("#newsletterEmail").value.trim();
  if (!email) return;

  showToast("Thanks for your interest! This demo does not store your email.");
  event.target.reset();
});

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

$("#currentYear").textContent = new Date().getFullYear();

renderProducts();
renderCart();

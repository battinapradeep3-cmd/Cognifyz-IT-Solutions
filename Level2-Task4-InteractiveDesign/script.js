
const products = [
  {
    id: 1,
    name: "Sculpted Ceramic Vase",
    category: "Home",
    price: 899,
    emoji: "🏺",
    tag: "BESTSELLER",
    description: "A timeless accent for your favourite space.",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    name: "Wireless Studio Buds",
    category: "Tech",
    price: 1499,
    emoji: "🎧",
    tag: "POPULAR",
    description: "Everyday audio with a clean, modern look.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    name: "Everyday Canvas Tote",
    category: "Lifestyle",
    price: 599,
    emoji: "👜",
    tag: "EVERYDAY PICK",
    description: "A versatile companion for busy days.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 4,
    name: "Modern Desk Lamp",
    category: "Home",
    price: 1299,
    emoji: "💡",
    tag: "NEW ARRIVAL",
    description: "Bring a warm glow to your workspace.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 5,
    name: "Minimal Daily Journal",
    category: "Lifestyle",
    price: 349,
    emoji: "📔",
    tag: "",
    description: "A little space for your everyday ideas.",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 6,
    name: "Insulated Hydration Bottle",
    category: "Lifestyle",
    price: 699,
    emoji: "🧴",
    tag: "",
    description: "A practical essential for life on the go.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 7,
    name: "Foldable Phone Stand",
    category: "Tech",
    price: 299,
    emoji: "📱",
    tag: "SMART PICK",
    description: "A simple upgrade for your desk setup.",
    image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 8,
    name: "Botanical Scented Candle",
    category: "Home",
    price: 499,
    emoji: "🕯️",
    tag: "",
    description: "Create a calm and inviting atmosphere.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80"
  }
];

const cart = new Map();
const wishlist = new Set();

const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const emptyState = document.getElementById("emptyState");
const resultsMessage = document.getElementById("resultsMessage");

const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartBottom = document.getElementById("cartBottom");

let toastTimer;

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function getFilteredProducts() {
  const term = productSearch.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = products.filter(product => {
    const matchesSearch = [
      product.name,
      product.description,
      product.category
    ].some(value => value.toLowerCase().includes(term));

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  switch (sortFilter.value) {
    case "low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-visual">
        <span class="product-emoji">${product.emoji}</span>
        <img
          src="${product.image}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
        ${product.tag
          ? `<span class="product-tag">${escapeHTML(product.tag)}</span>`
          : ""}
        <button
          class="wishlist-button ${wishlist.has(product.id) ? "active" : ""}"
          data-wishlist="${product.id}"
          aria-label="${wishlist.has(product.id) ? "Remove from" : "Add to"} wishlist"
          aria-pressed="${wishlist.has(product.id)}"
        >${wishlist.has(product.id) ? "♥" : "♡"}</button>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description)}</p>
        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-button" data-add="${product.id}">+ Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");

  productGrid.hidden = filtered.length === 0;
  emptyState.hidden = filtered.length !== 0;

  resultsMessage.textContent =
    `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (cart.has(id)) {
    cart.get(id).quantity += 1;
  } else {
    cart.set(id, { ...product, quantity: 1 });
  }

  renderCart();
  showToast(`${product.name} added to your cart.`);
}

function changeQuantity(id, amount) {
  const item = cart.get(id);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.delete(id);
  }

  renderCart();
}

function removeFromCart(id) {
  cart.delete(id);
  renderCart();
  showToast("Product removed from your cart.");
}

function renderCart() {
  const items = [...cart.values()];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  document.getElementById("cartCount").textContent = quantity;
  document.getElementById("drawerCount").textContent = `(${quantity})`;
  document.getElementById("cartSubtotal").textContent = formatPrice(subtotal);

  cartEmpty.hidden = items.length !== 0;
  cartBottom.hidden = items.length === 0;

  cartItems.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-visual">
        <img
          src="${item.image}"
          alt=""
          onerror="this.style.display='none';this.parentElement.textContent='${item.emoji}'"
        >
      </div>
      <div>
        <h4>${escapeHTML(item.name)}</h4>
        <small>${formatPrice(item.price)} each</small>
        <div class="quantity-controls">
          <button data-quantity="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-quantity="${item.id}" data-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
        <button class="remove-item" data-remove="${item.id}">Remove</button>
      </div>
    </div>
  `).join("");
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function toggleWishlist(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (wishlist.has(id)) {
    wishlist.delete(id);
    showToast("Removed from wishlist.");
  } else {
    wishlist.add(id);
    showToast("Added to wishlist.");
  }

  renderProducts();
}

// Search and filters
productSearch.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);

document.getElementById("clearSearch").addEventListener("click", () => {
  productSearch.value = "";
  categoryFilter.value = "All";
  sortFilter.value = "featured";
  renderProducts();
});

// Product buttons
productGrid.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const wishButton = event.target.closest("[data-wishlist]");

  if (addButton) addToCart(Number(addButton.dataset.add));
  if (wishButton) toggleWishlist(Number(wishButton.dataset.wishlist));
});

// Shopping cart
cartItems.addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    changeQuantity(
      Number(quantityButton.dataset.quantity),
      Number(quantityButton.dataset.change)
    );
  }

  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.remove));
  }
});

document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("continueShopping").addEventListener("click", () => {
  closeCart();
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("clearCart").addEventListener("click", () => {
  cart.clear();
  renderCart();
  showToast("Your cart has been cleared.");
});

// Prepare cart details in the visitor's email application
document.getElementById("checkoutButton").addEventListener("click", () => {
  if (cart.size === 0) return;

  const lines = [...cart.values()].map(item =>
    `${item.name} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}`
  );

  const subtotal = [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const body = [
    "Hello NovaMart,",
    "",
    "I would like to enquire about the following products:",
    ...lines,
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    "",
    "Please let me know the next steps."
  ].join("\n");

  const url = `mailto:battinapradeep3@gmail.com?subject=${encodeURIComponent("NovaMart Order Enquiry")}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
});

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  menuToggle.textContent = open ? "×" : "☰";
});

navigation.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.textContent = "☰";
  });
});

// Contact form character counter
const contactMessage = document.getElementById("contactMessage");

contactMessage.addEventListener("input", () => {
  document.getElementById("messageCount").textContent =
    contactMessage.value.length;
});

// Contact form validation and email preparation
document.getElementById("contactForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const subject = document.getElementById("contactSubject").value;
  const message = contactMessage.value.trim();
  const status = document.getElementById("contactStatus");

  status.className = "form-status";
  status.textContent = "";

  if (!name || !email || !subject || !message) {
    status.textContent = "Please complete all required fields.";
    status.classList.add("error");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.textContent = "Please enter a valid email address.";
    status.classList.add("error");
    return;
  }

  const body = [
    "Hello NovaMart,",
    "",
    `Name: ${name}`,
    `Reply email: ${email}`,
    `Enquiry type: ${subject}`,
    "",
    "Message:",
    message
  ].join("\n");

  const mailto = `mailto:battinapradeep3@gmail.com?subject=${encodeURIComponent("NovaMart - " + subject)}&body=${encodeURIComponent(body)}`;

  status.textContent = "Your email app is opening. Please review the message and press Send.";
  status.classList.add("success");

  window.location.href = mailto;
});

// Close drawer and menu with Escape
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.textContent = "☰";
  }
});

// Initial page setup
document.getElementById("currentYear").textContent = new Date().getFullYear();

renderProducts();
renderCart();

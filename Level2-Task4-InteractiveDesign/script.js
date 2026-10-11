
const products = [
  {
    id: 1,
    name: "Classic Everyday Tee",
    category: "Fashion",
    price: 599,
    tag: "BESTSELLER",
    description: "A soft, comfortable T-shirt for everyday wear.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    name: "Minimal Sneakers",
    category: "Fashion",
    price: 1499,
    tag: "POPULAR",
    description: "Clean, versatile sneakers for your daily adventures.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 2499,
    tag: "TOP PICK",
    description: "Enjoy your favorite music with a sleek wireless design.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 4,
    name: "Everyday Backpack",
    category: "Accessories",
    price: 1199,
    tag: "NEW",
    description: "A practical backpack for work, college and travel.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 5,
    name: "Classic Wrist Watch",
    category: "Accessories",
    price: 1899,
    tag: "TIMELESS",
    description: "A simple, stylish watch to complete your look.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 6,
    name: "Smart Headphones",
    category: "Electronics",
    price: 3299,
    tag: "FEATURED",
    description: "Comfortable over-ear headphones for daily listening.",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 7,
    name: "Everyday Sunglasses",
    category: "Accessories",
    price: 799,
    tag: "TRENDING",
    description: "A modern accessory for a confident everyday style.",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 8,
    name: "Casual Denim Jacket",
    category: "Fashion",
    price: 1799,
    tag: "NEW ARRIVAL",
    description: "An easy-to-style denim layer for your wardrobe.",
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80"
  }
];

// Website state
let selectedCategory = "All";
let cart = [];
let toastTimer;

// HTML elements
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryList = document.getElementById("categoryList");
const resultsCount = document.getElementById("resultsCount");

const cartToggle = document.getElementById("cartToggle");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const drawerCount = document.getElementById("drawerCount");
const cartSubtotal = document.getElementById("cartSubtotal");

const checkoutBtn = document.getElementById("checkoutBtn");
const continueShopping = document.getElementById("continueShopping");

const productModal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

const toast = document.getElementById("toast");

// Format prices in Indian Rupees
function formatPrice(price) {
  return "₹" + price.toLocaleString("en-IN");
}

// Display products based on category and search
function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredProducts = products.filter(product => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  resultsCount.textContent =
    `Showing ${filteredProducts.length} of ${products.length} products`;

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-results">
        <h3>No products found</h3>
        <p>Try another search or choose a different category.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = filteredProducts.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/600x700/f0f0e9/344b34?text=NovaMart';"
        >
        <span class="product-tag">${product.tag}</span>
      </div>

      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>

        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-btn" data-add="${product.id}">
            + Add
          </button>
        </div>

        <button class="details-btn" data-details="${product.id}">
          View Details
        </button>
      </div>
    </article>
  `).join("");
}

// Category buttons
categoryList.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  selectedCategory = button.dataset.category;

  document.querySelectorAll(".category").forEach(category => {
    category.classList.toggle("active", category === button);
  });

  renderProducts();
});

// Search products
searchInput.addEventListener("input", renderProducts);

// Add to cart and view details
productGrid.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const detailsButton = event.target.closest("[data-details]");

  if (addButton) {
    addToCart(Number(addButton.dataset.add));
  }

  if (detailsButton) {
    showProductDetails(Number(detailsButton.dataset.details));
  }
});

// Add product to cart
function addToCart(productId) {
  const product = products.find(item => item.id === productId);

  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      quantity: 1
    });
  }

  renderCart();
  showToast(`${product.name} added to your cart!`);
}

// Increase or decrease product quantity
function changeQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(item => item.id !== productId);
  }

  renderCart();
}

// Remove a product completely
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
  showToast("Product removed from cart.");
}

// Display cart
function renderCart() {
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  cartCount.textContent = totalQuantity;
  drawerCount.textContent = `(${totalQuantity})`;
  cartSubtotal.textContent = formatPrice(subtotal);

  checkoutBtn.disabled = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛍️</div>
        <h3>Your cart is empty</h3>
        <p>Discover something you love and add it here.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);

    if (!product) return "";

    return `
      <div class="cart-item">
        <img
          src="${product.image}"
          alt="${product.name}"
          onerror="this.onerror=null;this.src='https://placehold.co/200x200/f0f0e9/344b34?text=Product';"
        >

        <div class="cart-item-info">
          <h3>${product.name}</h3>
          <p>${formatPrice(product.price * item.quantity)}</p>

          <div class="cart-item-actions">
            <div class="quantity-control">
              <button
                data-quantity="${product.id}"
                data-change="-1"
                aria-label="Decrease quantity"
              >−</button>

              <span>${item.quantity}</span>

              <button
                data-quantity="${product.id}"
                data-change="1"
                aria-label="Increase quantity"
              >+</button>
            </div>

            <button class="remove-btn" data-remove="${product.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Cart quantity and remove controls
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

// Open shopping cart
function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  closeCart.focus();
}

// Close shopping cart
function hideCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  cartToggle.focus();
}

cartToggle.addEventListener("click", openCart);
closeCart.addEventListener("click", hideCart);
continueShopping.addEventListener("click", hideCart);
overlay.addEventListener("click", hideCart);

// Show product details
function showProductDetails(productId) {
  const product = products.find(item => item.id === productId);

  if (!product) return;

  modalContent.innerHTML = `
    <div class="modal-product-layout">
      <img
        src="${product.image}"
        alt="${product.name}"
        onerror="this.onerror=null;this.src='https://placehold.co/600x700/f0f0e9/344b34?text=NovaMart';"
      >

      <div>
        <p class="product-category">${product.category}</p>
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <p class="modal-price">${formatPrice(product.price)}</p>
        <p>Tag: ${product.tag}</p>

        <button class="add-btn" data-modal-add="${product.id}">
          + Add to Cart
        </button>
      </div>
    </div>
  `;

  productModal.classList.add("show");
  productModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  closeModal.focus();
}

// Add from product details modal
modalContent.addEventListener("click", event => {
  const button = event.target.closest("[data-modal-add]");

  if (!button) return;

  const productId = Number(button.dataset.modalAdd);
  const product = products.find(item => item.id === productId);

  addToCart(productId);
  hideProductModal();

  // Open the cart to show the added product
  openCart();
});

// Close product details modal
function hideProductModal() {
  productModal.classList.remove("show");
  productModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

closeModal.addEventListener("click", hideProductModal);

productModal.addEventListener("click", event => {
  if (event.target === productModal) {
    hideProductModal();
  }
});

// Toast notifications
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Demo checkout
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return;

  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const confirmed = window.confirm(
    `Demo checkout\n\nYour total is ${formatPrice(subtotal)}.\n\nNo real payment will be taken. Continue with this demo?`
  );

  if (confirmed) {
    cart = [];
    renderCart();
    hideCart();
    showToast("Demo order completed successfully!");
  }
});

// Escape key closes open panels
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (productModal.classList.contains("show")) {
      hideProductModal();
    } else if (cartDrawer.classList.contains("open")) {
      hideCart();
    }
  }
});

// Footer year
document.getElementById("year").textContent =
  new Date().getFullYear();

// Initialize website
renderProducts();
renderCart();


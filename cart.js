document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.querySelector("#cart-items");
  const cartSummaryContainer = document.querySelector("#cart-summary");
  const emptyCartMessage = document.querySelector("#empty-cart");

  function getCart() {
    return JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );
  }

  function saveCart(cart) {
    localStorage.setItem(
      "sniffLabCart",
      JSON.stringify(cart)
    );
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("mk-MK").format(price);
  }

  function calculateSubtotal(cart) {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }

  function updateHeaderCount(cart) {
    const cartCount = document.querySelector(".cart-count");

    if (!cartCount) {
      return;
    }

    const totalItems = cart.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    cartCount.textContent = totalItems;
  }

  function createCartItem(item, index) {
    const itemTotal = item.price * item.quantity;

    return `
      <article class="cart-item">
        <div class="cart-item-image">
          <img
            src="${item.image}"
            alt="${item.name} парфем"
          >
        </div>

        <div class="cart-item-info">
          <h2>${item.name}</h2>
          <p>${item.size} ml</p>
          <strong>${formatPrice(item.price)} денари</strong>
        </div>

        <div class="cart-item-controls">
          <div class="quantity-controls">
            <button
              type="button"
              data-action="decrease"
              data-index="${index}"
              aria-label="Намали количина"
            >
              −
            </button>

            <span>${item.quantity}</span>

            <button
              type="button"
              data-action="increase"
              data-index="${index}"
              aria-label="Зголеми количина"
            >
              +
            </button>
          </div>

          <p class="cart-item-total">
            ${formatPrice(itemTotal)} денари
          </p>

          <button
            type="button"
            class="remove-item"
            data-action="remove"
            data-index="${index}"
          >
            Отстрани
          </button>
        </div>
      </article>
    `;
  }

  function createCartSummary(cart) {
    const subtotal = calculateSubtotal(cart);
    const freeDeliveryRemaining = Math.max(2000 - subtotal, 0);
    const mysterySampleRemaining = Math.max(1500 - subtotal, 0);

    const deliveryMessage =
      subtotal >= 2000
        ? "Бесплатна достава"
        : `Уште ${formatPrice(freeDeliveryRemaining)} денари до бесплатна достава`;

    const mysterySampleMessage =
      subtotal >= 1500
        ? "🎁 Добивате бесплатен mystery sample"
        : `Уште ${formatPrice(mysterySampleRemaining)} денари до бесплатен mystery sample`;

    return `
      <div class="summary-row">
        <span>Вкупно производи</span>
        <strong>${formatPrice(subtotal)} денари</strong>
      </div>

      <div class="summary-notice">
        🚚 ${deliveryMessage}
      </div>

      <div class="summary-notice">
        ${mysterySampleMessage}
      </div>

      ${
        subtotal < 2000
          ? `
            <p class="delivery-note">
              Цената за достава ќе биде додадена
              откако ќе ја утврдиме тарифата.
            </p>
          `
          : ""
      }

      <a href="checkout.html" class="primary-button checkout-button">
        Продолжи кон нарачка
      </a>
    `;
  }

  function renderCart() {
    const cart = getCart();

    updateHeaderCount(cart);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "";
      cartSummaryContainer.innerHTML = "";
      emptyCartMessage.hidden = false;
      return;
    }

    emptyCartMessage.hidden = true;

    cartItemsContainer.innerHTML = cart
      .map(createCartItem)
      .join("");

    cartSummaryContainer.innerHTML =
      createCartSummary(cart);
  }

  cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    const cart = getCart();

    if (!cart[index]) {
      return;
    }

    if (action === "increase") {
      cart[index].quantity += 1;
    }

    if (action === "decrease") {
      cart[index].quantity -= 1;

      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
    }

    if (action === "remove") {
      cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
  });

  renderCart();
});

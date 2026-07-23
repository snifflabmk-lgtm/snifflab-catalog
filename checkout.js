document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.querySelector("#checkout-form");
  const orderItemsContainer = document.querySelector("#order-items");
  const orderTotalContainer = document.querySelector("#order-total");
  const checkoutMessage = document.querySelector("#checkout-message");
  const checkoutContent = document.querySelector("#checkout-content");
  const emptyCheckout = document.querySelector("#empty-checkout");

  function getCart() {
    return JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
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

  function renderOrderSummary(cart) {
    const subtotal = calculateSubtotal(cart);

    orderItemsContainer.innerHTML = cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;

        return `
          <article class="order-summary-item">
            <img
              src="${item.image}"
              alt="${item.name} парфем"
            >

            <div>
              <h3>${item.name}</h3>
              <p>
                ${item.size} ml · Количина ${item.quantity}
              </p>
            </div>

            <strong>
              ${formatPrice(itemTotal)} денари
            </strong>
          </article>
        `;
      })
      .join("");

    orderTotalContainer.innerHTML = `
      <div class="checkout-total-row">
        <span>Вкупно производи</span>
        <strong>${formatPrice(subtotal)} денари</strong>
      </div>

      <div class="checkout-delivery-row">
        <span>Достава</span>
        <strong>
          ${
            subtotal >= 2000
              ? "Бесплатна"
              : "Ќе биде дополнително потврдена"
          }
        </strong>
      </div>

      ${
        subtotal >= 1500
          ? `
            <p class="checkout-gift">
              🎁 Добивате бесплатен mystery sample
            </p>
          `
          : ""
      }
    `;
  }

  function createOrderData(cart) {
    const formData = new FormData(checkoutForm);

    return {
      orderId: `SL-${Date.now()}`,
      createdAt: new Date().toISOString(),

      customer: {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        city: formData.get("city"),
        address: formData.get("address"),
        note: formData.get("note") || ""
      },

      marketingConsent:
        formData.get("marketingConsent") === "yes",

      paymentMethod: "Плаќање при достава",
      deliveryService: "ЕЛС Еко Логистик",

      items: cart,

      subtotal: calculateSubtotal(cart),

      freeDelivery:
        calculateSubtotal(cart) >= 2000,

      mysterySample:
        calculateSubtotal(cart) >= 1500
    };
  }

  const cart = getCart();

  if (cart.length === 0) {
    checkoutContent.hidden = true;
    emptyCheckout.hidden = false;
    return;
  }

  emptyCheckout.hidden = true;
  checkoutContent.hidden = false;

  renderOrderSummary(cart);

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    const orderData = createOrderData(cart);

    localStorage.setItem(
      "sniffLabPendingOrder",
      JSON.stringify(orderData)
    );

    checkoutMessage.textContent =
      "Формата е подготвена. Следно ќе го поврземе испраќањето на нарачката со е-пошта.";

    checkoutMessage.classList.add("visible-message");
  });
});

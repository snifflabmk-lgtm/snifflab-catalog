document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzzphhEJsh5WzE8bSkbyeny4rJVqNrqdK7TvDBBrYpr8FBKAebTU-ydNsFDFCWdOUgG/exec";

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
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      city: formData.get("city").trim(),
      address: formData.get("address").trim(),
      note: (formData.get("note") || "").trim(),

      newsletter:
        formData.get("marketingConsent") === "yes",

      paymentMethod: "Плаќање при достава",
      deliveryService: "ЕЛС Еко Логистик",

      items: cart.map((item) => ({
        name: item.name,
        size: `${item.size} ml`,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image
      })),

      subtotal: calculateSubtotal(cart)
    };
  }

  function showMessage(message, type) {
    checkoutMessage.textContent = message;
    checkoutMessage.classList.add("visible-message");

    checkoutMessage.classList.toggle(
      "success-message",
      type === "success"
    );

    checkoutMessage.classList.toggle(
      "error-message",
      type === "error"
    );
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

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    const currentCart = getCart();

    if (currentCart.length === 0) {
      showMessage(
        "Вашата кошничка е празна.",
        "error"
      );
      return;
    }

    const submitButton =
      checkoutForm.querySelector('button[type="submit"]');

    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = "СЕ ИСПРАЌА...";

    showMessage(
      "Ве молиме почекајте додека ја испраќаме нарачката.",
      "loading"
    );

    const orderData = createOrderData(currentCart);

    localStorage.setItem(
      "sniffLabPendingOrder",
      JSON.stringify(orderData)
    );

    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(orderData)
      });

      localStorage.removeItem("sniffLabCart");
      localStorage.removeItem("sniffLabPendingOrder");

      checkoutForm.reset();

      showMessage(
        "✅ Вашата нарачка е успешно испратена! Ќе добиете потврда на е-пошта.",
        "success"
      );

      submitButton.textContent = "НАРАЧКАТА Е ИСПРАТЕНА";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 5000);

    } catch (error) {
      console.error(error);

      showMessage(
        "❌ Нарачката не беше испратена. Проверете ја интернет-врската и обидете се повторно.",
        "error"
      );

      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});

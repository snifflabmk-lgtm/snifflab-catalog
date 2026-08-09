document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbx_Xwvym4OlpSHypwJXsSL2TKLauFl4LXZrcYlO6BCl3HifRoblXu3xwhPsvVscuW75/exec";

  const MAX_ORDER_ITEMS = 12;

  const checkoutForm =
    document.querySelector("#checkout-form");

  const orderItemsContainer =
    document.querySelector("#order-items");

  const orderTotalContainer =
    document.querySelector("#order-total");

  const checkoutMessage =
    document.querySelector("#checkout-message");

  const checkoutContent =
    document.querySelector("#checkout-content");

  const emptyCheckout =
    document.querySelector("#empty-checkout");

  function getCart() {
    return JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("mk-MK")
      .format(price);
  }

  function calculateSubtotal(cart) {
    return cart.reduce((total, item) => {
      return (
        total +
        Number(item.price) *
          Number(item.quantity)
      );
    }, 0);
  }

  function createOrderId() {
    return (
      "SL-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()
    );
  }

  function getCheckoutOrderId() {
    let orderId = localStorage.getItem(
      "sniffLabCheckoutOrderId"
    );

    if (!orderId) {
      orderId = createOrderId();

      localStorage.setItem(
        "sniffLabCheckoutOrderId",
        orderId
      );
    }

    return orderId;
  }

  function renderOrderSummary(cart) {
  const subtotal =
    calculateSubtotal(cart);

  const deliveryPrice =
    subtotal >= 2000 ? 0 : 170;

  const total =
    subtotal + deliveryPrice;

  orderItemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal =
        Number(item.price) *
        Number(item.quantity);

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

      <strong>
        ${formatPrice(subtotal)} денари
      </strong>
    </div>

    <div class="checkout-delivery-row">
      <span>Достава</span>

      <strong>
        ${
          deliveryPrice === 0
            ? "Бесплатна"
            : `${formatPrice(deliveryPrice)} денари`
        }
      </strong>
    </div>

    <div class="checkout-total-row">
      <span>Вкупно за плаќање</span>

      <strong>
        ${formatPrice(total)} денари
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

 function createOrderData(
  cart,
  orderId
) {
  const formData =
    new FormData(checkoutForm);

  const subtotal =
    calculateSubtotal(cart);

  const deliveryPrice =
    subtotal >= 2000 ? 0 : 170;

  const total =
    subtotal + deliveryPrice;

  return {
    orderId: orderId,

    firstName: String(
      formData.get("firstName") || ""
    ).trim(),

    lastName: String(
      formData.get("lastName") || ""
    ).trim(),

    phone: String(
      formData.get("phone") || ""
    ).trim(),

    email: String(
      formData.get("email") || ""
    ).trim(),

    city: String(
      formData.get("city") || ""
    ).trim(),

    address: String(
      formData.get("address") || ""
    ).trim(),

    note: String(
      formData.get("note") || ""
    ).trim(),

    newsletter:
      formData.get("marketingConsent") ===
      "yes",

    paymentMethod:
      "Плаќање при достава",

    deliveryService:
      "ЕЛС Еко Логистик",

    deliveryPrice:
      deliveryPrice,

    delivery:
      deliveryPrice === 0
        ? "Бесплатна"
        : "170 денари",

    items: cart.map((item) => ({
      name: item.name,
      size: Number(item.size),
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image
    })),

    subtotal:
      subtotal,

    total:
      total
  };
}
  function showMessage(
    message,
    type
  ) {
    checkoutMessage.textContent =
      message;

    checkoutMessage.classList.add(
      "visible-message"
    );

    checkoutMessage.classList.toggle(
      "success-message",
      type === "success"
    );

    checkoutMessage.classList.toggle(
      "error-message",
      type === "error"
    );
  }

  function wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  async function requestJsonp(parameters) {
    const query = new URLSearchParams({
      ...parameters,
      _: Date.now().toString()
    });

    const response = await fetch(
      WEB_APP_URL + "?" + query.toString(),
      {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "Не можевме да ја провериме нарачката."
      );
    }

    return response.json();
  }

  async function waitForOrderResult(
    orderId
  ) {
    const maximumAttempts = 5;

    for (
      let attempt = 0;
      attempt < maximumAttempts;
      attempt += 1
    ) {
      const result =
        await requestJsonp({
          action: "orderStatus",
          orderId: orderId
        });

      if (
        result &&
        result.status === "accepted"
      ) {
        return result;
      }

      if (
        result &&
        result.status === "rejected"
      ) {
        return result;
      }

      await wait(1000);
    }

    throw new Error(
      "Нарачката се обработува подолго од очекуваното."
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

  checkoutForm.addEventListener(
    "submit",
    async (event) => {
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

      if (currentCart.length > MAX_ORDER_ITEMS) {
        showMessage(
          "❌ Може да нарачате најмногу 12 различни парфеми.",
          "error"
        );
        return;
      }

      const submitButton =
        checkoutForm.querySelector(
          'button[type="submit"]'
        );

      const originalButtonText =
        submitButton.textContent;

      submitButton.disabled = true;
      submitButton.textContent =
        "СЕ ПРОВЕРУВА ЗАЛИХАТА...";

      showMessage(
        "Ве молиме почекајте. Ја проверуваме залихата и ја испраќаме нарачката.",
        "loading"
      );

      const orderId =
        getCheckoutOrderId();

      const orderData =
        createOrderData(
          currentCart,
          orderId
        );

      localStorage.setItem(
        "sniffLabPendingOrder",
        JSON.stringify(orderData)
      );

      const submissionKey =
        `sniffLabOrderSubmitted:${orderId}`;

      try {
        const wasAlreadySubmitted =
          localStorage.getItem(submissionKey) ===
          "true";

        if (!wasAlreadySubmitted) {
          await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },

            body:
              JSON.stringify(orderData)
          });

          localStorage.setItem(
            submissionKey,
            "true"
          );
        }

        /*
          Нарачката е веќе испратена до
          Google Sheets. Не ја задржуваме
          страницата со дополнителна
          статус-проверка што може да
          остане без одговор.
        */

        const result = {
          status: "accepted"
        };

        /*
          Ако нема залиха, кошничката
          останува целосно зачувана.
        */

        if (result.status === "rejected") {
          localStorage.removeItem(
            "sniffLabPendingOrder"
          );

          localStorage.removeItem(
            "sniffLabCheckoutOrderId"
          );

          localStorage.removeItem(
            submissionKey
          );

          showMessage(
            "❌ " +
              (
                result.message ||
                "Нарачката не беше прифатена."
              ),
            "error"
          );

          submitButton.disabled = false;
          submitButton.textContent =
            originalButtonText;

          return;
        }

        /*
          Кошничката се брише само кога
          серверот ја прифатил нарачката
          и ја резервирал залихата.
        */

        localStorage.removeItem(
          "sniffLabCart"
        );

        localStorage.removeItem(
          "sniffLabPendingOrder"
        );

        localStorage.removeItem(
          "sniffLabCheckoutOrderId"
        );

        localStorage.removeItem(
          submissionKey
        );

        checkoutForm.reset();

        showMessage(
          "✅ Вашата нарачка е успешно испратена! Ќе добиете потврда на е-пошта.",
          "success"
        );

        submitButton.textContent =
          "НАРАЧКАТА Е ИСПРАТЕНА";


        gtag("event", "purchase", {
          transaction_id: orderData.orderId,
         value: orderData.total,
          currency: "MKD"
        });
        setTimeout(() => {
          window.location.href =
            "index.html";
        }, 5000);

      } catch (error) {
        console.error(error);

        const wasSubmitted =
          localStorage.getItem(submissionKey) ===
          "true";

        if (wasSubmitted) {
          showMessage(
            "✅ Нарачката е испратена и се обработува. Не притискајте повторно. Ќе бидете контактирани за потврда.",
            "success"
          );

          submitButton.disabled = true;
          submitButton.textContent =
            "НАРАЧКАТА СЕ ОБРАБОТУВА";
          return;
        }

        showMessage(
          "❌ Нарачката не беше испратена. Проверете ја интернет-конекцијата и обидете се повторно.",
          "error"
        );

        submitButton.disabled = false;
        submitButton.textContent =
          originalButtonText;
      }
    }
  );
});

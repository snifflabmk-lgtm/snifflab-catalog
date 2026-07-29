document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzzphhEJsh5WzE8bSkbyeny4rJVqNrqdK7TvDBBrYpr8FBKAebTU-ydNsFDFCWdOUgG/exec";

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

  function createOrderData(
    cart,
    orderId
  ) {
    const formData =
      new FormData(checkoutForm);

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

      items: cart.map((item) => ({
        name: item.name,
        size: `${item.size} ml`,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image
      })),

      subtotal:
        calculateSubtotal(cart)
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

  function requestJsonp(parameters) {
    return new Promise(
      (resolve, reject) => {
        const callbackName =
          "__sniffLabCallback_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2);

        const script =
          document.createElement("script");

        const query =
          new URLSearchParams({
            ...parameters,
            callback: callbackName,
            _: Date.now().toString()
          });

        let finished = false;

        function cleanup() {
          if (finished) {
            return;
          }

          finished = true;

          clearTimeout(timeout);

          delete window[callbackName];

          if (script.parentNode) {
            script.parentNode.removeChild(
              script
            );
          }
        }

        window[callbackName] =
          function (data) {
            cleanup();
            resolve(data);
          };

        script.onerror = function () {
          cleanup();

          reject(
            new Error(
              "Не можевме да ја провериме нарачката."
            )
          );
        };

        const timeout = setTimeout(() => {
          cleanup();

          reject(
            new Error(
              "Проверката траеше предолго."
            )
          );
        }, 10000);

        script.src =
          WEB_APP_URL +
          "?" +
          query.toString();

        document.body.appendChild(script);
      }
    );
  }

  async function waitForOrderResult(
    orderId
  ) {
    const maximumAttempts = 25;

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

      try {
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

        const result =
          await waitForOrderResult(
            orderId
          );

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

        checkoutForm.reset();

        showMessage(
          "✅ Вашата нарачка е успешно испратена! Ќе добиете потврда на е-пошта.",
          "success"
        );

        submitButton.textContent =
          "НАРАЧКАТА Е ИСПРАТЕНА";


        gtag("event", "purchase", {
          transaction_id: orderData.orderId,
          value: orderData.subtotal,
          currency: "MKD"
        });
        setTimeout(() => {
          window.location.href =
            "index.html";
        }, 5000);

      } catch (error) {
        console.error(error);

        /*
          Бројот на нарачката останува
          зачуван. Ако купувачот притисне
          повторно, нема да се создаде
          дупликат.
        */

        showMessage(
          "❌ Не можевме веднаш да го потврдиме резултатот. Вашата кошничка е зачувана. Почекајте неколку секунди и притиснете повторно.",
          "error"
        );

        submitButton.disabled = false;
        submitButton.textContent =
          originalButtonText;
      }
    }
  );
});

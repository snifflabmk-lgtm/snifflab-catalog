document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzzphhEJsh5WzE8bSkbyeny4rJVqNrqdK7TvDBBrYpr8FBKAebTU-ydNsFDFCWdOUgG/exec";

  const cartItemsContainer =
    document.querySelector("#cart-items");

  const cartSummaryContainer =
    document.querySelector("#cart-summary");

  const emptyCartMessage =
    document.querySelector("#empty-cart");

  let stockByName = new Map();
  let stockIsReady = false;
  let stockCheckFailed = false;

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

    window.dispatchEvent(
      new Event("sniffLabCartUpdated")
    );
  }

  function formatPrice(price) {
    return new Intl.NumberFormat(
      "mk-MK"
    ).format(price);
  }

  function normalizeProductName(name) {
    return String(name || "")
      .toLocaleLowerCase("mk-MK")
      .replace(/[’']/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-zа-ш0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getStockName(item) {
    if (item.productId === "riiffs-freeze") {
      return "Riiffs - Freeze";
    }

    if (item.stockName) {
      return item.stockName;
    }

    if (Array.isArray(window.products)) {
      const product = window.products.find(
        (candidate) =>
          candidate.id === item.productId
      );

      if (product) {
        return product.stockName || product.name;
      }
    }

    return item.name;
  }

  function requestJsonp(parameters) {
    return new Promise((resolve, reject) => {
      const callbackName =
        `sniffLabCartStock_${Date.now()}_${Math.floor(
          Math.random() * 100000
        )}`;

      const script =
        document.createElement("script");

      const url =
        new URL(WEB_APP_URL);

      Object.entries(parameters).forEach(
        ([key, value]) => {
          url.searchParams.set(key, value);
        }
      );

      url.searchParams.set(
        "callback",
        callbackName
      );

      let completed = false;

      function cleanUp() {
        delete window[callbackName];
        script.remove();
      }

      const timeout = window.setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        cleanUp();

        reject(
          new Error("Не може да се провери залихата.")
        );
      }, 12000);

      window[callbackName] = (response) => {
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timeout);
        cleanUp();
        resolve(response);
      };

      script.onerror = () => {
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timeout);
        cleanUp();

        reject(
          new Error("Не може да се провери залихата.")
        );
      };

      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  async function loadStock() {
    const response = await requestJsonp({
      action: "stock"
    });

    if (
      !response ||
      response.success !== true ||
      !Array.isArray(response.products)
    ) {
      throw new Error(
        "Не е добиен валиден одговор за залихата."
      );
    }

    stockByName = new Map(
      response.products.map((product) => {
        return [
          normalizeProductName(product.name),
          Math.max(
            0,
            Number(product.remainingMl) || 0
          )
        ];
      })
    );

    stockIsReady = true;
    stockCheckFailed = false;
  }

  function getRemainingStock(item) {
    const key = normalizeProductName(
      getStockName(item)
    );

    return stockByName.has(key)
      ? stockByName.get(key)
      : null;
  }

  function getRequestedMlForProduct(
    cart,
    targetItem,
    quantityChange = 0
  ) {
    const targetName = normalizeProductName(
      getStockName(targetItem)
    );

    return cart.reduce((total, item) => {
      if (
        normalizeProductName(getStockName(item)) !==
        targetName
      ) {
        return total;
      }

      const extraQuantity =
        item === targetItem
          ? quantityChange
          : 0;

      return (
        total +
        Number(item.size) *
          (Number(item.quantity) + extraQuantity)
      );
    }, 0);
  }

  function getCartStockProblem(cart) {
    if (cart.length > 12) {
      return "Може да нарачате најмногу 12 различни парфеми.";
    }

    if (!stockIsReady) {
      return null;
    }

    for (const item of cart) {
      const remainingStock =
        getRemainingStock(item);

      if (remainingStock === null) {
        return `${item.name} не е пронајден во залихата.`;
      }

      const requestedMl =
        getRequestedMlForProduct(
          cart,
          item
        );

      if (requestedMl > remainingStock) {
        return `${item.name}: во кошничката имате ${requestedMl} ml, а моментално се достапни ${remainingStock} ml.`;
      }
    }

    return null;
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

  function updateHeaderCount(cart) {
    const totalItems = cart.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity)
        );
      },
      0
    );

    document
      .querySelectorAll(
        ".cart-count, .mobile-cart-count"
      )
      .forEach((cartCount) => {
        cartCount.textContent = totalItems;
      });
  }

  function createCartItem(item, index) {
    const itemTotal =
      Number(item.price) *
      Number(item.quantity);

    const remainingStock =
      getRemainingStock(item);

    const requestedMl =
      getRequestedMlForProduct(
        getCart(),
        item
      );

    const stockText =
      !stockIsReady
        ? "Се проверува залихата..."
        : remainingStock === null
          ? "Залихата не може да се пронајде"
          : requestedMl > remainingStock
            ? `Недоволна залиха: достапни ${remainingStock} ml`
            : `Достапни ${remainingStock} ml`;

    const stockClass =
      stockIsReady &&
      (
        remainingStock === null ||
        requestedMl > remainingStock
      )
        ? " cart-stock-error"
        : "";

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

          <strong>
            ${formatPrice(item.price)} денари
          </strong>

          <p class="cart-stock-status${stockClass}">
            ${stockText}
          </p>
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
              ${stockIsReady ? "" : "disabled"}
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
    const subtotal =
      calculateSubtotal(cart);

    const deliveryPrice =
      subtotal >= 2000 ? 0 : 160;

    const total =
      subtotal + deliveryPrice;

    const freeDeliveryRemaining =
      Math.max(2000 - subtotal, 0);

    const mysterySampleRemaining =
      Math.max(1500 - subtotal, 0);

    const mysterySampleMessage =
      subtotal >= 1500
        ? "🎁 Добивате бесплатен mystery sample"
        : `Уште ${formatPrice(
            mysterySampleRemaining
          )} денари до бесплатен mystery sample`;

    const stockProblem =
      getCartStockProblem(cart);

    const stockNotice =
      stockCheckFailed
        ? `
          <p class="cart-stock-warning">
            Во моментов не можеме да ја провериме залихата.
            Освежете ја страницата и обидете се повторно.
          </p>
        `
        : stockProblem
          ? `
            <p class="cart-stock-warning">
              ❌ ${stockProblem}
              Намалете ја количината за да продолжите.
            </p>
          `
          : !stockIsReady
            ? `
              <p class="cart-stock-checking">
                Се проверува достапната залиха...
              </p>
            `
            : "";

    const canCheckout =
      stockIsReady &&
      !stockCheckFailed &&
      !stockProblem;

    return `
      <div class="summary-row">
        <span>Производи</span>

        <strong>
          ${formatPrice(subtotal)} денари
        </strong>
      </div>

      <div class="summary-row">
        <span>Достава</span>

        <strong>
          ${
            deliveryPrice === 0
              ? "Бесплатна"
              : `${formatPrice(deliveryPrice)} денари`
          }
        </strong>
      </div>

      <div class="summary-row">
        <span>Вкупен износ</span>

        <strong>
          ${formatPrice(total)} денари
        </strong>
      </div>

      ${
        subtotal < 2000
          ? `
            <div class="summary-notice">
              🚚 Уште ${formatPrice(
                freeDeliveryRemaining
              )} денари до бесплатна достава
            </div>
          `
          : `
            <div class="summary-notice">
              🚚 Бесплатна достава
            </div>
          `
      }

      <div class="summary-notice">
        ${mysterySampleMessage}
      </div>

      ${stockNotice}

      ${
        canCheckout
          ? `
            <a
              href="checkout.html"
              class="primary-button checkout-button"
            >
              Продолжи кон нарачка
            </a>
          `
          : `
            <button
              type="button"
              class="primary-button checkout-button"
              disabled
            >
              Продолжи кон нарачка
            </button>
          `
      }
    `;
  }

  function renderCart() {
    const cart = getCart();

    updateHeaderCount(cart);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "";
      cartSummaryContainer.innerHTML = "";

      cartSummaryContainer.style.display =
        "none";

      emptyCartMessage.hidden = false;
      return;
    }

    cartSummaryContainer.style.display = "";
    emptyCartMessage.hidden = true;

    cartItemsContainer.innerHTML = cart
      .map(createCartItem)
      .join("");

    cartSummaryContainer.innerHTML =
      createCartSummary(cart);
  }

  cartItemsContainer.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(
        "[data-action]"
      );

      if (!button) {
        return;
      }

      const action = button.dataset.action;

      const index =
        Number(button.dataset.index);

      const cart = getCart();
      const item = cart[index];

      if (!item) {
        return;
      }

      if (action === "increase") {
        if (!stockIsReady) {
          return;
        }

        const remainingStock =
          getRemainingStock(item);

        const requestedAfterIncrease =
          getRequestedMlForProduct(
            cart,
            item,
            1
          );

        if (
          remainingStock === null ||
          requestedAfterIncrease >
            remainingStock
        ) {
          window.alert(
            `Нема доволно залиха. За ${item.name} моментално се достапни ${remainingStock ?? 0} ml.`
          );

          return;
        }

        item.quantity += 1;
      }

      if (action === "decrease") {
        item.quantity -= 1;

        if (item.quantity <= 0) {
          cart.splice(index, 1);
        }
      }

      if (action === "remove") {
        cart.splice(index, 1);
      }

      saveCart(cart);
      renderCart();
    }
  );

  async function initializeCart() {
    renderCart();

    try {
      await loadStock();
    } catch (error) {
      console.error(error);

      stockCheckFailed = true;
      stockIsReady = false;
    }

    renderCart();
  }

  initializeCart();
});
document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzzphhEJsh5WzE8bSkbyeny4rJVqNrqdK7TvDBBrYpr8FBKAebTU-ydNsFDFCWdOUgG/exec";

  const cartItemsContainer =
    document.querySelector("#cart-items");

  const cartSummaryContainer =
    document.querySelector("#cart-summary");

  const emptyCartMessage =
    document.querySelector("#empty-cart");

  let stockByName = new Map();
  let stockIsReady = false;
  let stockCheckFailed = false;

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

    window.dispatchEvent(
      new Event("sniffLabCartUpdated")
    );
  }

  function formatPrice(price) {
    return new Intl.NumberFormat(
      "mk-MK"
    ).format(price);
  }

  function normalizeProductName(name) {
    return String(name || "")
      .toLocaleLowerCase("mk-MK")
      .replace(/[’']/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-zа-ш0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getStockName(item) {
    if (item.stockName) {
      return item.stockName;
    }

    if (Array.isArray(window.products)) {
      const product = window.products.find(
        (candidate) =>
          candidate.id === item.productId
      );

      if (product) {
        return product.stockName || product.name;
      }
    }

    return item.name;
  }

  function requestJsonp(parameters) {
    return new Promise((resolve, reject) => {
      const callbackName =
        `sniffLabCartStock_${Date.now()}_${Math.floor(
          Math.random() * 100000
        )}`;

      const script =
        document.createElement("script");

      const url =
        new URL(WEB_APP_URL);

      Object.entries(parameters).forEach(
        ([key, value]) => {
          url.searchParams.set(key, value);
        }
      );

      url.searchParams.set(
        "callback",
        callbackName
      );

      let completed = false;

      function cleanUp() {
        delete window[callbackName];
        script.remove();
      }

      const timeout = window.setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        cleanUp();

        reject(
          new Error("Не може да се провери залихата.")
        );
      }, 12000);

      window[callbackName] = (response) => {
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timeout);
        cleanUp();
        resolve(response);
      };

      script.onerror = () => {
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timeout);
        cleanUp();

        reject(
          new Error("Не може да се провери залихата.")
        );
      };

      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  async function loadStock() {
    const response = await requestJsonp({
      action: "stock"
    });

    if (
      !response ||
      response.success !== true ||
      !Array.isArray(response.products)
    ) {
      throw new Error(
        "Не е добиен валиден одговор за залихата."
      );
    }

    stockByName = new Map(
      response.products.map((product) => {
        return [
          normalizeProductName(product.name),
          Math.max(
            0,
            Number(product.remainingMl) || 0
          )
        ];
      })
    );

    stockIsReady = true;
    stockCheckFailed = false;
  }

  function getRemainingStock(item) {
    const key = normalizeProductName(
      getStockName(item)
    );

    return stockByName.has(key)
      ? stockByName.get(key)
      : null;
  }

  function getRequestedMlForProduct(
    cart,
    targetItem,
    quantityChange = 0
  ) {
    const targetName = normalizeProductName(
      getStockName(targetItem)
    );

    return cart.reduce((total, item) => {
      if (
        normalizeProductName(getStockName(item)) !==
        targetName
      ) {
        return total;
      }

      const extraQuantity =
        item === targetItem
          ? quantityChange
          : 0;

      return (
        total +
        Number(item.size) *
          (Number(item.quantity) + extraQuantity)
      );
    }, 0);
  }

  function getCartStockProblem(cart) {
    if (cart.length > 12) {
      return "Може да нарачате најмногу 12 различни парфеми.";
    }

    if (!stockIsReady) {
      return null;
    }

    for (const item of cart) {
      const remainingStock =
        getRemainingStock(item);

      if (remainingStock === null) {
        return `${item.name} не е пронајден во залихата.`;
      }

      const requestedMl =
        getRequestedMlForProduct(
          cart,
          item
        );

      if (requestedMl > remainingStock) {
        return `${item.name}: во кошничката имате ${requestedMl} ml, а моментално се достапни ${remainingStock} ml.`;
      }
    }

    return null;
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

  function updateHeaderCount(cart) {
    const totalItems = cart.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity)
        );
      },
      0
    );

    document
      .querySelectorAll(
        ".cart-count, .mobile-cart-count"
      )
      .forEach((cartCount) => {
        cartCount.textContent = totalItems;
      });
  }

  function createCartItem(item, index) {
    const itemTotal =
      Number(item.price) *
      Number(item.quantity);

    const remainingStock =
      getRemainingStock(item);

    const requestedMl =
      getRequestedMlForProduct(
        getCart(),
        item
      );

    const stockText =
      !stockIsReady
        ? "Се проверува залихата..."
        : remainingStock === null
          ? "Залихата не може да се пронајде"
          : requestedMl > remainingStock
            ? `Недоволна залиха: достапни ${remainingStock} ml`
            : `Достапни ${remainingStock} ml`;

    const stockClass =
      stockIsReady &&
      (
        remainingStock === null ||
        requestedMl > remainingStock
      )
        ? " cart-stock-error"
        : "";

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

          <strong>
            ${formatPrice(item.price)} денари
          </strong>

          <p class="cart-stock-status${stockClass}">
            ${stockText}
          </p>
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
              ${stockIsReady ? "" : "disabled"}
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
    const subtotal =
      calculateSubtotal(cart);

    const deliveryPrice =
      subtotal >= 2000 ? 0 : 160;

    const total =
      subtotal + deliveryPrice;

    const freeDeliveryRemaining =
      Math.max(2000 - subtotal, 0);

    const mysterySampleRemaining =
      Math.max(1500 - subtotal, 0);

    const mysterySampleMessage =
      subtotal >= 1500
        ? "🎁 Добивате бесплатен mystery sample"
        : `Уште ${formatPrice(
            mysterySampleRemaining
          )} денари до бесплатен mystery sample`;

    const stockProblem =
      getCartStockProblem(cart);

    const stockNotice =
      stockCheckFailed
        ? `
          <p class="cart-stock-warning">
            Во моментов не можеме да ја провериме залихата.
            Освежете ја страницата и обидете се повторно.
          </p>
        `
        : stockProblem
          ? `
            <p class="cart-stock-warning">
              ❌ ${stockProblem}
              Намалете ја количината за да продолжите.
            </p>
          `
          : !stockIsReady
            ? `
              <p class="cart-stock-checking">
                Се проверува достапната залиха...
              </p>
            `
            : "";

    const canCheckout =
      stockIsReady &&
      !stockCheckFailed &&
      !stockProblem;

    return `
      <div class="summary-row">
        <span>Производи</span>

        <strong>
          ${formatPrice(subtotal)} денари
        </strong>
      </div>

      <div class="summary-row">
        <span>Достава</span>

        <strong>
          ${
            deliveryPrice === 0
              ? "Бесплатна"
              : `${formatPrice(deliveryPrice)} денари`
          }
        </strong>
      </div>

      <div class="summary-row">
        <span>Вкупен износ</span>

        <strong>
          ${formatPrice(total)} денари
        </strong>
      </div>

      ${
        subtotal < 2000
          ? `
            <div class="summary-notice">
              🚚 Уште ${formatPrice(
                freeDeliveryRemaining
              )} денари до бесплатна достава
            </div>
          `
          : `
            <div class="summary-notice">
              🚚 Бесплатна достава
            </div>
          `
      }

      <div class="summary-notice">
        ${mysterySampleMessage}
      </div>

      ${stockNotice}

      ${
        canCheckout
          ? `
            <a
              href="checkout.html"
              class="primary-button checkout-button"
            >
              Продолжи кон нарачка
            </a>
          `
          : `
            <button
              type="button"
              class="primary-button checkout-button"
              disabled
            >
              Продолжи кон нарачка
            </button>
          `
      }
    `;
  }

  function renderCart() {
    const cart = getCart();

    updateHeaderCount(cart);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "";
      cartSummaryContainer.innerHTML = "";

      cartSummaryContainer.style.display =
        "none";

      emptyCartMessage.hidden = false;
      return;
    }

    cartSummaryContainer.style.display = "";
    emptyCartMessage.hidden = true;

    cartItemsContainer.innerHTML = cart
      .map(createCartItem)
      .join("");

    cartSummaryContainer.innerHTML =
      createCartSummary(cart);
  }

  cartItemsContainer.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(
        "[data-action]"
      );

      if (!button) {
        return;
      }

      const action = button.dataset.action;

      const index =
        Number(button.dataset.index);

      const cart = getCart();
      const item = cart[index];

      if (!item) {
        return;
      }

      if (action === "increase") {
        if (!stockIsReady) {
          return;
        }

        const remainingStock =
          getRemainingStock(item);

        const requestedAfterIncrease =
          getRequestedMlForProduct(
            cart,
            item,
            1
          );

        if (
          remainingStock === null ||
          requestedAfterIncrease >
            remainingStock
        ) {
          window.alert(
            `Нема доволно залиха. За ${item.name} моментално се достапни ${remainingStock ?? 0} ml.`
          );

          return;
        }

        item.quantity += 1;
      }

      if (action === "decrease") {
        item.quantity -= 1;

        if (item.quantity <= 0) {
          cart.splice(index, 1);
        }
      }

      if (action === "remove") {
        cart.splice(index, 1);
      }

      saveCart(cart);
      renderCart();
    }
  );

  async function initializeCart() {
    renderCart();

    try {
      await loadStock();
    } catch (error) {
      console.error(error);

      stockCheckFailed = true;
      stockIsReady = false;
    }

    renderCart();
  }

  initializeCart();
});

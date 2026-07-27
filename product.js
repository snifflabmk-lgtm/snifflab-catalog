document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzzphhEJsh5WzE8bSkbyeny4rJVqNrqdK7TvDBBrYpr8FBKAebTU-ydNsFDFCWdOUgG/exec";

  const productContainer =
    document.querySelector("#product-detail");

  const pageTitle =
    document.querySelector("title");

  const params =
    new URLSearchParams(window.location.search);

  const productId = params.get("id");

  const product = window.products.find(
    (item) => item.id === productId
  );

  const seasonIcons = {
    Пролет: "🌸",
    Лето: "☀️",
    Есен: "🍂",
    Зима: "❄️"
  };

  if (!product) {
    productContainer.innerHTML = `
      <div class="product-error">
        <h1>Парфемот не е пронајден</h1>

        <p>
          Производот можеби е отстранет или
          адресата не е точна.
        </p>

        <a
          href="catalog.html"
          class="back-button"
        >
          Назад кон каталогот
        </a>
      </div>
    `;

    return;
  }

  pageTitle.textContent =
    `${product.name} | Sniff Lab`;

  function normalizeProductName(name) {
    return String(name || "")
      .toLocaleLowerCase("mk-MK")
      .replace(/&/g, "and")
      .replace(/[^a-zа-шѓѕјљњќќџ0-9]+/gi, "");
  }

  function isAvailablePrice(price) {
    return (
      price !== null &&
      price !== undefined &&
      Number.isFinite(Number(price)) &&
      Number(price) > 0
    );
  }

  function getCart() {
    return JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );
  }

  function getQuantityAlreadyInCart(size) {
    return getCart()
      .filter((item) => {
        return (
          item.productId === product.id &&
          Number(item.size) === Number(size)
        );
      })
      .reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);
  }

  function requestJsonp(parameters) {
    return new Promise((resolve, reject) => {
      const callbackName =
        `sniffLabStock_${Date.now()}_${Math.floor(
          Math.random() * 100000
        )}`;

      const script =
        document.createElement("script");

      const timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error("Проверката на залихата траеше предолго.")
        );
      }, 12000);

      function cleanup() {
        clearTimeout(timeout);

        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = undefined;
        }
      }

      window[callbackName] = (response) => {
        cleanup();
        resolve(response);
      };

      const url = new URL(WEB_APP_URL);

      Object.entries(parameters).forEach(
        ([key, value]) => {
          url.searchParams.set(key, value);
        }
      );

      url.searchParams.set(
        "callback",
        callbackName
      );

      script.src = url.toString();

      script.onerror = () => {
        cleanup();

        reject(
          new Error("Не може да се провери залихата.")
        );
      };

      document.body.appendChild(script);
    });
  }

  async function getRemainingStock() {
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

    const normalizedProductName =
      normalizeProductName(product.name);

    const stockProduct =
      response.products.find((item) => {
        return (
          normalizeProductName(item.name) ===
          normalizedProductName
        );
      });

    if (!stockProduct) {
      throw new Error(
        "Парфемот не е пронајден во залихата."
      );
    }

    return Math.max(
      0,
      Number(stockProduct.remainingMl) || 0
    );
  }

  function updateVisibleCartCounts(cart) {
    const totalItems = cart.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity || 0)
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

    window.dispatchEvent(
      new Event("sniffLabCartUpdated")
    );
  }

  function renderProduct(remainingStock) {
    const sortedPrices =
      Object.entries(product.prices)
        .sort((first, second) => {
          return (
            Number(first[0]) -
            Number(second[0])
          );
        });

    const availablePrices =
      sortedPrices.filter(
        ([milliliters, price]) => {
          const size = Number(milliliters);

          return (
            isAvailablePrice(price) &&
            remainingStock >= size
          );
        }
      );

    const firstAvailablePrice =
      availablePrices.length > 0
        ? availablePrices[0]
        : null;

    const priceOptions =
      sortedPrices
        .map(([milliliters, price]) => {
          const size = Number(milliliters);

          const hasPrice =
            isAvailablePrice(price);

          const enoughStock =
            remainingStock >= size;

          const isAvailable =
            hasPrice && enoughStock;

          const isFirstAvailable =
            firstAvailablePrice &&
            milliliters ===
              firstAvailablePrice[0];

          let unavailableMessage =
            "Нема на залиха";

          if (
            hasPrice &&
            remainingStock > 0 &&
            remainingStock < size
          ) {
            unavailableMessage =
              `Останати ${remainingStock} ml`;
          }

          return `
            <label
              class="size-option ${
                isAvailable
                  ? ""
                  : "unavailable-size"
              }"
            >
              <input
                type="radio"
                name="product-size"
                value="${milliliters}"
                data-price="${
                  isAvailable ? price : ""
                }"
                ${
                  isFirstAvailable
                    ? "checked"
                    : ""
                }
                ${
                  isAvailable
                    ? ""
                    : "disabled"
                }
              >

              <span>
                <span class="size-name">
                  ${milliliters} ml
                </span>

                ${
                  isAvailable
                    ? ""
                    : `
                      <small class="stock-message">
                        ${unavailableMessage}
                      </small>
                    `
                }
              </span>
            </label>
          `;
        })
        .join("");

    const seasons =
      product.seasons
        .map((season) => {
          return (
            `${seasonIcons[season] || ""} ${season}`
          );
        })
        .join(" | ");

    const initialPriceText =
      firstAvailablePrice
        ? `${firstAvailablePrice[1]} денари`
        : "Нема достапна милилитража";

    const hasAvailableSizes =
      availablePrices.length > 0;

    productContainer.innerHTML = `
      <article class="perfume-details product-shop-details">
        <div class="details-image">
          <img
            src="${product.image}"
            alt="${product.name} парфем"
          >
        </div>

        <div class="details-content">
          <p class="eyebrow">
            ${product.category} ·
            ${product.gender} парфем
          </p>

          <h1>${product.name}</h1>

          <section class="details-section">
            <h2>Сезона</h2>
            <p>${seasons}</p>
          </section>

          <section class="details-section">
            <h2>Ноти</h2>

            <p>
              ${product.notes.join(", ")}.
            </p>
          </section>

          <section class="details-section">
            <h2>Прилика</h2>

            <p>
              ${product.occasions.join(", ")}.
            </p>
          </section>

          <section class="purchase-section">
            <h2>Избери милилитража</h2>

            <div class="size-options">
              ${priceOptions}
            </div>

            <div class="selected-price">
              <span>Цена</span>

              <strong id="current-price">
                ${initialPriceText}
              </strong>
            </div>

            <p class="live-stock-information">
              Моментално достапни:
              <strong>${remainingStock} ml</strong>
            </p>

            <div class="quantity-wrapper">
              <label for="product-quantity">
                Количина
              </label>

              <select
                id="product-quantity"
                ${
                  hasAvailableSizes
                    ? ""
                    : "disabled"
                }
              ></select>
            </div>

            <div class="purchase-actions">
              <button
                type="button"
                id="add-to-cart"
                class="primary-button add-to-cart-button"
                ${
                  hasAvailableSizes
                    ? ""
                    : "disabled"
                }
              >
                🛒 Додај во кошничка
              </button>

              <button
                type="button"
                id="buy-now"
                class="primary-button buy-now-button"
                ${
                  hasAvailableSizes
                    ? ""
                    : "disabled"
                }
              >
                ⚡ Купи веднаш
              </button>
            </div>

            <p
              id="cart-feedback"
              class="cart-feedback"
              aria-live="polite"
            ></p>
          </section>

          <a
            href="catalog.html"
            class="back-button"
          >
            Назад кон каталогот
          </a>
        </div>
      </article>
    `;

    const sizeInputs =
      document.querySelectorAll(
        'input[name="product-size"]:not(:disabled)'
      );

    const currentPrice =
      document.querySelector("#current-price");

    const quantitySelect =
      document.querySelector("#product-quantity");

    const addToCartButton =
      document.querySelector("#add-to-cart");

    const buyNowButton =
      document.querySelector("#buy-now");

    const cartFeedback =
      document.querySelector("#cart-feedback");

    function updateQuantityOptions() {
      const selectedSize =
        document.querySelector(
          'input[name="product-size"]:checked:not(:disabled)'
        );

      quantitySelect.innerHTML = "";

      if (!selectedSize) {
        quantitySelect.disabled = true;
        return;
      }

      const size =
        Number(selectedSize.value);

      const quantityInCart =
        getQuantityAlreadyInCart(size);

      const maximumByStock =
        Math.floor(remainingStock / size);

      const maximumQuantity =
        Math.max(
          0,
          Math.min(
            5,
            maximumByStock - quantityInCart
          )
        );

      if (maximumQuantity === 0) {
        quantitySelect.disabled = true;
        addToCartButton.disabled = true;
        buyNowButton.disabled = true;

        cartFeedback.textContent =
          "Максималната достапна количина веќе се наоѓа во кошничката.";

        return;
      }

      for (
        let quantity = 1;
        quantity <= maximumQuantity;
        quantity += 1
      ) {
        const option =
          document.createElement("option");

        option.value = quantity;
        option.textContent = quantity;

        quantitySelect.appendChild(option);
      }

      quantitySelect.disabled = false;
      addToCartButton.disabled = false;
      buyNowButton.disabled = false;
      cartFeedback.textContent = "";
    }

    sizeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        currentPrice.textContent =
          `${input.dataset.price} денари`;

        updateQuantityOptions();
      });
    });

    function addSelectedProductToCart() {
      const selectedSize =
        document.querySelector(
          'input[name="product-size"]:checked:not(:disabled)'
        );

      if (!selectedSize) {
        cartFeedback.textContent =
          "Избраната милилитража не е достапна.";

        return null;
      }

      const size =
        Number(selectedSize.value);

      const price =
        Number(selectedSize.dataset.price);

      const quantity =
        Number(quantitySelect.value);

      if (
        !quantity ||
        quantity < 1
      ) {
        cartFeedback.textContent =
          "Нема доволно залиха за избраната количина.";

        return null;
      }

      const savedCart = getCart();

      const existingItem =
        savedCart.find((item) => {
          return (
            item.productId === product.id &&
            Number(item.size) === size
          );
        });

      const existingQuantity =
        existingItem
          ? Number(existingItem.quantity || 0)
          : 0;

      const requestedMilliliters =
        (existingQuantity + quantity) * size;

      if (
        requestedMilliliters >
        remainingStock
      ) {
        cartFeedback.textContent =
          `Достапни се уште ${remainingStock} ml. Намалете ја количината.`;

        return null;
      }

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        savedCart.push({
          productId: product.id,
          name: product.name,
          image: product.image,
          size,
          price,
          quantity
        });
      }

      localStorage.setItem(
        "sniffLabCart",
        JSON.stringify(savedCart)
      );

      updateVisibleCartCounts(savedCart);

      return {
        size,
        savedCart
      };
    }

    if (hasAvailableSizes) {
      updateQuantityOptions();
    }

    addToCartButton.addEventListener(
      "click",
      () => {
        const result =
          addSelectedProductToCart();

        if (!result) {
          return;
        }

        cartFeedback.textContent =
          `${product.name} ${result.size} ml е додаден во кошничката.`;

        updateQuantityOptions();

        setTimeout(() => {
          if (
            !quantitySelect.disabled
          ) {
            cartFeedback.textContent = "";
          }
        }, 4000);
      }
    );

    buyNowButton.addEventListener(
      "click",
      () => {
        const result =
          addSelectedProductToCart();

        if (!result) {
          return;
        }

        buyNowButton.disabled = true;

        buyNowButton.textContent =
          "Се отвора наплатата...";

        window.location.href =
          "checkout.html";
      }
    );
  }

  function renderStockError() {
    productContainer.innerHTML = `
      <div class="product-error">
        <h1>${product.name}</h1>

        <p>
          Во моментот не можеме да ја провериме залихата.
          Освежете ја страницата и обидете се повторно.
        </p>

        <button
          type="button"
          class="primary-button"
          id="retry-stock"
        >
          Провери повторно
        </button>

        <a
          href="catalog.html"
          class="back-button"
        >
          Назад кон каталогот
        </a>
      </div>
    `;

    document
      .querySelector("#retry-stock")
      .addEventListener("click", loadProduct);
  }

  async function loadProduct() {
    productContainer.innerHTML = `
      <div class="product-loading">
        <p>Се проверува залихата...</p>
      </div>
    `;

    try {
      const remainingStock =
        await getRemainingStock();

      renderProduct(remainingStock);
    } catch (error) {
      console.error(error);
      renderStockError();
    }
  }

  loadProduct();
});

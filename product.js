document.addEventListener("DOMContentLoaded", () => {
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

  function isAvailablePrice(price) {
    return (
      price !== null &&
      price !== undefined &&
      Number.isFinite(Number(price)) &&
      Number(price) > 0
    );
  }

  const sortedPrices =
    Object.entries(product.prices)
      .sort((first, second) => {
        return (
          Number(first[0]) -
          Number(second[0])
        );
      });

  const availablePrices =
    sortedPrices.filter(([, price]) => {
      return isAvailablePrice(price);
    });

  const firstAvailablePrice =
    availablePrices.length > 0
      ? availablePrices[0]
      : null;

  const priceOptions = sortedPrices
    .map(([milliliters, price]) => {
      const isAvailable =
        isAvailablePrice(price);

      const isFirstAvailable =
        firstAvailablePrice &&
        milliliters === firstAvailablePrice[0];

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
            ${isFirstAvailable ? "checked" : ""}
            ${isAvailable ? "" : "disabled"}
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
                    Нема на залиха
                  </small>
                `
            }
          </span>
        </label>
      `;
    })
    .join("");

  const seasons = product.seasons
    .map((season) => {
      return (
        `${seasonIcons[season] || ""} ${season}`
      );
    })
    .join(" | ");

  const initialPriceText =
    firstAvailablePrice
      ? `${firstAvailablePrice[1]} денари`
      : "Нема на залиха";

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

          <div class="quantity-wrapper">
            <label for="product-quantity">
              Количина
            </label>

            <select
              id="product-quantity"
              ${hasAvailableSizes ? "" : "disabled"}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div class="purchase-actions">
            <button
              type="button"
              id="add-to-cart"
              class="primary-button add-to-cart-button"
              ${hasAvailableSizes ? "" : "disabled"}
            >
              🛒 Додај во кошничка
            </button>

            <button
              type="button"
              id="buy-now"
              class="primary-button buy-now-button"
              ${hasAvailableSizes ? "" : "disabled"}
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
    document.querySelector(
      "#current-price"
    );

  const quantitySelect =
    document.querySelector(
      "#product-quantity"
    );

  const addToCartButton =
    document.querySelector(
      "#add-to-cart"
    );

  const buyNowButton =
    document.querySelector(
      "#buy-now"
    );

  const cartFeedback =
    document.querySelector(
      "#cart-feedback"
    );

  sizeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPrice.textContent =
        `${input.dataset.price} денари`;
    });
  });

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
        cartCount.textContent =
          totalItems;
      });

    window.dispatchEvent(
      new Event("sniffLabCartUpdated")
    );
  }

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

    const savedCart = JSON.parse(
      localStorage.getItem(
        "sniffLabCart"
      ) || "[]"
    );

    const existingItem =
      savedCart.find((item) => {
        return (
          item.productId === product.id &&
          item.size === size
        );
      });

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

      setTimeout(() => {
        cartFeedback.textContent = "";
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
});

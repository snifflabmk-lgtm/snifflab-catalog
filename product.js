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
          Производот можеби е отстранет или адресата не е точна.
        </p>

        <a href="catalog.html" class="back-button">
          Назад кон каталогот
        </a>
      </div>
    `;

    return;
  }

  pageTitle.textContent =
    `${product.name} | Sniff Lab`;

  const priceOptions =
    Object.entries(product.prices)
      .sort((first, second) => {
        return (
          Number(first[0]) -
          Number(second[0])
        );
      })
      .map(
        ([milliliters, price], index) => {
          return `
            <label class="size-option">
              <input
                type="radio"
                name="product-size"
                value="${milliliters}"
                data-price="${price}"
                ${index === 0 ? "checked" : ""}
              >

              <span>
                ${milliliters} ml
              </span>
            </label>
          `;
        }
      )
      .join("");

  const seasons = product.seasons
    .map((season) => {
      return (
        `${seasonIcons[season] || ""} ${season}`
      );
    })
    .join(" | ");

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
          <p>${product.notes.join(", ")}.</p>
        </section>

        <section class="details-section">
          <h2>Прилика</h2>
          <p>${product.occasions.join(", ")}.</p>
        </section>

        <section class="purchase-section">
          <h2>Избери милилитража</h2>

          <div class="size-options">
            ${priceOptions}
          </div>

          <div class="selected-price">
            <span>Цена</span>

            <strong id="current-price">
              ${Object.values(product.prices)[0]}
              денари
            </strong>
          </div>

          <div class="quantity-wrapper">
            <label for="product-quantity">
              Количина
            </label>

            <select id="product-quantity">
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
            >
              🛒 Додај во кошничка
            </button>

            <button
              type="button"
              id="buy-now"
              class="primary-button buy-now-button"
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

        <a href="catalog.html" class="back-button">
          Назад кон каталогот
        </a>
      </div>
    </article>
  `;

  const sizeInputs =
    document.querySelectorAll(
      'input[name="product-size"]'
    );

  const currentPrice =
    document.querySelector("#current-price");

  const quantitySelect =
    document.querySelector(
      "#product-quantity"
    );

  const addToCartButton =
    document.querySelector("#add-to-cart");

  const buyNowButton =
    document.querySelector("#buy-now");

  const cartFeedback =
    document.querySelector("#cart-feedback");

  sizeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPrice.textContent =
        `${input.dataset.price} денари`;
    });
  });

  function addSelectedProductToCart() {
    const selectedSize =
      document.querySelector(
        'input[name="product-size"]:checked'
      );

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

    const cartCount =
      document.querySelector(
        ".cart-count"
      );

    if (cartCount) {
      const totalItems =
        savedCart.reduce(
          (total, item) => {
            return total + item.quantity;
          },
          0
        );

      cartCount.textContent = totalItems;
    }

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
      addSelectedProductToCart();

      buyNowButton.disabled = true;
      buyNowButton.textContent =
        "Се отвора наплатата...";

      window.location.href =
        "checkout.html";
    }
  );
});

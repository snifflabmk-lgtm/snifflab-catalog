document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");
  const searchInput = document.querySelector("#product-search");
  const filterButtons = document.querySelectorAll("[data-category]");
  const resultsMessage = document.querySelector("#results-message");

  let activeCategory = "site";
  let searchTerm = "";

  function normalizeText(text) {
    return text
      .toLocaleLowerCase("mk-MK")
      .trim();
  }

  function getFilteredProducts() {
    return window.products.filter((product) => {
      const matchesCategory =
        activeCategory === "site" ||
        product.categorySlug === activeCategory;

      const searchableText = normalizeText(
        [
          product.name,
          product.brand,
          product.category,
          product.gender,
          ...product.notes
        ].join(" ")
      );

      const matchesSearch =
        searchTerm === "" ||
        searchableText.includes(normalizeText(searchTerm));

      return matchesCategory && matchesSearch;
    });
  }

  function createProductCard(product) {
    return `
      <article class="collection-card">
        <div class="collection-image">
          <img
            src="${product.image}"
            alt="${product.name} парфем"
            loading="lazy"
          >
        </div>

        <div class="collection-info">
          <span class="product-category">
            ${product.category}
          </span>

          <h2>${product.name}</h2>
          <p>${product.gender} парфем</p>

          <a
            href="product.html?id=${product.id}"
            class="details-button"
          >
            Детали
          </a>
        </div>
      </article>
    `;
  }

  function renderProducts() {
    const filteredProducts = getFilteredProducts();

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = `
        <div class="no-results">
          <h2>Нема пронајдени парфеми</h2>
          <p>
            Обиди се со друго име или избери друга категорија.
          </p>
        </div>
      `;

      resultsMessage.textContent = "0 пронајдени парфеми";
      return;
    }

    productGrid.innerHTML = filteredProducts
      .map(createProductCard)
      .join("");

    resultsMessage.textContent =
      `${filteredProducts.length} пронајдени парфеми`;
  }

  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProducts();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;

      filterButtons.forEach((item) => {
        item.classList.remove("active-filter");
      });

      button.classList.add("active-filter");
      renderProducts();
    });
  });

  renderProducts();
});

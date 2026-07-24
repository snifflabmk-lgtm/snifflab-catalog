document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");
  const searchInput = document.querySelector("#product-search");
  const filterButtons = document.querySelectorAll("[data-category]");
  const resultsMessage = document.querySelector("#results-message");

  const productsPerPage = 8;

  let activeCategory = "site";
  let searchTerm = "";
  let currentPage = 1;

  const paginationContainer = document.createElement("nav");

  paginationContainer.id = "catalog-pagination";
  paginationContainer.className = "catalog-pagination";
  paginationContainer.setAttribute(
    "aria-label",
    "Страници од каталогот"
  );

  productGrid.insertAdjacentElement(
    "afterend",
    paginationContainer
  );

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

  function createProductBadges(product) {
    const badges = product.badges || [];

    if (badges.length === 0) {
      return "";
    }

    return `
      <div class="product-badges">
        ${badges
          .map((badge) => {
            if (badge === "new") {
              return `
                <span class="product-badge badge-new">
                  NEW
                </span>
              `;
            }

            if (badge === "bestseller") {
              return `
                <span class="product-badge badge-bestseller">
                  BESTSELLER
                </span>
              `;
            }

            if (badge === "top") {
              return `
                <span class="product-badge badge-top">
                  TOP
                </span>
              `;
            }

            return "";
          })
          .join("")}
      </div>
    `;
  }

  function createProductCard(product) {
    return `
      <article class="collection-card">
        <div class="collection-image">
          ${createProductBadges(product)}

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

  function createPagination(totalPages) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;
      return;
    }

    paginationContainer.hidden = false;

    const pageButtons = Array.from(
      { length: totalPages },
      (_, index) => {
        const pageNumber = index + 1;

        return `
          <button
            type="button"
            class="pagination-button ${
              pageNumber === currentPage
                ? "active-page"
                : ""
            }"
            data-page="${pageNumber}"
            aria-label="Отвори страница ${pageNumber}"
            ${
              pageNumber === currentPage
                ? 'aria-current="page"'
                : ""
            }
          >
            ${pageNumber}
          </button>
        `;
      }
    ).join("");

    paginationContainer.innerHTML = `
      <button
        type="button"
        class="pagination-button pagination-navigation"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
      >
        ‹ Претходна
      </button>

      <div class="pagination-numbers">
        ${pageButtons}
      </div>

      <button
        type="button"
        class="pagination-button pagination-navigation"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        Следна ›
      </button>
    `;
  }

  function renderProducts(shouldScroll = false) {
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

      resultsMessage.textContent =
        "0 пронајдени парфеми";

      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;

      return;
    }

    const totalPages = Math.ceil(
      filteredProducts.length / productsPerPage
    );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex =
      (currentPage - 1) * productsPerPage;

    const productsForCurrentPage =
      filteredProducts.slice(
        startIndex,
        startIndex + productsPerPage
      );

    productGrid.innerHTML = productsForCurrentPage
      .map(createProductCard)
      .join("");

    resultsMessage.textContent =
      `${filteredProducts.length} пронајдени парфеми · Страница ${currentPage} од ${totalPages}`;

    createPagination(totalPages);

    if (shouldScroll) {
      const collectionHeading = document.querySelector(
        ".collection-heading"
      );

      if (collectionHeading) {
        collectionHeading.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      searchTerm = event.target.value;
      currentPage = 1;
      renderProducts();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      currentPage = 1;

      filterButtons.forEach((item) => {
        item.classList.remove("active-filter");
      });

      button.classList.add("active-filter");
      renderProducts();
    });
  });

  paginationContainer.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-page]");

      if (!button || button.disabled) {
        return;
      }

      const selectedPage = Number(button.dataset.page);
      const filteredProducts = getFilteredProducts();

      const totalPages = Math.ceil(
        filteredProducts.length / productsPerPage
      );

      if (
        selectedPage < 1 ||
        selectedPage > totalPages ||
        selectedPage === currentPage
      ) {
        return;
      }

      currentPage = selectedPage;
      renderProducts(true);
    }
  );

  renderProducts();
});

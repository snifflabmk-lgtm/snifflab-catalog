document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");
  const searchInput = document.querySelector("#product-search");
  const resultsMessage = document.querySelector("#results-message");

  const categoryButtons = document.querySelectorAll(
    "[data-category]"
  );

  const seasonButtons = document.querySelectorAll(
    "[data-season]"
  );

  const badgeButtons = document.querySelectorAll(
    "[data-badge]"
  );

  const filterToggle = document.querySelector(
    "#filter-toggle"
  );

  const filterPanel = document.querySelector(
    "#filter-panel"
  );

  const filterOverlay = document.querySelector(
    "#filter-overlay"
  );

  const filterClose = document.querySelector(
    "#filter-close"
  );

  const clearFiltersButton = document.querySelector(
    "#clear-filters"
  );

  const showFilteredProductsButton =
    document.querySelector(
      "#show-filtered-products"
    );

  const activeFilterCount = document.querySelector(
    "#active-filter-count"
  );

  const productsPerPage = 8;

  let activeCategory = "site";
  let activeSeason = "site";
  let activeBadge = "site";
  let searchTerm = "";
  let currentPage = 1;

  const paginationContainer =
    document.createElement("nav");

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
    return String(text)
      .toLocaleLowerCase("mk-MK")
      .trim();
  }

  function getFilteredProducts() {
    return window.products.filter((product) => {
      const matchesCategory =
        activeCategory === "site" ||
        product.categorySlug === activeCategory;

      const productSeasons = product.seasons || [];

      const matchesSeason =
        activeSeason === "site" ||
        productSeasons.includes(activeSeason);

      const productBadges = product.badges || [];

      const matchesBadge =
        activeBadge === "site" ||
        productBadges.includes(activeBadge);

      const searchableText = normalizeText(
        [
          product.name,
          product.brand,
          product.category,
          product.gender,
          ...(product.notes || []),
          ...(product.seasons || []),
          ...(product.occasions || [])
        ].join(" ")
      );

      const matchesSearch =
        searchTerm === "" ||
        searchableText.includes(
          normalizeText(searchTerm)
        );

      return (
        matchesCategory &&
        matchesSeason &&
        matchesBadge &&
        matchesSearch
      );
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

  function updateActiveFilterCount() {
    let count = 0;

    if (activeCategory !== "site") {
      count += 1;
    }

    if (activeSeason !== "site") {
      count += 1;
    }

    if (activeBadge !== "site") {
      count += 1;
    }

    activeFilterCount.textContent = count;
    activeFilterCount.hidden = count === 0;
  }

  function setActiveButton(buttons, activeButton) {
    buttons.forEach((button) => {
      button.classList.remove("active-filter");
    });

    activeButton.classList.add("active-filter");
  }

  function openFilterPanel() {
    filterPanel.classList.add("filter-panel-open");
    filterOverlay.hidden = false;

    filterPanel.setAttribute(
      "aria-hidden",
      "false"
    );

    filterToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    document.body.classList.add(
      "filters-are-open"
    );
  }

  function closeFilterPanel() {
    filterPanel.classList.remove("filter-panel-open");
    filterOverlay.hidden = true;

    filterPanel.setAttribute(
      "aria-hidden",
      "true"
    );

    filterToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "filters-are-open"
    );
  }

  function renderProducts(shouldScroll = false) {
    const filteredProducts = getFilteredProducts();

    updateActiveFilterCount();

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = `
        <div class="no-results">
          <h2>Нема пронајдени парфеми</h2>

          <p>
            Обиди се со други филтри или пребарај друго име.
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
      const collectionHeading =
        document.querySelector(
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

  function clearAllFilters() {
    activeCategory = "site";
    activeSeason = "site";
    activeBadge = "site";
    currentPage = 1;

    categoryButtons.forEach((button) => {
      button.classList.toggle(
        "active-filter",
        button.dataset.category === "site"
      );
    });

    seasonButtons.forEach((button) => {
      button.classList.toggle(
        "active-filter",
        button.dataset.season === "site"
      );
    });

    badgeButtons.forEach((button) => {
      button.classList.toggle(
        "active-filter",
        button.dataset.badge === "site"
      );
    });

    renderProducts();
  }

  if (filterToggle) {
    filterToggle.addEventListener(
      "click",
      openFilterPanel
    );
  }

  if (filterClose) {
    filterClose.addEventListener(
      "click",
      closeFilterPanel
    );
  }

  if (filterOverlay) {
    filterOverlay.addEventListener(
      "click",
      closeFilterPanel
    );
  }

  if (showFilteredProductsButton) {
    showFilteredProductsButton.addEventListener(
      "click",
      closeFilterPanel
    );
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener(
      "click",
      clearAllFilters
    );
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFilterPanel();
    }
  });

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      (event) => {
        searchTerm = event.target.value;
        currentPage = 1;
        renderProducts();
      }
    );
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      currentPage = 1;

      setActiveButton(
        categoryButtons,
        button
      );

      renderProducts();
    });
  });

  seasonButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeSeason = button.dataset.season;
      currentPage = 1;

      setActiveButton(
        seasonButtons,
        button
      );

      renderProducts();
    });
  });

  badgeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeBadge = button.dataset.badge;
      currentPage = 1;

      setActiveButton(
        badgeButtons,
        button
      );

      renderProducts();
    });
  });

  paginationContainer.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(
        "[data-page]"
      );

      if (!button || button.disabled) {
        return;
      }

      const selectedPage = Number(
        button.dataset.page
      );

      const filteredProducts =
        getFilteredProducts();

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

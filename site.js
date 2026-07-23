document.addEventListener("DOMContentLoaded", () => {
  const announcementMessage = document.querySelector(
    ".announcement-message"
  );

  const announcementArrows = document.querySelectorAll(
    ".announcement-arrow"
  );

  const announcements = [
    "✨ 100% оригинални парфеми — тестирај пред да купиш цело шише",
    "🚚 Бесплатна достава за нарачки над 2.000 денари",
    "🎁 Бесплатен mystery sample за нарачки над 1.500 денари"
  ];

  let activeAnnouncement = 0;
  let announcementTimer;

  function showAnnouncement(index) {
    activeAnnouncement =
      (index + announcements.length) % announcements.length;

    if (announcementMessage) {
      announcementMessage.classList.add("changing");

      setTimeout(() => {
        announcementMessage.textContent =
          announcements[activeAnnouncement];

        announcementMessage.classList.remove("changing");
      }, 180);
    }
  }

  function startAnnouncementTimer() {
    clearInterval(announcementTimer);

    announcementTimer = setInterval(() => {
      showAnnouncement(activeAnnouncement + 1);
    }, 4500);
  }

  if (announcementArrows.length === 2) {
    announcementArrows[0].addEventListener("click", () => {
      showAnnouncement(activeAnnouncement - 1);
      startAnnouncementTimer();
    });

    announcementArrows[1].addEventListener("click", () => {
      showAnnouncement(activeAnnouncement + 1);
      startAnnouncementTimer();
    });
  }

  if (announcementMessage) {
    showAnnouncement(0);
    startAnnouncementTimer();
  }

  /* Search */

  const navigation = document.querySelector(".navigation");

  const searchToggle =
    document.querySelector("#search-toggle") ||
    document.querySelector(
      'a[href="catalog.html?search=open"]'
    );

  let searchPanel = document.querySelector(
    "#header-search-panel"
  );

  let globalSearchInput;

  if (searchToggle && navigation) {
    searchToggle.addEventListener("click", (event) => {
      event.preventDefault();

      if (!searchPanel) {
        searchPanel = document.createElement("div");
        searchPanel.id = "header-search-panel";
        searchPanel.className = "header-search-panel";

        searchPanel.innerHTML = `
          <form id="header-search-form" class="header-search-form">
            <span aria-hidden="true">🔍</span>

            <input
              id="header-global-search"
              type="search"
              placeholder="Напиши име"
              autocomplete="off"
              aria-label="Напиши име на парфем"
            >

            <button
              type="button"
              id="close-header-search"
              aria-label="Затвори пребарување"
            >
              ×
            </button>
          </form>
        `;

        document.body.appendChild(searchPanel);

        globalSearchInput = document.querySelector(
          "#header-global-search"
        );

        const searchForm = document.querySelector(
          "#header-search-form"
        );

        const closeSearchButton = document.querySelector(
          "#close-header-search"
        );

        searchForm.addEventListener("submit", (submitEvent) => {
          submitEvent.preventDefault();

          const searchValue = globalSearchInput.value.trim();

          if (!searchValue) {
            globalSearchInput.focus();
            return;
          }

          const catalogSearchInput = document.querySelector(
            "#product-search"
          );

          if (catalogSearchInput) {
            catalogSearchInput.value = searchValue;

            catalogSearchInput.dispatchEvent(
              new Event("input", {
                bubbles: true
              })
            );

            closeSearch();
            catalogSearchInput.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });

            return;
          }

          window.location.href =
            `catalog.html?search=${encodeURIComponent(searchValue)}`;
        });

        closeSearchButton.addEventListener("click", () => {
          closeSearch();
        });
      }

      const isOpen = searchPanel.classList.toggle(
        "search-open"
      );

      searchToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      if (isOpen) {
        globalSearchInput =
          document.querySelector("#header-global-search");

        setTimeout(() => {
          globalSearchInput.focus();
        }, 100);
      }
    });
  }

  function closeSearch() {
    if (!searchPanel) {
      return;
    }

    searchPanel.classList.remove("search-open");

    if (searchToggle) {
      searchToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSearch();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      searchPanel &&
      searchPanel.classList.contains("search-open") &&
      !searchPanel.contains(event.target) &&
      !searchToggle.contains(event.target)
    ) {
      closeSearch();
    }
  });

  /* Пребарување през URL */

  const urlSearchValue = new URLSearchParams(
    window.location.search
  ).get("search");

  const catalogSearchInput = document.querySelector(
    "#product-search"
  );

  if (
    urlSearchValue &&
    urlSearchValue !== "open" &&
    catalogSearchInput
  ) {
    setTimeout(() => {
      catalogSearchInput.value = urlSearchValue;

      catalogSearchInput.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }, 150);
  }

  /* Кошничка */

  const cartCount = document.querySelector(".cart-count");

  function updateCartCount() {
    if (!cartCount) {
      return;
    }

    const savedCart = JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );

    const totalItems = savedCart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

    cartCount.textContent = totalItems;
  }

  updateCartCount();

  window.addEventListener(
    "storage",
    updateCartCount
  );
});

document.addEventListener("DOMContentLoaded", () => {
  /* Горна лента */

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

    if (!announcementMessage) {
      return;
    }

    announcementMessage.classList.add("changing");

    setTimeout(() => {
      announcementMessage.textContent =
        announcements[activeAnnouncement];

      announcementMessage.classList.remove("changing");
    }, 180);
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

  function prepareSearchPanel() {
    if (!searchPanel) {
      searchPanel = document.createElement("div");
      searchPanel.id = "header-search-panel";
      searchPanel.className = "header-search-panel";

      document.body.appendChild(searchPanel);
    }

    if (!searchPanel.querySelector("#header-global-search")) {
      searchPanel.innerHTML = `
        <form
          id="header-search-form"
          class="header-search-form"
        >
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
    }

    const globalSearchInput = searchPanel.querySelector(
      "#header-global-search"
    );

    const searchForm = searchPanel.querySelector(
      "#header-search-form"
    );

    const closeSearchButton = searchPanel.querySelector(
      "#close-header-search"
    );

    if (!searchForm.dataset.ready) {
      searchForm.dataset.ready = "true";

      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const searchValue =
          globalSearchInput.value.trim();

        if (!searchValue) {
          globalSearchInput.focus();
          return;
        }

        const catalogSearchInput =
          document.querySelector("#product-search");

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

    return globalSearchInput;
  }

  if (searchToggle && navigation) {
    searchToggle.addEventListener("click", (event) => {
      event.preventDefault();

      const globalSearchInput =
        prepareSearchPanel();

      const isOpen = searchPanel.classList.toggle(
        "search-open"
      );

      searchToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      if (isOpen) {
        setTimeout(() => {
          globalSearchInput.focus();
        }, 100);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSearch();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      searchPanel &&
      searchToggle &&
      searchPanel.classList.contains("search-open") &&
      !searchPanel.contains(event.target) &&
      !searchToggle.contains(event.target)
    ) {
      closeSearch();
    }
  });

  /* Пребарување преку URL */

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
    }, 250);
  }

  /* Број на производи во кошничка */

  const cartCounts = document.querySelectorAll(
    ".cart-count"
  );

  function updateCartCount() {
    const savedCart = JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );

    const totalItems = savedCart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

    cartCounts.forEach((cartCount) => {
      cartCount.textContent = totalItems;
    });
  }

  updateCartCount();

  window.addEventListener(
    "storage",
    updateCartCount
  );

  /* Instagram и TikTok на сите стандардни страници */

  const standardFooter = document.querySelector(
    ".footer"
  );

  if (
    standardFooter &&
    !standardFooter.querySelector(
      ".global-footer-socials"
    )
  ) {
    const socialLinks = document.createElement("div");

    socialLinks.className = "global-footer-socials";

    socialLinks.innerHTML = `
      <a
        href="https://www.instagram.com/snifflab.mk/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Instagram"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
          ></rect>

          <circle
            cx="12"
            cy="12"
            r="4"
          ></circle>

          <circle
            cx="17.4"
            cy="6.7"
            r="1"
            class="global-footer-icon-fill"
          ></circle>
        </svg>
      </a>

      <a
        href="https://www.tiktok.com/@snifflab.mk"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
        title="TikTok"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M14 4v10.2a4.6 4.6 0 1 1-4-4.55v3.1a1.7 1.7 0 1 0 1 1.55V4h3Zm0 0c.35 2.1 1.65 3.4 3.8 3.8V11A7.8 7.8 0 0 1 14 9.45"
          ></path>
        </svg>
      </a>
    `;

    standardFooter.appendChild(socialLinks);
  }
});

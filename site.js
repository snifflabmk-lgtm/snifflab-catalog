/* Автоматски го вчитуваме стилот за новото мени */

if (
  !document.querySelector(
    'link[href*="mobile-menu.css"]'
  )
) {
  const mobileMenuStyles =
    document.createElement("link");

  mobileMenuStyles.rel = "stylesheet";
  mobileMenuStyles.href = "mobile-menu.css?v=1";

  document.head.appendChild(mobileMenuStyles);
}

document.addEventListener("DOMContentLoaded", () => {
  /* Горна информативна лента */

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
      (index + announcements.length) %
      announcements.length;

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
    announcementArrows[0].addEventListener(
      "click",
      () => {
        showAnnouncement(activeAnnouncement - 1);
        startAnnouncementTimer();
      }
    );

    announcementArrows[1].addEventListener(
      "click",
      () => {
        showAnnouncement(activeAnnouncement + 1);
        startAnnouncementTimer();
      }
    );
  }

  if (announcementMessage) {
    showAnnouncement(0);
    startAnnouncementTimer();
  }

  /* Основни елементи */

  const header = document.querySelector(
    ".header, .catalog-header, .details-header"
  );

  const navigation = document.querySelector(
    ".navigation"
  );

  const originalSearchToggle =
    document.querySelector("#search-toggle") ||
    document.querySelector(
      'a[href="catalog.html?search=open"]'
    );

  let searchPanel = document.querySelector(
    "#header-search-panel"
  );

  let menuButton;
  let mobileSearchButton;
  let overlay;

  /* Search прозорец */

  function closeSearch() {
    if (!searchPanel) {
      return;
    }

    searchPanel.classList.remove("search-open");

    if (originalSearchToggle) {
      originalSearchToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    if (mobileSearchButton) {
      mobileSearchButton.setAttribute(
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

    if (
      !searchPanel.querySelector(
        "#header-global-search"
      )
    ) {
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

    const globalSearchInput =
      searchPanel.querySelector(
        "#header-global-search"
      );

    const searchForm =
      searchPanel.querySelector(
        "#header-search-form"
      );

    const closeSearchButton =
      searchPanel.querySelector(
        "#close-header-search"
      );

    if (!searchForm.dataset.ready) {
      searchForm.dataset.ready = "true";

      searchForm.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          const searchValue =
            globalSearchInput.value.trim();

          if (!searchValue) {
            globalSearchInput.focus();
            return;
          }

          const catalogSearchInput =
            document.querySelector(
              "#product-search"
            );

          if (catalogSearchInput) {
            catalogSearchInput.value =
              searchValue;

            catalogSearchInput.dispatchEvent(
              new Event("input", {
                bubbles: true
              })
            );

            closeSearch();

            document
              .querySelector(".collection-main")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            return;
          }

          window.location.href =
            `catalog.html?search=${encodeURIComponent(
              searchValue
            )}`;
        }
      );

      closeSearchButton.addEventListener(
        "click",
        closeSearch
      );
    }

    return globalSearchInput;
  }

  function toggleSearch() {
    closeMenu();

    const globalSearchInput =
      prepareSearchPanel();

    const isOpen =
      searchPanel.classList.toggle(
        "search-open"
      );

    if (originalSearchToggle) {
      originalSearchToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }

    if (mobileSearchButton) {
      mobileSearchButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }

    if (isOpen) {
      setTimeout(() => {
        globalSearchInput.focus();
      }, 100);
    }
  }

  if (originalSearchToggle) {
    originalSearchToggle.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        toggleSearch();
      }
    );
  }

  /* Hamburger header */

  if (header && navigation) {
    menuButton = document.createElement("button");

    menuButton.type = "button";
    menuButton.className = "mobile-menu-button";
    menuButton.setAttribute(
      "aria-label",
      "Отвори мени"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    menuButton.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;

    header.insertBefore(
      menuButton,
      header.firstElementChild
    );

    /* Search и кошничка десно */

    const mobileActions =
      document.createElement("div");

    mobileActions.className =
      "mobile-header-actions";

    mobileActions.innerHTML = `
      <button
        type="button"
        class="mobile-search-button"
        aria-label="Пребарај парфем"
        aria-expanded="false"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="10.8"
            cy="10.8"
            r="6.8"
          ></circle>

          <path d="m16 16 4.5 4.5"></path>
        </svg>
      </button>

      <a
        href="cart.html"
        class="mobile-cart-button"
        aria-label="Отвори кошничка"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 8h14l-1 12H6L5 8Z"
          ></path>

          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
          ></path>
        </svg>

        <span class="mobile-cart-count">
          0
        </span>
      </a>
    `;

    header.appendChild(mobileActions);

    mobileSearchButton =
      mobileActions.querySelector(
        ".mobile-search-button"
      );

    mobileSearchButton.addEventListener(
      "click",
      toggleSearch
    );

    /* Копче X во менито */

    const closeMenuButton =
      document.createElement("button");

    closeMenuButton.type = "button";
    closeMenuButton.className =
      "mobile-menu-close";

    closeMenuButton.setAttribute(
      "aria-label",
      "Затвори мени"
    );

    closeMenuButton.textContent = "×";

    navigation.prepend(closeMenuButton);

    /* Instagram и TikTok во менито */

    const menuSocials =
      document.createElement("div");

    menuSocials.className =
      "mobile-menu-socials";

    menuSocials.innerHTML = `
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
            class="mobile-social-fill"
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

    navigation.appendChild(menuSocials);

    /* Темна позадина */

    overlay = document.createElement("div");
    overlay.className = "mobile-menu-overlay";

    document.body.appendChild(overlay);

    menuButton.addEventListener(
      "click",
      openMenu
    );

    closeMenuButton.addEventListener(
      "click",
      closeMenu
    );

    overlay.addEventListener(
      "click",
      closeMenu
    );

    navigation
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener(
          "click",
          closeMenu
        );
      });
  }

  function openMenu() {
    if (!navigation || !overlay) {
      return;
    }

    closeSearch();

    navigation.classList.add(
      "mobile-menu-open"
    );

    overlay.classList.add(
      "menu-overlay-visible"
    );

    document.body.classList.add(
      "menu-active"
    );

    menuButton?.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  function closeMenu() {
    if (!navigation || !overlay) {
      return;
    }

    navigation.classList.remove(
      "mobile-menu-open"
    );

    overlay.classList.remove(
      "menu-overlay-visible"
    );

    document.body.classList.remove(
      "menu-active"
    );

    menuButton?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  /* Escape ги затвора Search и менито */

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeSearch();
        closeMenu();
      }
    }
  );

  document.addEventListener(
    "click",
    (event) => {
      if (
        searchPanel &&
        searchPanel.classList.contains(
          "search-open"
        ) &&
        !searchPanel.contains(event.target) &&
        !originalSearchToggle?.contains(
          event.target
        ) &&
        !mobileSearchButton?.contains(
          event.target
        )
      ) {
        closeSearch();
      }
    }
  );

  /* Пребарување преку URL */

  const urlSearchValue =
    new URLSearchParams(
      window.location.search
    ).get("search");

  const catalogSearchInput =
    document.querySelector(
      "#product-search"
    );

  if (
    urlSearchValue &&
    urlSearchValue !== "open" &&
    catalogSearchInput
  ) {
    setTimeout(() => {
      catalogSearchInput.value =
        urlSearchValue;

      catalogSearchInput.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }, 250);
  }

  /* Број во кошничка */

  function updateCartCount() {
    const savedCart = JSON.parse(
      localStorage.getItem(
        "sniffLabCart"
      ) || "[]"
    );

    const totalItems = savedCart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

    document
      .querySelectorAll(
        ".cart-count, .mobile-cart-count"
      )
      .forEach((countElement) => {
        countElement.textContent =
          totalItems;
      });
  }

  updateCartCount();

  window.addEventListener(
    "storage",
    updateCartCount
  );

  window.addEventListener(
    "sniffLabCartUpdated",
    updateCartCount
  );

  /* Instagram и TikTok во footer */

  const standardFooter =
    document.querySelector(".footer");

  if (
    standardFooter &&
    !standardFooter.querySelector(
      ".global-footer-socials"
    )
  ) {
    const socialLinks =
      document.createElement("div");

    socialLinks.className =
      "global-footer-socials";

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

    standardFooter.appendChild(
      socialLinks
    );
  }
});

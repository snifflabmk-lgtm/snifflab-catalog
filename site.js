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

  const searchToggle = document.querySelector("#search-toggle");
  const searchPanel = document.querySelector("#header-search-panel");
  const searchInput = document.querySelector("#product-search");

  if (searchToggle && searchPanel && searchInput) {
    searchToggle.addEventListener("click", () => {
      const isOpen = searchPanel.classList.toggle("search-open");

      searchToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      if (isOpen) {
        setTimeout(() => {
          searchInput.focus();
        }, 100);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        searchPanel.classList.remove("search-open");
        searchToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const cartCount = document.querySelector(".cart-count");

  function updateCartCount() {
    if (!cartCount) {
      return;
    }

    const savedCart = JSON.parse(
      localStorage.getItem("sniffLabCart") || "[]"
    );

    const totalItems = savedCart.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    cartCount.textContent = totalItems;
  }

  updateCartCount();

  window.addEventListener("storage", updateCartCount);
});

const topButton = document.querySelector(".back-to-top");

if (topButton) {
  const updateTopButton = () => {
    topButton.classList.toggle("is-visible", window.scrollY > 700);
  };

  updateTopButton();
  window.addEventListener("scroll", updateTopButton, { passive: true });
}

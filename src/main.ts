import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/spline-sans/400.css";
import "@fontsource/spline-sans/500.css";
import "@fontsource/spline-sans/600.css";
import "./style.css";

const root = document.documentElement;
const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle");
const nav = document.querySelector<HTMLElement>(".site-nav");
const progressBar = document.querySelector<HTMLElement>(".progress span");
const revealItems = document.querySelectorAll<HTMLElement>(".reveal");
const identityCard = document.querySelector<HTMLElement>(".identity-card");

const closeMenu = () => {
  menuButton?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
  root.classList.remove("menu-open");
};

menuButton?.addEventListener("click", () => {
  const nextOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(nextOpen));
  nav?.classList.toggle("is-open", nextOpen);
  root.classList.toggle("menu-open", nextOpen);
});

nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener(
  "scroll",
  () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    if (progressBar) progressBar.style.transform = "scaleX(" + progress + ")";
  },
  { passive: true },
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll<HTMLElement>("[data-year]").forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});

if (identityCard && !prefersReducedMotion) {
  identityCard.addEventListener("pointermove", (event) => {
    const bounds = identityCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    identityCard.style.setProperty("--tilt-x", (0.5 - y) * 3 + "deg");
    identityCard.style.setProperty("--tilt-y", (x - 0.5) * 4 + "deg");
    identityCard.style.setProperty("--spot-x", x * 100 + "%");
    identityCard.style.setProperty("--spot-y", y * 100 + "%");
  });

  identityCard.addEventListener("pointerleave", () => {
    identityCard.style.setProperty("--tilt-x", "0deg");
    identityCard.style.setProperty("--tilt-y", "0deg");
    identityCard.style.setProperty("--spot-x", "50%");
    identityCard.style.setProperty("--spot-y", "50%");
  });
}

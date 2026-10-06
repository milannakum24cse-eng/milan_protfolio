/* ============================================================
   CONTACT CONFIG
   Change CONTACT_CONFIG.mode and handleContactSubmit below to
   swap the form for Formspree / Web3Forms later — no other file
   needs to change. For Formspree: mode "fetch", endpoint URL,
   and replace the mailto block with a fetch() POST.
   ============================================================ */
const CONTACT_CONFIG = {
  recipientEmail: "milanynakum@gmail.com",
  mode: "mailto"
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ============================================================
   THEME TOGGLE — circular reveal via startViewTransition when
   supported, instant switch otherwise
   ============================================================ */
const page = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeLabel = document.querySelector(".theme-toggle-label");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const isLight = theme === "light";
  page.dataset.theme = isLight ? "light" : "dark";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
  if (themeLabel) themeLabel.textContent = isLight ? "Dark" : "Light";
  themeColorMeta.setAttribute("content", isLight ? "#F6F4EE" : "#191A18");
}

let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("milan-portfolio-theme") || "dark";
} catch (error) {
  // storage unavailable — dark stays for this visit
}
applyTheme(savedTheme);

function toggleTheme() {
  const next = page.dataset.theme === "dark" ? "light" : "dark";

  // circular reveal from the toggle button, only where supported
  if (document.startViewTransition && !reducedMotion.matches) {
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // set the circle origin before the transition starts so the
    // ::view-transition keyframes have valid values on the first frame
    const root = document.documentElement;
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);
    root.style.setProperty("--reveal-r", `${radius}px`);

    document.startViewTransition(() => applyTheme(next));
  } else {
    applyTheme(next);
  }

  try {
    localStorage.setItem("milan-portfolio-theme", next);
  } catch (error) {
    // keep the new theme in the document even if it can't be saved
  }
}

themeToggle.addEventListener("click", toggleTheme);

/* ============================================================
   MOBILE MENU
   ============================================================ */
const menuToggle = document.querySelector(".menu-toggle");
const navPanel = document.querySelector(".nav-panel");
const navLinks = [...document.querySelectorAll(".nav-link")];

function closeMobileMenu(returnFocus = false) {
  navPanel.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  if (returnFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  navPanel.classList.toggle("is-open", !open);
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
});

navLinks.forEach((link) => link.addEventListener("click", () => closeMobileMenu()));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    closeMobileMenu(true);
  }
});

/* ============================================================
   NAVBAR — hide on scroll down, return on scroll up
   ============================================================ */
const siteHeader = document.querySelector("[data-nav]");
let lastScrollY = window.scrollY;
let ticking = false;

function updateNavbar() {
  const current = window.scrollY;
  const menuOpen = navPanel.classList.contains("is-open");
  // only react after 80px so the navbar doesn't flicker at the top,
  // and never hide it while the mobile menu is open
  if (!menuOpen && current > 80 && current > lastScrollY) {
    siteHeader.classList.add("is-hidden");
  } else {
    siteHeader.classList.remove("is-hidden");
  }
  lastScrollY = current;
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateNavbar);
    ticking = true;
  }
}, { passive: true });

// a keyboard user tabbing into the navbar should never land on an
// invisible link — bring it back whenever anything inside gains focus
siteHeader.addEventListener("focusin", () => siteHeader.classList.remove("is-hidden"));

/* ============================================================
   HERO INTRO — add .hero-loaded on next frame so the CSS
   transition runs from the off-screen start position
   ============================================================ */
requestAnimationFrame(() => {
  document.body.classList.add("hero-loaded");
});

/* ============================================================
   ACTIVE NAV LINK — which section is in view
   ============================================================ */
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const current = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", current);
        if (current) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });

  navLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) sectionObserver.observe(section);
  });
}

/* ============================================================
   SCROLL REVEAL — 20px translate + fade, staggered in groups,
   fires once only; skipped entirely for reduced-motion users
   ============================================================ */
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  // stagger siblings inside the same parent by 70ms
  const groups = new Map();
  document.querySelectorAll("[data-reveal]").forEach((item) => {
    const parent = item.parentElement;
    const index = groups.get(parent) || 0;
    groups.set(parent, index + 1);
    item.style.transitionDelay = `${index * 70}ms`;
    revealObserver.observe(item);
  });
}

/* ============================================================
   SCROLL-TO-TOP BUTTON
   ============================================================ */
const scrollTopButton = document.querySelector(".scroll-top");

function updateScrollTopButton() {
  scrollTopButton.hidden = window.scrollY < 500;
}

window.addEventListener("scroll", updateScrollTopButton, { passive: true });
updateScrollTopButton();

scrollTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
});

/* ============================================================
   FOOTER YEAR
   ============================================================ */
document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

/* ============================================================
   CONTACT FORM — one replaceable function.

   To switch to Formspree:
     1. Set CONTACT_CONFIG.mode = "fetch"
     2. Set CONTACT_CONFIG.endpoint = "https://formspree.io/f/XXXX"
     3. In the mailto block below, replace window.location.href
        with:
          fetch(CONTACT_CONFIG.endpoint, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
          }).then(...)
   To switch to Web3Forms, use the same pattern with their
   endpoint and an access_key field. Only this function changes.
   ============================================================ */
function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const nameField = form.elements.name;
  const emailField = form.elements.email;
  const messageField = form.elements.message;
  const status = form.querySelector("[data-form-status]");
  const fields = [
    { input: nameField, error: form.querySelector("#name-error"), label: "Name" },
    { input: emailField, error: form.querySelector("#email-error"), label: "Email" },
    { input: messageField, error: form.querySelector("#message-error"), label: "Message" }
  ];

  status.textContent = "";
  let firstInvalid = null;

  fields.forEach(({ input, error, label }) => {
    const value = input.value.trim();
    let message = "";

    if (!value) {
      message = `${label} is required.`;
    } else if (input === emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = "Enter a valid email address.";
    }

    input.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
    if (message && !firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) {
    status.textContent = "Please correct the highlighted fields.";
    firstInvalid.focus();
    return;
  }

  if (CONTACT_CONFIG.mode === "mailto") {
    const subject = `Portfolio message from ${nameField.value.trim()}`;
    const body = [
      `Name: ${nameField.value.trim()}`,
      `Email: ${emailField.value.trim()}`,
      "",
      messageField.value.trim()
    ].join("\n");
    const mailto = `mailto:${CONTACT_CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = "Your email app should open with this message prepared.";
    window.location.href = mailto;
  }
  /* fetch branch for Formspree / Web3Forms goes here — see comment above */
}

document.querySelector("[data-contact-form]").addEventListener("submit", handleContactSubmit);

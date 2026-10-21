const nav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const navIndicator = document.querySelector(".nav-indicator");
const sectionsAll = Array.from(document.querySelectorAll("section[id]"));
let activeSection = null;

function moveHighlight(link) {
  if (!nav || !navIndicator || !link) return;

  navIndicator.style.width = `${link.offsetWidth}px`;
  navIndicator.style.transform = `translateX(${link.offsetLeft}px)`;
}

function setActiveLink(sectionId) {
  const activeLink = navLinks.find(
    (link) => link.getAttribute("href") === `#${sectionId}`,
  );
  if (!activeLink) return;
  if (activeSection === sectionId) return;
  activeSection = sectionId;

  navLinks.forEach((link) => {
    link.classList.toggle("active", link === activeLink);
    if (link === activeLink) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  moveHighlight(activeLink);
}

function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.86;

  sectionsAll.forEach((section) => {
    if (section.getBoundingClientRect().top < triggerBottom) {
      section.classList.add("visible");
    }
  });
}

function updateNavState() {
  if (!nav) return;

  nav.classList.toggle("scrolled", window.scrollY > 40);

  let current = sectionsAll[0]?.id || "";
  const atPageBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 4;

  if (atPageBottom) {
    current = sectionsAll[sectionsAll.length - 1]?.id || current;
  } else {
    sectionsAll.forEach((section) => {
      const sectionTop = section.offsetTop - 180;
      if (window.scrollY >= sectionTop) current = section.id;
    });
  }

  setActiveLink(current);
  revealOnScroll();
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;

  window.requestAnimationFrame(() => {
    updateNavState();
    ticking = false;
  });
});

window.addEventListener("resize", () => {
  const activeLink = document.querySelector(".site-nav a.active");
  moveHighlight(activeLink);

});

// Native anchors retain hash URLs, Back/Forward history and keyboard navigation.
// Smooth scrolling and reduced motion are handled by CSS. Focusable section
// targets also make the skip link continue through content rather than the nav.
sectionsAll.forEach(section => { section.tabIndex = -1; });

revealOnScroll();
updateNavState();
document.fonts?.ready.then(() => moveHighlight(navLinks.find(link => link.classList.contains("active"))));
if (nav) new ResizeObserver(() => moveHighlight(navLinks.find(link => link.classList.contains("active")))).observe(nav);

// Secrets are isolated from navigation and load progressively.
import('./secrets.js').catch(error => console.warn('Secret journal unavailable:', error.message));

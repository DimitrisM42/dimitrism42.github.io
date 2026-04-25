const nav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const navIndicator = document.querySelector(".nav-indicator");
const sectionsAll = Array.from(document.querySelectorAll("section[id]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

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

  navLinks.forEach((link) =>
    link.classList.toggle("active", link === activeLink),
  );
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
  resizeCanvas();
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });
});

revealOnScroll();
setActiveLink("hero");

const typedText = document.getElementById("typed-text");
const phrases = [
  "Web Developer",
  "Software Engineer",
  "API Builder",
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  if (!typedText) return;

  const currentPhrase = phrases[phraseIndex];
  typedText.textContent = currentPhrase.slice(0, charIndex);

  if (!isDeleting) {
    charIndex += 1;

    if (charIndex > currentPhrase.length) {
      isDeleting = true;
      window.setTimeout(typeEffect, 1500);
      return;
    }
  } else {
    charIndex -= 1;

    if (charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      window.setTimeout(typeEffect, 420);
      return;
    }
  }

  window.setTimeout(typeEffect, isDeleting ? 44 : 78);
}

typeEffect();

const canvas = document.getElementById("code-bg");
const ctx = canvas?.getContext("2d");
const codeChars =
  "<>_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(){};/\\=";
const fontSize = 16;
let drops = [];

function resizeCanvas() {
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drops = Array(Math.ceil(canvas.width / fontSize)).fill(1);
}

function drawMatrix() {
  if (!canvas || !ctx || prefersReducedMotion.matches) return;

  ctx.fillStyle = "rgba(13, 13, 13, 0.13)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#ff0099");
  gradient.addColorStop(0.55, "#ff9e00");
  gradient.addColorStop(1, "#ffbe0b");
  ctx.fillStyle = gradient;
  ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

  drops.forEach((drop, index) => {
    const text = codeChars[Math.floor(Math.random() * codeChars.length)];
    ctx.fillText(text, index * fontSize, drop * fontSize);

    if (drop * fontSize > canvas.height && Math.random() > 0.975) {
      drops[index] = 0;
    }

    drops[index] += 1;
  });
}

resizeCanvas();
window.setInterval(drawMatrix, 50);

// Easter eggs
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let konamiInput = [];

window.addEventListener("keydown", (event) => {
  konamiInput.push(event.keyCode);

  if (konamiInput.toString().includes(konamiCode.toString())) {
    unlockSecret("konami");
    konamiInput = [];
  }
});

const nameCode = ["d", "i", "m", "i", "t", "r", "i", "s"];
let nameInput = [];

document.addEventListener("keydown", (event) => {
  nameInput.push(event.key.toLowerCase());

  if (nameInput.join("").includes(nameCode.join(""))) {
    unlockSecret("dimitriskeys");
    nameInput = [];
  }

  if (nameInput.length > nameCode.length) nameInput.shift();
});

let tapCount = 0;
let tapTimer = null;
const hero = document.querySelector("#hero");

function registerTap() {
  tapCount += 1;

  if (tapCount === 3) {
    unlockSecret("triple");
    tapCount = 0;
  }

  clearTimeout(tapTimer);
  tapTimer = window.setTimeout(() => {
    tapCount = 0;
  }, 800);
}

hero?.addEventListener("click", registerTap);

let isMonochrome = false;
let holdTimer;

document.querySelectorAll(".skill-card").forEach((card) => {
  const startHold = () => {
    holdTimer = window.setTimeout(toggleMonochrome, 2000);
  };

  const cancelHold = () => clearTimeout(holdTimer);

  card.addEventListener("touchstart", startHold);
  card.addEventListener("touchend", cancelHold);
  card.addEventListener("touchmove", cancelHold);
  card.addEventListener("mousedown", startHold);
  card.addEventListener("mouseup", cancelHold);
  card.addEventListener("mouseleave", cancelHold);
});

function toggleMonochrome() {
  isMonochrome = !isMonochrome;
  document.body.classList.toggle("monochrome-mode", isMonochrome);
  unlockSecret("mono");
}

let javaClicks = 0;
const javaCard = Array.from(document.querySelectorAll(".skill-card")).find(
  (card) => card.querySelector("span")?.innerText.trim() === "Java",
);

if (javaCard) {
  javaCard.addEventListener("click", () => {
    javaClicks += 1;

    if (javaClicks >= 5) {
      unlockSecret("wizard");
      javaClicks = 0;
    }

    window.setTimeout(() => {
      javaClicks = 0;
    }, 4000);
  });
}

let lastScrollY = window.scrollY;
let lastRocketTime = Date.now();

window.addEventListener("scroll", () => {
  const now = Date.now();

  if (now - lastRocketTime < 500) {
    lastScrollY = window.scrollY;
    return;
  }

  const diff = Math.abs(window.scrollY - lastScrollY);

  if (diff > 450) {
    unlockSecret("rocket");
    lastRocketTime = now;
  }

  lastScrollY = window.scrollY;
});

let lastScrollYFlips = window.scrollY;
let previousDirection = null;
let scrollFlips = 0;
let scrollFlipTimer;

window.addEventListener("scroll", () => {
  const currentY = window.scrollY;
  const newDirection = currentY > lastScrollYFlips ? "down" : "up";

  if (previousDirection && newDirection !== previousDirection) {
    scrollFlips += 1;
  }

  previousDirection = newDirection;
  lastScrollYFlips = currentY;

  if (scrollFlips >= 10) {
    unlockSecret("scrollflip");
    scrollFlips = 0;
  }

  clearTimeout(scrollFlipTimer);
  scrollFlipTimer = window.setTimeout(() => {
    scrollFlips = 0;
    previousDirection = null;
  }, 2000);
});

let tappedSkills = [];
let skillResetTimer;

document.querySelectorAll(".skill-card").forEach((card) => {
  const handler = () => {
    const name = card.querySelector("span")?.innerText.trim();
    if (!name) return;

    if (!tappedSkills.includes(name)) {
      tappedSkills.push(name);
    }

    if (tappedSkills.length === 3) {
      unlockSecret("tap3skills");
      tappedSkills = [];
      clearTimeout(skillResetTimer);
      return;
    }

    clearTimeout(skillResetTimer);
    skillResetTimer = window.setTimeout(() => {
      tappedSkills = [];
    }, 1500);
  };

  card.addEventListener("touchstart", handler);
  card.addEventListener("click", handler);
});

function emojiRain(emoji = "!") {
  for (let i = 0; i < 15; i += 1) {
    const el = document.createElement("div");
    el.classList.add("emoji");
    el.innerText = emoji;
    el.style.left = `${Math.random() * 100}vw`;
    el.style.animationDuration = `${2 + Math.random() * 1.5}s`;

    document.body.appendChild(el);

    window.setTimeout(() => {
      el.remove();
    }, 4200);
  }
}

function showPopup(text) {
  const div = document.createElement("div");
  div.className = "secret-toast";
  div.innerText = text;

  if (isMobile) {
    div.style.fontSize = "0.82rem";
    div.style.maxWidth = "calc(100vw - 2rem)";
  }

  document.body.appendChild(div);
  window.setTimeout(() => div.remove(), 2500);
}

const secretLabels = {
  rocket: "🚀 Rocket Scroll",
  scrollflip: "😵‍💫 Scroll Flips",
  konami: "🎮 Konami Code",
  dimitriskeys: "👀 'dimitris' Key",
  tap3skills: "💡 3 Skill Taps",
  triple: "🕵️ Triple Tap Hero",
  mono: "🌀 Monochrome Mode",
  wizard: "🧙 Java Wizard",
};

const excludedSecrets = isMobile ? ["konami", "dimitriskeys"] : [];
const availableSecretIds = Object.keys(secretLabels).filter(
  (id) => !excludedSecrets.includes(id),
);
const totalSecrets = availableSecretIds.length;
const unlockedSecrets = new Set();

const tracker = document.createElement("div");
const trackerContent = document.createElement("div");
const trackerList = document.createElement("div");

tracker.className = "secret-tracker";
tracker.tabIndex = 0;
tracker.setAttribute("role", "button");
tracker.setAttribute("aria-live", "polite");
tracker.setAttribute("aria-expanded", "false");

trackerList.className = "secret-tracker-list";
trackerContent.innerText = `Secrets found: 0/${totalSecrets}`;

tracker.appendChild(trackerContent);
tracker.appendChild(trackerList);
document.body.appendChild(tracker);

function toggleTracker() {
  const isOpen = tracker.classList.toggle("is-open");
  tracker.setAttribute("aria-expanded", String(isOpen));
}

tracker.addEventListener("click", toggleTracker);
tracker.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleTracker();
  }
});

function unlockSecret(id) {
  if (!availableSecretIds.includes(id) || unlockedSecrets.has(id)) return;

  if (unlockedSecrets.size === 0) {
    tracker.style.display = "block";
  }

  unlockedSecrets.add(id);
  trackerContent.innerText = `Secrets found: ${unlockedSecrets.size}/${totalSecrets}`;

  const label = secretLabels[id] || `🧩 ${id}`;
  const item = document.createElement("div");
  item.innerText = label;
  trackerList.appendChild(item);

  switch (id) {
    case "konami":
      showPopup("🎮 You know the code...");
      emojiRain("🎮");
      break;
    case "dimitriskeys":
      showPopup("👀 You know my name!?");
      emojiRain("👀");
      break;
    case "rocket":
      showPopup("🚀 Blasting through!");
      emojiRain("🚀");
      break;
    case "scrollflip":
      showPopup("😵‍💫 You good bro?");
      emojiRain("😵‍💫");
      break;
    case "tap3skills":
      showPopup("💡 You're testing me?");
      emojiRain("💡");
      break;
    case "triple":
      showPopup("🕵️ Secret tap detected!");
      emojiRain("🕵️");
      break;
    case "mono":
      showPopup("🌀 Monochrome mode activated");
      emojiRain("🌀");
      break;
    case "wizard":
      showPopup("🧙 You're a backend wizard!");
      emojiRain("🧙");
      break;
    default:
      showPopup(`🧩 Secret unlocked: ${label}`);
      emojiRain("🧩");
  }

  if (unlockedSecrets.size === totalSecrets) {
    window.setTimeout(() => {
      window.location.href = "secret.html";
    }, 1000);
  }
}

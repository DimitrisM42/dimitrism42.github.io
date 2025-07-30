const nav = document.querySelector("nav");
        const navLinks = document.querySelectorAll("nav a");
        const sectionsAll = document.querySelectorAll("section");

        const highlight = document.createElement("div");
        highlight.classList.add("nav-highlight");
        Object.assign(highlight.style, {
            position: "absolute",
            bottom: "0",
            height: "3px",
            width: "0",
            background: "linear-gradient(90deg, #ff0099, #ff9e00, #ffbe0b)",
            transition: "all 0.3s ease",
            borderRadius: "2px"
        });
        nav.appendChild(highlight);

        function moveHighlight(link) {
            const rect = link.getBoundingClientRect();
            const navRect = nav.getBoundingClientRect();
            const width = rect.width;
            const left = rect.left - navRect.left - 22;

            highlight.style.width = `${width}px`;
            highlight.style.transform = `translateX(${left}px)`;
        }

        function revealOnScroll() {
            const triggerBottom = window.innerHeight * 0.85;
            sectionsAll.forEach(sec => {
                const rect = sec.getBoundingClientRect().top;
                if (rect < triggerBottom) sec.classList.add("visible");
            });
        }


        window.addEventListener("scroll", () => {
            const scrollY = window.scrollY;


            if (scrollY > 50) {
                nav.classList.add("scrolled");
            } else {
                nav.classList.remove("scrolled");
            }

            let current = "";
            sectionsAll.forEach(sec => {
                const secTop = sec.offsetTop - 150;
                if (scrollY >= secTop) current = sec.getAttribute("id");
            });

            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === "#" + current) {
                    link.classList.add("active");
                    moveHighlight(link);
                }
            });

            revealOnScroll();

        });

        document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener("click", e => {
                e.preventDefault();
                const targetElement = document.querySelector(anchor.getAttribute("href"));
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });

        navLinks.forEach(link => {
            link.addEventListener("mouseenter", () => moveHighlight(link));
            link.addEventListener("mouseleave", () => {
                const activeLink = document.querySelector("nav a.active");
                if (activeLink) moveHighlight(activeLink);
            });
        });

        // Trigger για αρχή
        revealOnScroll();




        const typedText = document.getElementById("typed-text");

        const phrases = [
            "Web Developer",
            "Software Engineer",
            "Tech Enthusiast",
        ];

        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeEffect() {
            const currentPhrase = phrases[phraseIndex];

            if (!isDeleting) {
                // Γράψιμο χαρακτήρων
                typedText.textContent = currentPhrase.slice(0, charIndex++);

                if (charIndex > currentPhrase.length) {

                    isDeleting = true;
                    setTimeout(typeEffect, 1800);
                    return;
                }
            } else {

                typedText.textContent = currentPhrase.slice(0, charIndex--);

                if (charIndex === 0) {

                    isDeleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;


                    setTimeout(typeEffect, 500);
                    return;
                }
            }

            const speed = isDeleting ? 50 : 100;
            setTimeout(typeEffect, speed);
        }

        typeEffect();






        const canvas = document.getElementById("code-bg");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const codeChars = "<>_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(){};/\\=";
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function drawMatrix() {
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "#ff006e");
            gradient.addColorStop(0.5, "#ff9e00");
            gradient.addColorStop(1, "#ffbe0b");
            ctx.fillStyle = gradient;
            ctx.font = fontSize + "px monospace";

            for (let i = 0; i < drops.length; i++) {
                const text = codeChars[Math.floor(Math.random() * codeChars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 50);

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });




        // Tap Indicator
        const tapIndicator = document.querySelector(".tap-indicator");
        const projectsSection = document.querySelector("#projects");

        window.addEventListener("scroll", () => {
            const rect = projectsSection.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (rect < windowHeight * 0.8) {
                tapIndicator.style.opacity = "1";
            }
        });






        //easter eggs

        console.log("%cHey curious developer!", "color: #ff9e00; font-size:16px; font-weight:bold;");


        //konami code
        const secret = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        let input = [];
        window.addEventListener("keydown", (e) => {
            input.push(e.keyCode);
            if (input.toString().indexOf(secret) >= 0) {
                unlockSecret("konami");
                input = [];
            }
        });


        // name type
        const nameCode = ['d', 'i', 'm', 'i', 't', 'r', 'i', 's'];
        let nameInput = [];
        document.addEventListener("keydown", (e) => {
            nameInput.push(e.key.toLowerCase());
            if (nameInput.join('').includes(nameCode.join(''))) {
                unlockSecret("dimitriskeys");
                nameInput = [];
            }
            if (nameInput.length > nameCode.length) nameInput.shift();
        });


        // Triple Tap Mobile
        let tapCount = 0;
        let tapTimer = null;

        const hero = document.querySelector("#hero");
        const registerTap = () => {
            tapCount++;
            if (tapCount === 3) {
                unlockSecret("triple");
                tapCount = 0;
            }
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => tapCount = 0, 800);
        };

        hero.addEventListener("click", registerTap);


        // Monochrome
        let isMonochrome = false;
        let holdTimer;

        document.querySelectorAll(".skill-card").forEach(card => {
            const startHold = () => {
                holdTimer = setTimeout(() => {
                    toggleMonochrome();
                }, 2000);
            };

            const cancelHold = () => clearTimeout(holdTimer);

            // Mobile
            card.addEventListener("touchstart", startHold);
            card.addEventListener("touchend", cancelHold);
            card.addEventListener("touchmove", cancelHold);

            // Desktop
            card.addEventListener("mousedown", startHold);
            card.addEventListener("mouseup", cancelHold);
            card.addEventListener("mouseleave", cancelHold);
        });

        function toggleMonochrome() {
            isMonochrome = !isMonochrome;
            document.body.classList.toggle("monochrome-mode", isMonochrome);

            unlockSecret("mono");
        }




        // java wizard

        let javaClicks = 0;
        const javaCard = Array.from(document.querySelectorAll(".skill-card")).find(el => el.innerText === "Java");

        if (javaCard) {
            javaCard.addEventListener("click", () => {
                javaClicks++;
                if (javaClicks >= 5) {
                    unlockSecret("wizard");
                    javaClicks = 0;
                }
                setTimeout(() => javaClicks = 0, 4000);
            });
        }


        // fast scroll
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


        // scroll flips
        let lastScrollYFlips = window.scrollY;
        let previousDirection = null;
        let scrollFlips = 0;
        let scrollFlipTimer;

        window.addEventListener("scroll", () => {
            const currentY = window.scrollY;
            const newDirection = currentY > lastScrollYFlips ? "down" : "up";

            if (previousDirection && newDirection !== previousDirection) {
                scrollFlips++;
            }

            previousDirection = newDirection;
            lastScrollYFlips = currentY;

            if (scrollFlips >= 10) {
                unlockSecret("scrollflip");
                scrollFlips = 0;
            }

            clearTimeout(scrollFlipTimer);
            scrollFlipTimer = setTimeout(() => {
                scrollFlips = 0;
                previousDirection = null;
            }, 2000);
        });


        // Tapped skills

        let tappedSkills = [];
        let skillResetTimer;

        document.querySelectorAll(".skill-card").forEach(card => {
            const handler = () => {
                const span = card.querySelector("span");
                if (!span) return;

                const name = span.innerText.trim();

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
                skillResetTimer = setTimeout(() => {
                    tappedSkills = [];
                }, 1500);
            };

            card.addEventListener("touchstart", handler);
            card.addEventListener("click", handler);
        });











        function emojiRain(emoji = "!") {
            for (let i = 0; i < 15; i++) {
                const el = document.createElement("div");
                el.classList.add("emoji");
                el.innerText = emoji;

                el.style.left = Math.random() * 100 + "vw";
                el.style.animationDuration = 2 + Math.random() * 1.5 + "s";

                document.body.appendChild(el);

                setTimeout(() => {
                    el.remove();
                }, 4200);
            }
        }

        function showPopup(text) {
            const div = document.createElement("div");
            div.innerText = text;

            Object.assign(div.style, {
                position: "fixed",
                top: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                padding: isMobile ? "0.6rem 1.2rem" : "1rem 2rem",
                background: "#111",
                color: "#fff",
                border: "2px solid #ff9e00",
                fontSize: isMobile ? "0.95rem" : "1.2rem",
                borderRadius: "10px",
                zIndex: 9999,
                opacity: "1",
                pointerEvents: "none",
                boxShadow: "0 0 10px rgba(255, 158, 0, 0.4)",
            });

            document.body.appendChild(div);

            setTimeout(() => div.remove(), 2500);
        }


        // ================
        // Easter Egg Tracker System
        // ================

        const isMobile = /Mobi|Android/i.test(navigator.userAgent);

        // secrets
        const secretLabels = {
            rocket: "🚀 Rocket Scroll",
            scrollflip: "😵‍💫 Scroll Flips",
            konami: "🎮 Konami Code",
            dimitriskeys: "👀 'dimitris' Key",
            tap3skills: "💡 3 Skill Taps",
            triple: "🕵️ Triple Tap Hero",
            mono: "🌀 Monochrome Mode",
            wizard: "🧙 Java Wizard"
        };

        const excluded = isMobile ? ["konami", "dimitriskeys"] : [];
        const availableSecretIds = Object.keys(secretLabels).filter(id => !excluded.includes(id));
        const totalSecrets = availableSecretIds.length;

        const unlockedSecrets = new Set();
        const tracker = document.createElement("div");
        const trackerContent = document.createElement("div");
        const trackerList = document.createElement("div");

        // tracker style
        Object.assign(tracker.style, {
            display: "none",
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#111",
            color: "#fff",
            padding: "8px 16px",
            border: "2px solid #ff9e00",
            borderRadius: "10px",
            fontSize: isMobile ? "0.95rem" : "1.2rem",
            fontFamily: "monospace",
            zIndex: 9999,
            opacity: "0.9",
            cursor: "pointer"
        });

        Object.assign(trackerList.style, {
            marginTop: "8px",
            fontSize: isMobile ? "0.85rem" : "1rem",
            display: "none",
            color: "#ff9e00"
        });

        

        trackerContent.innerText = `Secrets found: 0/${totalSecrets}`;
        tracker.appendChild(trackerContent);
        tracker.appendChild(trackerList);
        document.body.appendChild(tracker);

        
        tracker.addEventListener("mouseenter", () => {
            trackerList.style.display = "block";
        });
        tracker.addEventListener("mouseleave", () => {
            trackerList.style.display = "none";
        });
        tracker.addEventListener("click", () => {
            const isVisible = trackerList.style.display === "block";
            trackerList.style.display = isVisible ? "none" : "block";
        });


        function unlockSecret(id) {
            if (unlockedSecrets.size === 0) {
                tracker.style.display = "block";
            }

            if (!availableSecretIds.includes(id)) return; 
            if (unlockedSecrets.has(id)) return;

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
                    showPopup("💡 You’re testing me?");
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
                    showPopup("🧙 You’re a backend wizard!");
                    emojiRain("🧙");
                    break;
                default:
                    showPopup(`🧩 Secret unlocked: ${label}`);
                    emojiRain("🧩");
            }

            if (unlockedSecrets.size === totalSecrets) {
                setTimeout(() => {
                    window.location.href = "secret.html";
                }, 1000);
            }
        }

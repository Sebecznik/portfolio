(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const yearElement = document.getElementById("year");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const counterItems = document.querySelectorAll("[data-counter]");
  const cloudItems = document.querySelectorAll(".cloud");

  const STORAGE_KEY = "portfolio-theme";

  const setTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (themeLabel) {
      themeLabel.textContent = theme === "light" ? "Light" : "Dark";
    }
  };

  const loadTheme = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      return;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "light" : "dark");
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  const animateCounter = (el) => {
    const target = Number(el.dataset.counter);
    if (!Number.isFinite(target)) {
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const step = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(target * eased);

      el.textContent = String(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = String(target);
      }
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.6
    }
  );

  const initCloudMotion = () => {
    if (!cloudItems.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      active: false
    };

    const smoothPointer = {
      x: pointer.x,
      y: pointer.y
    };

    const cloudConfig = Array.from(cloudItems).map((cloud, index) => ({
      cloud,
      phase: Math.random() * Math.PI * 2 + index,
      floatAmplitude: (5 + index * 1.4) * (isCoarsePointer ? 0.7 : 1),
      pullStrength: (6 + index * 1.6) * (isCoarsePointer ? 0.45 : 1),
      scaleAmplitude: 0.012 + index * 0.0015
    }));

    const onPointerMove = (event) => {
      if (isCoarsePointer || event.pointerType !== "mouse") {
        return;
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    const animateClouds = (time) => {
      const targetX = pointer.active ? pointer.x : window.innerWidth * 0.5;
      const targetY = pointer.active ? pointer.y : window.innerHeight * 0.5;

      smoothPointer.x += (targetX - smoothPointer.x) * 0.05;
      smoothPointer.y += (targetY - smoothPointer.y) * 0.05;

      cloudConfig.forEach((config) => {
        const rect = config.cloud.getBoundingClientRect();
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const deltaX = smoothPointer.x - centerX;
        const deltaY = smoothPointer.y - centerY;
        const distance = Math.hypot(deltaX, deltaY) || 1;

        const pull = Math.min(config.pullStrength, distance * 0.025);
        const pullX = (deltaX / distance) * pull * 0.35;
        const pullY = (deltaY / distance) * pull;
        const floatY = Math.sin(time * 0.0006 + config.phase) * config.floatAmplitude;
        const scale = 1 + Math.cos(time * 0.0004 + config.phase) * config.scaleAmplitude;

        config.cloud.style.setProperty("--tx", `${pullX.toFixed(2)}px`);
        config.cloud.style.setProperty("--ty", `${(pullY + floatY).toFixed(2)}px`);
        config.cloud.style.setProperty("--s", scale.toFixed(4));
      });

      requestAnimationFrame(animateClouds);
    };

    requestAnimationFrame(animateClouds);
  };

  loadTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      setTheme(current === "light" ? "dark" : "light");
    });
  }

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 60, 380)}ms`;
    revealObserver.observe(item);
  });

  counterItems.forEach((item) => {
    counterObserver.observe(item);
  });

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  initCloudMotion();
})();

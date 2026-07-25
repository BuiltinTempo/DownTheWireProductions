(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");

  const ready = (callback) => {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    if (!reduceMotion) {
      root.classList.add("motion-ready");
    }

    addProgressBar();
    addIntro();
    prepareHeadlines();
    prepareReveals();
    prepareImageReveals();
    observeMotion();
    setupParallax();
    setupHeader();
    setupMagneticButtons();
    setupFormSuccess();
  });

  function addProgressBar() {
    const bar = doc.createElement("div");
    bar.className = "motion-progress";
    bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);

    let ticking = false;
    const update = () => {
      const max = Math.max(doc.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  function addIntro() {
    if (reduceMotion) return;

    let hasSeenIntro = false;
    try {
      hasSeenIntro = sessionStorage.getItem("dtw-intro-seen") === "true";
    } catch (_) {}

    if (hasSeenIntro) return;

    const intro = doc.createElement("div");
    intro.className = "site-intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
      <div class="site-intro__inner">
        <div class="site-intro__eyebrow">Live broadcast · field production</div>
        <p class="site-intro__title">
          <span><b>DOWN THE</b></span><br>
          <span><b>WIRE</b></span>
        </p>
        <div class="site-intro__rule"></div>
      </div>
    `;

    doc.body.classList.add("motion-locked");
    doc.body.appendChild(intro);

    window.setTimeout(() => {
      intro.classList.add("is-leaving");
      doc.body.classList.remove("motion-locked");
      try {
        sessionStorage.setItem("dtw-intro-seen", "true");
      } catch (_) {}
    }, 1250);

    window.setTimeout(() => intro.remove(), 2450);
  }

  function prepareHeadlines() {
    const selectors = [
      "main h1",
      ".section-head h2",
      ".case-copy > h2",
      ".feature-copy > h2",
      ".contact-copy > h2",
      ".cinematic-statement",
      "[data-split]"
    ].join(",");

    doc.querySelectorAll(selectors).forEach((element) => {
      if (element.dataset.splitReady === "true") return;
      splitWords(element);
      element.dataset.motionTarget = "split";
    });
  }

  function splitWords(element) {
    const walker = doc.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest("script, style, textarea")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let wordIndex = 0;

    textNodes.forEach((node) => {
      const parts = node.nodeValue.split(/(\s+)/);
      const fragment = doc.createDocumentFragment();

      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(doc.createTextNode(part));
          return;
        }

        const mask = doc.createElement("span");
        mask.className = "split-word";
        mask.setAttribute("aria-hidden", "true");

        const inner = doc.createElement("span");
        inner.className = "split-word__inner";
        inner.textContent = part;
        inner.style.setProperty("--word-delay", `${Math.min(wordIndex * 48, 650)}ms`);

        mask.appendChild(inner);
        fragment.appendChild(mask);
        wordIndex += 1;
      });

      node.parentNode.replaceChild(fragment, node);
    });

    element.dataset.splitReady = "true";

    const accessible = element.getAttribute("data-accessible-label") || element.textContent.trim();
    if (accessible) element.setAttribute("aria-label", accessible);
  }

  function prepareReveals() {
    const basicSelectors = [
      ".eyebrow",
      ".section-kicker",
      ".hero-copy",
      ".section-head > p",
      ".case-copy > p",
      ".feature-copy > p",
      ".contact-copy > p",
      ".hero-actions",
      ".industries-row",
      ".contact-points",
      ".note-panel",
      ".cinematic-number",
      "[data-reveal]"
    ].join(",");

    doc.querySelectorAll(basicSelectors).forEach((element, index) => {
      if (!element.dataset.motion) element.dataset.motion = "reveal";
      if (!element.style.getPropertyValue("--motion-delay")) {
        element.style.setProperty("--motion-delay", `${Math.min((index % 5) * 65, 260)}ms`);
      }
    });

    const groups = [
      ".cred-strip",
      ".proof-strip",
      ".grid-3",
      ".grid-4",
      ".package-grid",
      ".category-grid",
      ".process-grid",
      ".feature-list",
      ".field-grid",
      ".gallery",
      ".partner-grid",
      ".value-grid"
    ];

    groups.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((group) => {
        Array.from(group.children).forEach((child, index) => {
          if (!child.dataset.motion && !child.dataset.motionTarget) {
            child.dataset.motion = "reveal";
          }
          child.style.setProperty("--motion-delay", `${Math.min(index * 90, 540)}ms`);
        });
      });
    });

    doc.querySelectorAll("[data-direction]").forEach((element) => {
      if (!element.dataset.motion) element.dataset.motion = "reveal";
    });
  }

  function prepareImageReveals() {
    const selectors = [
      ".hero-photo",
      ".hero-visual",
      ".case-image",
      ".feature-image",
      ".photo-card",
      "[data-image-reveal]"
    ].join(",");

    doc.querySelectorAll(selectors).forEach((element, index) => {
      element.dataset.motion = "image";
      element.style.setProperty("--motion-delay", `${Math.min((index % 4) * 80, 240)}ms`);
    });

    doc.querySelectorAll(".hero-photo img, .hero-visual img, .case-image img, .feature-image img")
      .forEach((image) => image.setAttribute("data-parallax", ""));
  }

  function observeMotion() {
    const targets = doc.querySelectorAll(
      '[data-motion="reveal"], [data-motion="image"], [data-motion-target="split"]'
    );

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-inview", "split-complete"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        if (entry.target.dataset.motionTarget === "split") {
          entry.target.classList.add("split-complete");
        }
        instance.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -9% 0px"
    });

    targets.forEach((target) => observer.observe(target));
  }

  function setupParallax() {
    if (reduceMotion) return;

    const images = Array.from(doc.querySelectorAll("img[data-parallax]"));
    if (!images.length) return;

    let ticking = false;

    const render = () => {
      images.forEach((image) => {
        const rect = image.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;

        const center = rect.top + rect.height / 2;
        const offset = (window.innerHeight / 2 - center) * 0.055;
        const clamped = Math.max(-34, Math.min(34, offset));
        image.style.setProperty("--parallax-y", `${clamped.toFixed(2)}px`);
      });
      ticking = false;
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    request();
  }

  function setupHeader() {
    const header = doc.querySelector("header");
    if (!header) return;

    let previousY = window.scrollY;
    let ticking = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const movingDown = currentY > previousY + 8;
        const movingUp = currentY < previousY - 8;

        if (movingDown && currentY > 240) header.classList.add("nav-hidden");
        if (movingUp || currentY < 90) header.classList.remove("nav-hidden");

        previousY = currentY;
        ticking = false;
      });
    }, { passive: true });
  }

  function setupMagneticButtons() {
    if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    doc.querySelectorAll(".btn").forEach((button) => {
      button.classList.add("motion-magnetic");

      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        button.style.setProperty("--magnetic-x", `${x.toFixed(1)}px`);
        button.style.setProperty("--magnetic-y", `${y.toFixed(1)}px`);
      });

      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
      });
    });
  }

  function setupFormSuccess() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted") !== "true") return;

    const successMessage = doc.getElementById("form-success");
    if (successMessage) successMessage.hidden = false;

    const cleanPath = `${window.location.pathname}#contact`;
    window.history.replaceState(null, "", cleanPath);
  }
})();
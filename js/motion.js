/* Motion runtime — scroll reveal, nav material, back-to-top.
   Vanilla; no jQuery, no animation library. */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* ---- Scroll reveal ------------------------------------------------ */

    var STAGGER_MS = 60;
    var MAX_STAGGER_STEPS = 4;
    var observer = null;

    function scan(root) {
        var scope = root || document;
        var items = scope.querySelectorAll(".reveal:not([data-revealed])");
        if (!items.length) return;

        if (!("IntersectionObserver" in window)) {
            for (var n = 0; n < items.length; n++) {
                items[n].setAttribute("data-revealed", "");
                items[n].classList.add("is-visible");
            }
            return;
        }

        if (!observer) {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            }, { rootMargin: "0px 0px -80px 0px", threshold: 0.01 });
        }

        // Stagger is per-group: siblings that share a parent cascade together.
        var counters = new Map();
        for (var i = 0; i < items.length; i++) {
            var el = items[i];
            el.setAttribute("data-revealed", "");

            var explicit = el.getAttribute("data-reveal-delay");
            if (explicit !== null) {
                el.style.setProperty("--reveal-delay", parseInt(explicit, 10) + "ms");
            } else {
                var parent = el.parentNode;
                var index = counters.get(parent) || 0;
                counters.set(parent, index + 1);
                var step = Math.min(index, MAX_STAGGER_STEPS);
                if (step > 0) {
                    el.style.setProperty("--reveal-delay", step * STAGGER_MS + "ms");
                }
            }

            observer.observe(el);
        }
    }

    /* ---- Navbar material --------------------------------------------- */

    function initNav() {
        var nav = document.querySelector(".site-nav");
        if (!nav) return;

        var ticking = false;
        function update() {
            nav.classList.toggle("is-scrolled", window.scrollY > 8);
            ticking = false;
        }
        update();
        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });
    }

    /* ---- Back to top -------------------------------------------------- */

    function initBackToTop() {
        var btn = document.querySelector(".back-to-top");
        if (!btn) return;

        var ticking = false;
        function update() {
            btn.classList.toggle("is-visible", window.scrollY > 400);
            ticking = false;
        }
        update();
        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: reduceMotion.matches ? "auto" : "smooth"
            });
        });
    }

    /* Content rendered after load (the photo grid) registers itself here */
    window.SiteMotion = { scan: scan };

    function init() {
        scan(document);
        initNav();
        initBackToTop();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

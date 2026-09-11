/* Page behaviour — spinner, portfolio filtering, easter egg.
   Vanilla; Bootstrap 5 and the Isotope packaged build both run without jQuery. */
(function () {
    "use strict";

    function hideSpinner() {
        var spinner = document.getElementById("spinner");
        if (spinner) spinner.classList.remove("show");
    }

    function onKonamiCode(cb) {
        var input = "";
        var key = "38384040373937396665";
        document.addEventListener("keydown", function (e) {
            input += "" + e.keyCode;
            if (input === key) return cb();
            if (!key.indexOf(input)) return;
            input = "" + e.keyCode;
        });
    }

    function initPortfolioFilter() {
        var container = document.querySelector(".portfolio-container");
        if (!container || typeof window.Isotope === "undefined") return;

        /* Isotope applies display:none on transitionend, so with motion off it
           must not transition at all — otherwise filtered items never hide. */
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        var iso = new window.Isotope(container, {
            itemSelector: ".portfolio-item",
            layoutMode: "fitRows",
            transitionDuration: reduceMotion ? 0 : "0.3s"
        });

        // Images settle at unknown heights; re-layout once they have loaded.
        if (typeof window.imagesLoaded === "function") {
            window.imagesLoaded(container, function () {
                iso.layout();
            });
        }

        var bar = document.getElementById("portfolio-flters");
        var filters = document.querySelectorAll("#portfolio-flters li");

        /* A tab that matches nothing is a dead end — hide it until a project
           earns it back. Hide the whole bar if only "All" is left. */
        var live = 0;
        for (var f = 0; f < filters.length; f++) {
            var value = filters[f].getAttribute("data-filter");
            if (value === "*") continue;
            if (!container.querySelectorAll(value).length) {
                filters[f].hidden = true;
            } else {
                live++;
            }
        }
        if (bar && !live) bar.hidden = true;

        for (var i = 0; i < filters.length; i++) {
            filters[i].addEventListener("click", function () {
                for (var j = 0; j < filters.length; j++) {
                    filters[j].classList.remove("active");
                    filters[j].setAttribute("aria-selected", "false");
                }
                this.classList.add("active");
                this.setAttribute("aria-selected", "true");
                iso.arrange({ filter: this.getAttribute("data-filter") });
            });
        }
    }

    function init() {
        hideSpinner();
        initPortfolioFilter();
        onKonamiCode(function () {
            alert("\\o/");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // The spinner must clear even if a late asset stalls DOMContentLoaded.
    window.addEventListener("load", hideSpinner);
})();

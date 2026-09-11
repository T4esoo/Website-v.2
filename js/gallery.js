/* Photography gallery — album index, justified album rows, lightbox.
   Vanilla; no dependencies. Reads window.ALBUMS / window.PHOTOS. */
(function () {
    "use strict";

    var indexView = document.getElementById("album-index");
    if (!indexView) return;

    var albumView = document.getElementById("album-view");
    var albumGrid = indexView; /* the index list is itself the album grid */
    var photoRows = document.getElementById("photo-rows");
    var albumTitle = document.getElementById("album-title");
    var albumBlurb = document.getElementById("album-blurb");
    var emptyState = document.getElementById("gallery-empty");
    var flickrLink = document.getElementById("gallery-flickr-link");
    var intro = document.getElementById("gallery-intro");

    var albums = window.ALBUMS || [];
    var photos = window.PHOTOS || [];
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* Photos with no matching album would be unreachable — collect them so a
       typo'd id shows up as its own album rather than silently vanishing. */
    var known = {};
    albums.forEach(function (a) { known[a.id] = true; });
    var orphans = photos.filter(function (p) { return !known[p.album]; });
    if (orphans.length) {
        var ids = [];
        orphans.forEach(function (p) {
            if (ids.indexOf(p.album) === -1) ids.push(p.album);
        });
        ids.forEach(function (id) {
            albums.push({ id: id || "other", title: id || "Other" });
        });
    }

    function photosIn(albumId) {
        return photos.filter(function (p) { return (p.album || "other") === albumId; });
    }

    if (!photos.length || !albums.length) {
        if (emptyState) emptyState.hidden = false;
        indexView.hidden = true;
        if (albumView) albumView.hidden = true;
        if (flickrLink) flickrLink.hidden = true;
        if (window.SiteMotion) window.SiteMotion.scan(document);
        return;
    }

    /* ---- Album index --------------------------------------------------- */

    albums.forEach(function (album) {
        var inAlbum = photosIn(album.id);
        if (!inAlbum.length) return;

        var cover = album.cover || inAlbum[0].src;
        var coverAlt = album.cover ? album.title : inAlbum[0].alt;

        var li = document.createElement("li");
        li.className = "album-card reveal reveal-clip";

        var link = document.createElement("a");
        link.className = "album-link";
        link.href = "#" + album.id;

        var img = document.createElement("img");
        img.src = cover;
        img.alt = coverAlt;
        img.loading = "lazy";
        img.decoding = "async";

        var label = document.createElement("span");
        label.className = "album-label";
        label.innerHTML =
            '<span class="album-name"></span><span class="album-count"></span>';
        label.querySelector(".album-name").textContent = album.title;
        label.querySelector(".album-count").textContent =
            inAlbum.length + (inAlbum.length === 1 ? " photo" : " photos");

        link.appendChild(img);
        link.appendChild(label);
        li.appendChild(link);
        albumGrid.appendChild(li);
    });

    /* ---- Justified rows ------------------------------------------------ */

    var GAP = 8;
    var current = [];   /* photos in the album being viewed */

    function targetRowHeight(width) {
        if (width < 560) return 180;
        if (width < 900) return 220;
        return 280;
    }

    /* Fill each row edge to edge: pick how many photos fit at roughly the
       target height, then solve for the exact height that makes them span the
       full width. Aspect ratios come from the manifest, so this runs before
       any image has loaded. */
    function layoutRows() {
        if (!current.length) return;
        var width = photoRows.clientWidth;
        if (!width) return;

        var target = targetRowHeight(width);
        var row = [];
        var ratioSum = 0;

        photoRows.style.setProperty("--gap", GAP + "px");

        function flush(isLast) {
            if (!row.length) return;
            var gaps = GAP * (row.length - 1);
            var height = (width - gaps) / ratioSum;
            /* A lone trailing photo shouldn't blow up to full width */
            if (isLast && height > target * 1.5) height = target;

            row.forEach(function (entry) {
                var w = height * entry.ratio;
                entry.el.style.width = w + "px";
                entry.el.style.height = height + "px";
            });
            row = [];
            ratioSum = 0;
        }

        current.forEach(function (entry, i) {
            row.push(entry);
            ratioSum += entry.ratio;
            var projected = (width - GAP * (row.length - 1)) / ratioSum;
            if (projected <= target) flush(false);
            if (i === current.length - 1) flush(true);
        });
    }

    var layoutQueued = false;
    function queueLayout() {
        if (layoutQueued) return;
        layoutQueued = true;
        window.requestAnimationFrame(function () {
            layoutQueued = false;
            layoutRows();
        });
    }

    function renderAlbum(album) {
        photoRows.innerHTML = "";
        current = [];

        albumTitle.textContent = album.title;
        albumBlurb.textContent = album.blurb || "";
        albumBlurb.hidden = !album.blurb;

        photosIn(album.id).forEach(function (photo, index) {
            var fig = document.createElement("figure");
            fig.className = "photo-cell";

            var button = document.createElement("button");
            button.type = "button";
            button.className = "photo-tile";
            button.setAttribute("aria-label", "Open photo: " + photo.alt);

            var img = document.createElement("img");
            img.src = photo.src;
            img.alt = photo.alt;
            img.loading = "lazy";
            img.decoding = "async";
            if (photo.w && photo.h) {
                img.width = photo.w;
                img.height = photo.h;
            }

            button.appendChild(img);
            fig.appendChild(button);
            photoRows.appendChild(fig);

            button.addEventListener("click", function () { open(index); });

            current.push({
                el: fig,
                ratio: photo.w && photo.h ? photo.w / photo.h : 1.5,
                photo: photo
            });
        });

        layoutRows();
    }

    /* ---- Routing -------------------------------------------------------- */

    function albumById(id) {
        for (var i = 0; i < albums.length; i++) {
            if (albums[i].id === id) return albums[i];
        }
        return null;
    }

    function route() {
        var id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        var album = id ? albumById(id) : null;

        if (album) {
            indexView.hidden = true;
            if (intro) intro.hidden = true;
            albumView.hidden = false;
            renderAlbum(album);
            if (window.SiteMotion) window.SiteMotion.scan(albumView);
        } else {
            albumView.hidden = true;
            if (intro) intro.hidden = false;
            indexView.hidden = false;
            current = [];
            if (window.SiteMotion) window.SiteMotion.scan(indexView);
        }
    }

    window.addEventListener("hashchange", function () {
        route();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
    window.addEventListener("resize", queueLayout, { passive: true });
    route();

    /* ---- Lightbox ------------------------------------------------------- */

    var lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    var figure = lightbox.querySelector(".lightbox-figure");
    var image = lightbox.querySelector(".lightbox-img");
    var caption = lightbox.querySelector(".lightbox-caption-text");
    var counter = lightbox.querySelector(".lightbox-count");
    var btnPrev = lightbox.querySelector(".lightbox-prev");
    var btnNext = lightbox.querySelector(".lightbox-next");
    var btnClose = lightbox.querySelector(".lightbox-close");
    var backdrop = lightbox.querySelector(".lightbox-backdrop");

    var index = -1;
    var lastFocused = null;

    function preload(i) {
        if (i < 0 || i >= current.length) return;
        var img = new Image();
        img.src = current[i].photo.src;
    }

    function render(i) {
        var photo = current[i].photo;
        image.src = photo.src;
        image.alt = photo.alt;
        caption.textContent = photo.alt;
        counter.textContent = i + 1 + " of " + current.length;
        btnPrev.disabled = i === 0;
        btnNext.disabled = i === current.length - 1;
        preload(i - 1);
        preload(i + 1);
    }

    function open(i) {
        if (i < 0 || i >= current.length) return;
        lastFocused = document.activeElement;
        index = i;
        render(index);

        var scrollbar = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
        document.body.classList.add("lightbox-open");

        lightbox.hidden = false;
        void lightbox.offsetWidth; /* force a frame so the entry runs from closed */
        lightbox.classList.add("is-open");
        btnClose.focus();
    }

    function close() {
        if (index === -1) return;
        lightbox.classList.add("is-closing");
        lightbox.classList.remove("is-open");

        var done = function () {
            lightbox.hidden = true;
            lightbox.classList.remove("is-closing");
            figure.style.transform = "";
            figure.style.opacity = "";
            document.body.classList.remove("lightbox-open");
            document.body.style.paddingRight = "";
            if (lastFocused && lastFocused.focus) lastFocused.focus();
            index = -1;
        };

        if (reduceMotion.matches) done();
        else window.setTimeout(done, 200);
    }

    function go(delta) {
        var next = index + delta;
        if (next < 0 || next >= current.length) return;
        index = next;
        render(index);
    }

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { go(-1); });
    btnNext.addEventListener("click", function () { go(1); });
    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
        if (index === -1) return;
        if (e.key === "Escape") {
            close();
        } else if (e.key === "ArrowLeft") {
            go(-1);
        } else if (e.key === "ArrowRight") {
            go(1);
        } else if (e.key === "Tab") {
            var focusable = [btnClose, btnPrev, btnNext].filter(function (el) {
                return !el.disabled;
            });
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    /* ---- Drag: swipe to navigate, pull down to dismiss ------------------- */

    var drag = null;

    function rubberband(overshoot, dimension) {
        var constant = 0.55;
        return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
    }

    figure.addEventListener("pointerdown", function (e) {
        if (index === -1 || drag) return;        /* ignore extra touches mid-drag */
        if (e.target.closest(".lightbox-btn")) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: e.timeStamp, vx: 0, vy: 0 };
        figure.setPointerCapture(e.pointerId);
        figure.classList.add("is-dragging");
    });

    figure.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;

        var dt = Math.max(1, e.timeStamp - drag.t);
        var dx = e.clientX - drag.x;
        var dy = e.clientY - drag.y;
        drag.vx = (dx - drag.dx) / dt;
        drag.vy = (dy - drag.dy) / dt;
        drag.dx = dx;
        drag.dy = dy;
        drag.t = e.timeStamp;

        var offsetX = dx;
        var atStart = index === 0 && dx > 0;
        var atEnd = index === current.length - 1 && dx < 0;
        if (atStart || atEnd) offsetX = rubberband(dx, window.innerWidth);

        var fade = Math.max(0, 1 - Math.abs(dy) / (window.innerHeight * 0.6));
        /* Set transform on the element directly — never via a parent variable */
        figure.style.transform = "translate(" + offsetX + "px, " + dy + "px)";
        figure.style.opacity = String(dy > 0 ? fade : 1);
    });

    function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;

        var dx = drag.dx, dy = drag.dy, vx = drag.vx, vy = drag.vy;
        drag = null;

        figure.classList.remove("is-dragging");
        figure.style.transform = "";
        figure.style.opacity = "";

        /* A flick counts even when it did not travel far */
        if (dy > 110 || vy > 0.45) {
            close();
            return;
        }
        if (Math.abs(dx) > window.innerWidth * 0.2 || Math.abs(vx) > 0.45) {
            go(dx < 0 ? 1 : -1);
        }
    }

    figure.addEventListener("pointerup", endDrag);
    figure.addEventListener("pointercancel", endDrag);
})();

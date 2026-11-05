"use strict";
(() => {
    const canvas = document.getElementById("scene");
    const output = canvas.getContext("2d", {alpha: false});
    const errorBox = document.getElementById("error");
    const ids = new Set(THEMES.map(entry => entry[0]));
    const defaultImages = {
        logo: new URL("assets/steam-deck-checker.png", document.baseURI).href,
        bazziteLogo: new URL("assets/bazzite-logo.svg", document.baseURI).href,
        wallpaper: new URL("assets/steam-deck-checker-games.png", document.baseURI).href,
        bazziteWallpaper: new URL("assets/bazzite-wallpaper.png", document.baseURI).href
    };
    let config = {theme: "matrix", randomMinutes: 5, speed: 1, fps: 24, quality: 0.6, paused: false, hostControlsVisibility: false, logo: "", bazziteLogo: "", wallpaper: "", bazziteWallpaper: "", dim: 45};
    let activeTheme = "matrix";
    let engine = null, pointer = null, request = 0, last = 0, next = 0, frames = 0, failed = false;
    let images = {}, imageVersion = 0;
    const input = new PointerState();
    const clamp = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
    const rotation = new ThemeRotation([...ids], theme => {
        activeTheme = theme;
        rebuild();
    });
    rotation.setCurrent(activeTheme);

    function browserHidden() {
        // An embedded wallpaper can report hidden while Lively is playing it.
        // Once connected, Lively's playback notifications own the lifecycle.
        return !config.hostControlsVisibility && document.hidden;
    }

    function showError(error) {
        failed = true;
        cancelAnimationFrame(request);
        request = 0;
        rotation.setPaused(true);
        errorBox.style.display = "block";
        errorBox.textContent = "Live Background: " + error.message;
        console.error(error);
    }
    function paint() {
        output.drawImage(engine.main.canvas, 0, 0, canvas.width, canvas.height);
    }
    function step(dt) {
        pointer = input.frame();
        engine.step(dt, pointer);
    }
    function rebuild() {
        failed = false;
        errorBox.style.display = "none";
        try {
            if (engine) engine.destroy();
            const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
            canvas.width = scaledSize(width, config.quality);
            canvas.height = scaledSize(height, config.quality);
            engine = new Engine(width, height, config.quality);
            engine.setLogo(images[activeTheme === "neon-bazzite" ? "bazziteLogo" : "logo"] || null);
            engine.setWallpaper(images[activeTheme === "orbs-bazzite" ? "bazziteWallpaper" : "wallpaper"] || null);
            engine.setOption("orbsDim", config.dim);
            engine.setTheme(activeTheme);
            step(1 / 30);
            paint();
        } catch (error) { showError(error); }
        schedule();
    }
    function schedule() {
        cancelAnimationFrame(request);
        request = 0;
        last = 0;
        next = 0;
        rotation.setPaused(config.paused || browserHidden() || failed);
        if (config.paused || browserHidden()) input.clear();
        if (!config.paused && !browserHidden() && !failed) request = requestAnimationFrame(tick);
    }
    function tick(now) {
        request = 0;
        if (config.paused || browserHidden() || failed) return;
        // Embedded browser long timers can be delayed. The visible animation
        // also checks the deadline, and a switch schedules its own next frame.
        if (rotation.checkDue()) return;
        const interval = 1000 / config.fps;
        if (!last) { last = now; next = now + interval; }
        if (now + 0.05 >= next) {
            const elapsed = now - last;
            last = now;
            next += interval;
            if (next <= now) next = now + interval;
            try {
                step(Math.min(elapsed / 1000, 0.1) * config.speed);
                paint();
                ++frames;
            } catch (error) { showError(error); return; }
        }
        request = requestAnimationFrame(tick);
    }
    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve({image, w: image.naturalWidth, h: image.naturalHeight, rs: 1});
            image.onerror = () => reject(new Error("Bild nicht lesbar: " + path));
            image.src = path.startsWith("/") ? "file://" + path.split("/").map(encodeURIComponent).join("/") : path;
        });
    }
    async function refreshImages() {
        const version = ++imageVersion;
        try {
            // Preload both variants so random and manual changes use the right
            // image immediately, without reusing the previous variant's asset.
            const loaded = await Promise.all(Object.entries(defaultImages).map(async ([key, path]) =>
                [key, await loadImage(config[key] || path)]));
            if (version !== imageVersion) return;
            images = Object.fromEntries(loaded);
            rebuild();
        } catch (error) {
            if (version === imageVersion) showError(error);
        }
    }
    window.LiveWallpaper = {
        configure(values = {}) {
            const previous = config;
            const requestedTheme = values.theme === undefined ? previous.theme : String(values.theme);
            config = {
                theme: requestedTheme === "random" || ids.has(requestedTheme) ? requestedTheme : "matrix",
                randomMinutes: Math.round(clamp(values.randomMinutes ?? previous.randomMinutes, 1, 30, 5)),
                speed: clamp(values.speed ?? previous.speed, 0.25, 3, 1),
                fps: clamp(values.fps ?? previous.fps, 10, 60, 24),
                quality: clamp(values.quality ?? previous.quality, 0.4, 1, 0.6),
                dim: clamp(values.dim ?? previous.dim, 0, 90, 45),
                paused: values.paused === undefined ? previous.paused : Boolean(values.paused),
                hostControlsVisibility: values.hostControlsVisibility === undefined ? previous.hostControlsVisibility : Boolean(values.hostControlsVisibility),
                logo: values.logo === undefined ? previous.logo : String(values.logo),
                bazziteLogo: values.bazziteLogo === undefined ? previous.bazziteLogo : String(values.bazziteLogo),
                wallpaper: values.wallpaper === undefined ? previous.wallpaper : String(values.wallpaper),
                bazziteWallpaper: values.bazziteWallpaper === undefined ? previous.bazziteWallpaper : String(values.bazziteWallpaper)
            };
            const startingRandom = config.theme === "random" && !rotation.enabled;
            if (config.theme !== "random") {
                activeTheme = config.theme;
                rotation.setCurrent(activeTheme);
            }
            rotation.setPaused(config.paused || browserHidden() || failed);
            rotation.configure(config.theme === "random", config.randomMinutes);
            const imagesChanged = Object.keys(defaultImages).some(key => previous[key] !== config[key]);
            if (imagesChanged) {
                failed = false;
                refreshImages();
            } else if (!startingRandom && (!engine || previous.theme !== config.theme || previous.quality !== config.quality || failed)) {
                rebuild();
            } else {
                engine.setOption("orbsDim", config.dim);
                if (config.paused && previous.dim !== config.dim) {
                    step(1 / 30);
                    paint();
                }
            }
            schedule();
        },
        setPointer(value) {
            if (config.paused || browserHidden()) input.clear();
            else input.update(value);
        },
        clearPointer() { input.clear(); pointer = null; },
        state() { return {theme: activeTheme, mode: config.theme, randomMinutes: config.randomMinutes, paused: config.paused, rotationPaused: rotation.paused, rotationRemainingMs: rotation.remaining(), hostControlsVisibility: config.hostControlsVisibility, frames, failed, error: failed ? errorBox.textContent : "", width: canvas.width, height: canvas.height}; }
    };
    addEventListener("resize", rebuild);
    document.addEventListener("visibilitychange", schedule);
    canvas.addEventListener("pointermove", event => {
        if (event.isPrimary === false) return;
        window.LiveWallpaper.setPointer({x: event.clientX, y: event.clientY, down: Boolean(event.buttons & 1), free: true});
    });
    canvas.addEventListener("pointerdown", event => {
        if (event.isPrimary === false || event.button !== 0) return;
        canvas.setPointerCapture(event.pointerId);
        window.LiveWallpaper.setPointer({x: event.clientX, y: event.clientY, down: true, free: true});
    });
    canvas.addEventListener("pointerup", event => {
        if (event.isPrimary === false) return;
        window.LiveWallpaper.setPointer(event.pointerType === "mouse" ? {x: event.clientX, y: event.clientY, down: false, free: true} : null);
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointerleave", event => {
        if (!canvas.hasPointerCapture(event.pointerId)) window.LiveWallpaper.setPointer(null);
    });
    canvas.addEventListener("pointercancel", () => window.LiveWallpaper.clearPointer());
    addEventListener("blur", () => window.LiveWallpaper.clearPointer());
    if (new URLSearchParams(location.search).has("preview")) {
        document.getElementById("preview").style.display = "block";
        const select = document.getElementById("themes");
        for (const [id, title] of THEMES) select.add(new Option(title, id));
        select.add(new Option("Zufällig (automatischer Wechsel)", "random"));
        const intervalRow = document.getElementById("rotation-settings");
        const intervalInput = document.getElementById("minutes");
        select.addEventListener("change", () => {
            window.LiveWallpaper.configure({theme: select.value});
            intervalRow.hidden = select.value !== "random";
        });
        intervalInput.addEventListener("change", () => {
            window.LiveWallpaper.configure({randomMinutes: Number(intervalInput.value)});
            intervalInput.value = config.randomMinutes;
        });
        document.getElementById("pause").addEventListener("click", event => {
            window.LiveWallpaper.configure({paused: !config.paused});
            event.target.textContent = config.paused ? "Fortsetzen" : "Pause";
        });
    }
    rebuild();
    refreshImages();
})();

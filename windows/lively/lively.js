// Lively Wallpaper bridge for SDC Live Background 0.3.2.
// Documentation: https://github.com/lively-community/lively/wiki/Web-Guide-IV-:-Interaction
// Pause events: https://github.com/lively-community/lively/wiki/Web-Guide-V-:-System-Data
"use strict";
(() => {
    const themeIds = ["matrix", "code", "storm", "starfield", "fireflies", "neon", "neon-bazzite", "orbs", "orbs-bazzite", "random"];
    const options = {
        theme: "neon", randomMinutes: 5, speed: 1, fps: 24,
        quality: 0.6, dim: 45, paused: false,
        logo: "", bazziteLogo: "", wallpaper: "", bazziteWallpaper: ""
    };
    let hostPaused = false;
    const number = (value, min, max, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
    };
    function imagePath(value) {
        if (value === null || value === undefined || value === "") return "";
        let path = String(value).replace(/\\/g, "/");
        if (/^(?:file:|data:|blob:)/i.test(path)) return path;
        if (/^[a-z]:\//i.test(path)) {
            return "file:///" + path.split("/").map((part, i) => i ? encodeURIComponent(part) : part).join("/");
        }
        // Lively folderDropdown returns a relative file location. Accept both
        // a plain filename and an assets/filename path, including spaces and #.
        if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return "";
        if (!path.includes("/")) path = "assets/" + path;
        return path.split("/").map(encodeURIComponent).join("/");
    }
    function apply() {
        if (!window.LiveWallpaper) return;
        window.LiveWallpaper.configure({...options, paused: options.paused || hostPaused});
        const select = document.getElementById("themes");
        if (select) select.value = options.theme;
        const interval = document.getElementById("minutes");
        if (interval) interval.value = options.randomMinutes;
        const row = document.getElementById("rotation-settings");
        if (row) row.hidden = options.theme !== "random";
    }
    window.livelyPropertyListener = (name, value) => {
        switch (name) {
            case "theme": {
                const index = Number(value);
                options.theme = themeIds.includes(value) ? value
                    : Number.isInteger(index) && index >= 0 && index < themeIds.length ? themeIds[index] : "neon";
                break;
            }
            case "randomMinutes": options.randomMinutes = Math.round(number(value, 1, 30, 5)); break;
            case "speed": options.speed = number(value, 25, 300, 100) / 100; break;
            case "fps": options.fps = Math.round(number(value, 10, 60, 24)); break;
            case "quality": options.quality = number(value, 40, 100, 60) / 100; break;
            case "dim": options.dim = number(value, 0, 90, 45); break;
            case "paused": options.paused = value === true || value === 1 || value === "true"; break;
            case "logo":
            case "bazziteLogo":
            case "wallpaper":
            case "bazziteWallpaper": options[name] = imagePath(value); break;
            default: return;
        }
        apply();
    };
    window.livelyWallpaperPlaybackChanged = data => {
        try {
            const message = typeof data === "string" ? JSON.parse(data) : data;
            if (message && typeof message.IsPaused === "boolean") {
                hostPaused = message.IsPaused;
                apply();
            }
        } catch (_) {
            // An incomplete host notification must not stop the wallpaper.
        }
    };
    window.LivelyWallpaperBridge = {
        version: "0.3.2",
        state: () => ({...options, hostPaused, effectivePaused: options.paused || hostPaused})
    };
    // Properties can arrive before the web player is ready. Retain them and
    // apply after all scripts have loaded. Lively persists the properties.
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, {once: true});
    else apply();
})();

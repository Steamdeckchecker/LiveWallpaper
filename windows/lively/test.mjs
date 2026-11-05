import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath, pathToFileURL} from "node:url";
import {chromium} from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stage = path.join(root, "build/lively");
const qa = path.join(root, "build/qa");
await fs.mkdir(qa, {recursive: true});
const props = JSON.parse(await fs.readFile(path.join(stage, "LivelyProperties.json"), "utf8"));
const info = JSON.parse(await fs.readFile(path.join(stage, "LivelyInfo.json"), "utf8"));
const ids = ["matrix", "code", "storm", "starfield", "fireflies", "neon", "neon-bazzite", "orbs", "orbs-bazzite"];
assert.equal(info.Type, 1);
assert.equal(info.Arguments, "--pause-event true");
assert.equal(props.theme.items.length, 10);
for (const file of ["adapter.js", "engine.js", "randomizer.js", "pointer.js", "player.js", "lively.js"]) {
    new vm.Script(await fs.readFile(path.join(stage, file), "utf8"), {filename: file});
}
const localization = JSON.parse(await fs.readFile(path.join(stage, "LivelyProperties.loc.json"), "utf8"));
for (const key of Object.keys(props)) assert.ok(localization.Languages["de-DE"][key], "Missing German label: " + key);
const browser = await chromium.launch({headless: true});
try {
    const context = await browser.newContext({viewport: {width: 1280, height: 720}, hasTouch: true});
    await context.addInitScript(() => {
        // Advance only the wallpaper's long rotation timers. Animation frames,
        // image loading and short browser timers keep their real timing.
        const schedule = window.setTimeout.bind(window);
        const cancel = window.clearTimeout.bind(window);
        window.__rotationTimers = new Map();
        let next = -1;
        window.setTimeout = (callback, delay, ...args) => {
            if (delay >= 60000 && delay <= 1800000) {
                const id = next--;
                window.__rotationTimers.set(id, {callback: () => callback(...args), delay});
                return id;
            }
            return schedule(callback, delay, ...args);
        };
        window.clearTimeout = id => {
            if (!window.__rotationTimers.delete(id)) cancel(id);
        };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
        if (message.type() === "error") errors.push(message.text());
    });
    const url = pathToFileURL(path.join(stage, "index.html")).href;
    const asset = name => new URL("assets/" + encodeURIComponent(name), url).href;
    await page.goto(url);
    await page.waitForFunction(() => window.LiveWallpaper && LiveWallpaper.state().frames >= 4);
    assert.equal(await page.evaluate(() => LiveWallpaper.state().theme), "neon");
    await page.evaluate(() => {
        window.__probe = {drawn: []};
        for (const [method, key] of [["setLogo", "logo"], ["setWallpaper", "wallpaper"]]) {
            const original = Engine.prototype[method];
            Engine.prototype[method] = function(image) {
                window.__probe[key] = image?.image.src || "";
                return original.call(this, image);
            };
        }
        const originalTheme = Engine.prototype.setTheme;
        Engine.prototype.setTheme = function(id) {
            window.__probe.theme = id;
            window.__probe.known = Object.hasOwn(this.themes, id);
            return originalTheme.call(this, id);
        };
        const originalDraw = Ctx2D.prototype.drawImage;
        Ctx2D.prototype.drawImage = function(image, ...args) {
            if (image.image && !window.__probe.drawn.includes(image.image.src)) {
                window.__probe.drawn.push(image.image.src);
            }
            return originalDraw.call(this, image, ...args);
        };
        const originalStep = Engine.prototype.step;
        Engine.prototype.step = function(dt, pointer) {
            window.__probe.pointer = pointer;
            return originalStep.call(this, dt, pointer);
        };
    });
    const property = (name, value) => page.evaluate(([key, val]) => livelyPropertyListener(key, val), [name, value]);
    const state = () => page.evaluate(() => ({...LiveWallpaper.state(), probe: window.__probe}));
    async function select(index) {
        const before = (await state()).frames;
        await page.evaluate(() => { window.__probe.drawn = []; });
        await property("theme", index);
        await page.waitForFunction(({id, frames}) => LiveWallpaper.state().theme === id && LiveWallpaper.state().frames >= frames + 2,
            {id: ids[index], frames: before});
        const result = await state();
        assert.equal(result.failed, false, result.error);
        assert.equal(result.probe.known, true, "Unknown engine alias: " + ids[index]);
        return result;
    }
    for (let index = 0; index < ids.length; ++index) {
        const result = await select(index);
        const theme = ids[index];
        if (theme.startsWith("neon")) {
            const expected = asset(theme.endsWith("bazzite") ? "bazzite-logo.svg" : "steam-deck-checker.png");
            assert.equal(result.probe.logo, expected);
            assert.ok(result.probe.drawn.includes(expected), "Logo was not actually drawn: " + theme);
        }
        if (theme.startsWith("orbs")) {
            const expected = asset(theme.endsWith("bazzite") ? "bazzite-wallpaper.png" : "steam-deck-checker-games.png");
            assert.equal(result.probe.wallpaper, expected);
            assert.ok(result.probe.drawn.includes(expected), "Background was not actually drawn: " + theme);
        }
        await page.mouse.move(640, 360);
        await page.mouse.down();
        await page.waitForTimeout(100);
        assert.equal((await state()).probe.pointer?.down, true);
        await page.mouse.move(700, 400);
        await page.mouse.up();
        await page.touchscreen.tap(500, 300);
        await page.waitForTimeout(100);
        assert.equal((await state()).failed, false);
        if (["neon", "neon-bazzite", "orbs", "orbs-bazzite"].includes(theme)) {
            await page.waitForTimeout(1400);
            await page.screenshot({path: path.join(qa, theme + ".png")});
        }
    }
    console.log("PASS: nine rendered themes, correct images, mouse and browser touch events");

    await property("quality", 100);
    await page.waitForFunction(() => LiveWallpaper.state().width === 1280);
    await property("quality", 60);
    await page.waitForFunction(() => LiveWallpaper.state().width === 768);
    await property("speed", 125);
    await property("fps", 30);
    await property("dim", 20);
    let bridge = await page.evaluate(() => LivelyWallpaperBridge.state());
    assert.equal(bridge.speed, 1.25);
    assert.equal(bridge.fps, 30);
    assert.equal(bridge.dim, 20);

    await property("logo", "assets/bazzite-logo.svg");
    assert.equal((await select(5)).probe.logo, asset("bazzite-logo.svg"));
    assert.equal((await select(6)).probe.logo, asset("bazzite-logo.svg"));
    await property("bazziteLogo", "steam-deck-checker.png");
    await page.waitForFunction(expected => window.__probe.logo === expected, asset("steam-deck-checker.png"));
    assert.equal((await select(5)).probe.logo, asset("bazzite-logo.svg"));

    await property("wallpaper", "assets/bazzite-wallpaper.png");
    assert.equal((await select(7)).probe.wallpaper, asset("bazzite-wallpaper.png"));
    assert.equal((await select(8)).probe.wallpaper, asset("bazzite-wallpaper.png"));
    await property("bazziteWallpaper", "assets\\steam-deck-checker-games.png");
    await page.waitForFunction(expected => window.__probe.wallpaper === expected, asset("steam-deck-checker-games.png"));

    const special = "Custom Logo #1.png";
    await fs.copyFile(path.join(stage, "assets/steam-deck-checker.png"), path.join(stage, "assets", special));
    await property("logo", special);
    assert.equal((await select(5)).probe.logo, asset(special));
    await property("logo", props.logo.value);
    await page.waitForFunction(expected => window.__probe.logo === expected, asset(props.logo.value));
    await fs.unlink(path.join(stage, "assets", special));
    for (const [name, setting] of Object.entries(props)) await property(name, setting.value);
    assert.equal((await select(5)).probe.logo, asset("steam-deck-checker.png"));
    assert.equal((await select(6)).probe.logo, asset("bazzite-logo.svg"));
    assert.equal((await select(7)).probe.wallpaper, asset("steam-deck-checker-games.png"));
    assert.equal((await select(8)).probe.wallpaper, asset("bazzite-wallpaper.png"));
    console.log("PASS: controls, custom images, separate variants, Windows paths, special filenames and default replay");

    await property("theme", 9);
    await property("randomMinutes", 1);
    const rounds = await page.evaluate(() => {
        const chosen = [LiveWallpaper.state().theme];
        for (let i = 1; i < 45; ++i) {
            const [id, timer] = window.__rotationTimers.entries().next().value;
            window.__rotationTimers.delete(id);
            timer.callback();
            chosen.push(LiveWallpaper.state().theme);
            if (LiveWallpaper.state().failed) throw new Error(LiveWallpaper.state().error);
        }
        return chosen;
    });
    for (let offset = 0; offset < rounds.length; offset += 9) {
        assert.deepEqual(new Set(rounds.slice(offset, offset + 9)), new Set(ids));
    }
    assert.ok(rounds.every((id, index) => index === 0 || id !== rounds[index - 1]));
    await property("randomMinutes", 30);
    assert.equal(await page.evaluate(() => Array.from(window.__rotationTimers.values())[0].delay), 1800000);

    await page.evaluate(() => livelyWallpaperPlaybackChanged(JSON.stringify({IsPaused: true})));
    assert.equal((await state()).paused, true);
    assert.equal(await page.evaluate(() => window.__rotationTimers.size), 0);
    const frozen = (await state()).frames;
    await page.waitForTimeout(250);
    assert.equal((await state()).frames, frozen);
    await property("paused", true);
    await page.evaluate(() => livelyWallpaperPlaybackChanged({IsPaused: false}));
    assert.equal((await state()).paused, true);
    await property("paused", false);
    assert.equal((await state()).paused, false);
    assert.equal(await page.evaluate(() => window.__rotationTimers.size), 1);
    await page.evaluate(() => livelyWallpaperPlaybackChanged({IsPaused: true}));
    await property("paused", true);
    await property("paused", false);
    assert.equal((await state()).paused, true);
    await page.evaluate(() => livelyWallpaperPlaybackChanged({IsPaused: false}));
    assert.equal((await state()).paused, false);
    console.log("PASS: five shuffled rounds, interval updates, timer pause and combined host/user pause");

    await page.reload();
    await page.waitForFunction(() => window.LiveWallpaper && LiveWallpaper.state().frames >= 2);
    await property("theme", 6);
    await property("fps", 30);
    await property("quality", 80);
    await property("speed", 125);
    await page.waitForFunction(() => LiveWallpaper.state().theme === "neon-bazzite" && LiveWallpaper.state().width === 1024);
    bridge = await page.evaluate(() => LivelyWallpaperBridge.state());
    assert.equal(bridge.fps, 30);
    assert.equal(bridge.speed, 1.25);

    await page.goto(url + "?preview");
    await page.waitForFunction(() => window.LiveWallpaper && LiveWallpaper.state().theme === "neon" && LiveWallpaper.state().frames >= 2);
    assert.equal(await page.locator("#themes option").count(), 10);
    assert.equal(await page.locator("#themes").inputValue(), "neon");
    await page.locator("#themes").selectOption("orbs-bazzite");
    await page.waitForFunction(() => LiveWallpaper.state().theme === "orbs-bazzite");
    assert.equal((await state()).failed, false);

    await page.goto(url);
    await page.waitForFunction(() => window.LiveWallpaper && LiveWallpaper.state().theme === "neon" && LiveWallpaper.state().frames >= 5);
    await page.screenshot({path: path.join(stage, "thumbnail.jpg"), type: "jpeg", quality: 85});
    await fs.copyFile(path.join(stage, "thumbnail.jpg"), path.join(root, "windows/lively/thumbnail.jpg"));
    assert.deepEqual(errors, []);
    const report = {
        result: "passed", themes: ids, browser: browser.version(),
        checks: ["actual rendering and assets", "mouse and browser touch events", "Lively properties",
            "separate custom images", "Windows and special-character paths", "restore defaults",
            "five random rounds", "combined host/manual pause", "settings replay after reload", "browser preview"],
        limitation: "Lively callbacks were simulated. Native Windows desktop and device touch forwarding require a Windows/Lively test."
    };
    await fs.writeFile(path.join(qa, "report.json"), JSON.stringify(report, null, 2) + "\n");
    console.log("ALL LIVELY BROWSER CHECKS PASSED");
} finally {
    await browser.close();
}

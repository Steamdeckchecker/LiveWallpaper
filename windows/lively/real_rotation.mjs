import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = pathToFileURL(path.join(root, 'build/lively/index.html')).href;
const properties = JSON.parse(await fs.readFile(path.join(root, 'build/lively/LivelyProperties.json'), 'utf8'));
const browser = await chromium.launch({headless: true});
try {
    const cases = [];
    for (const kind of ['normal', 'host-active-browser-hidden', 'delayed-browser-timer']) {
        const context = await browser.newContext({viewport: {width: 800, height: 450}});
        if (kind === 'host-active-browser-hidden') {
            await context.addInitScript(() => Object.defineProperty(document, 'hidden', {get: () => true, configurable: true}));
        }
        if (kind === 'delayed-browser-timer') {
            await context.addInitScript(() => {
                const schedule = window.setTimeout.bind(window);
                window.setTimeout = (callback, delay, ...args) => schedule(
                    delay >= 60000 && delay <= 1800000 ? () => {} : callback, delay, ...args);
            });
        }
        const page = await context.newPage();
        await page.goto(url);
        await page.waitForFunction(() => Boolean(window.LiveWallpaper));
        await page.evaluate(() => {
            livelyPropertyListener('theme', 9);
            livelyPropertyListener('randomMinutes', 1);
            livelyWallpaperPlaybackChanged({IsPaused: false});
        });
        await page.waitForFunction(() => LiveWallpaper.state().frames >= 2);
        const initial = await page.evaluate(() => LiveWallpaper.state());
        assert.equal(initial.rotationPaused, false, kind);
        assert.equal(initial.hostControlsVisibility, true, kind);
        cases.push({kind, page, initial, started: Date.now()});
    }
    // Run with real time: no accelerated Date/performance clocks, and no
    // manual firing of the production rotation callback.
    for (let phase = 0; phase < 4; ++phase) {
        await new Promise(resolve => setTimeout(resolve, 15000));
        for (const test of cases) {
            if (phase === 0 || phase === 2) {
                await test.page.evaluate(props => {
                    for (const [name, prop] of Object.entries(props)) {
                        livelyPropertyListener(name, name === 'theme' ? 9 : name === 'randomMinutes' ? 1 : prop.value);
                    }
                }, properties);
            }
        }
        console.log('Real-minute rotation: ' + (phase + 1) * 15 + ' seconds elapsed');
    }
    const result = [];
    for (const test of cases) {
        await test.page.waitForFunction(initial => LiveWallpaper.state().theme !== initial,
            test.initial.theme, {timeout: 10000});
        const final = await test.page.evaluate(() => LiveWallpaper.state());
        assert.equal(final.failed, false, test.kind + ': ' + final.error);
        assert.equal(final.rotationPaused, false, test.kind);
        assert.ok(final.frames > test.initial.frames + 100, test.kind);
        result.push({case: test.kind, elapsedMs: Date.now() - test.started,
            from: test.initial.theme, to: final.theme, frames: final.frames});
        console.log('PASS: actual one-minute rotation: ' + test.kind);
    }
    await fs.writeFile(path.join(root, 'build/qa/real-minute-report.json'), JSON.stringify(result, null, 2) + '\n');
} finally {
    await browser.close();
}

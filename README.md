# LiveWallpaper
**Live Background for Bazzite / KDE Plasma 6 – Interactive wallpapers, automatic rotation, and new Bazzite themes**

Hey everyone,

I’ve adapted and expanded a live wallpaper package for KDE Plasma 6. It brings animated backgrounds to your desktop that react to your mouse, touchpad, and touchscreen.

Version **0.3.2** now includes dedicated Bazzite variants! 🙂

**Features:**

- **9 animated themes:** Matrix Rain, Code Stream, Thunderstorm, Starfield, Fireflies, plus Neon Emblem and Floating Bubbles in both Steam Deck Checker (SDC) and Bazzite variants.
- **Interactive effects:** Bubbles move away from your cursor, the neon emblem reacts with glowing effects and sparks, and other themes respond to your movements.
- **Automatic wallpaper rotation:** Choose an interval between **1 and 30 minutes**. Every theme appears once per shuffled round, with no immediate repeats.
- **Custom images and logos:** Use your own neon emblem or background image behind the bubbles. SDC and Bazzite variants store their image settings separately.
- **Adjustable visuals:** Configure animation speed, FPS, render resolution, and background dimming behind the bubbles.
- **Pause during fullscreen apps:** Optionally pause animations automatically when a fullscreen window is open. Manual pausing is also available.
- **Multiple monitors:** Select themes and settings individually for each display.
- **Works offline:** Animations and default graphics are included in the package.
- **Browser preview:** Try the animations before installing by opening the included `Vorschau.html` file.

Desktop icons, selection boxes, and right-click menus remain usable. Pointer interactions work over uncovered areas of the desktop.

To install, fully extract the ZIP, open a terminal in the included folder, and run `bash install.sh` **without sudo**. Then select **“Live Background (KDE)”** in KDE’s wallpaper settings. After updating an existing installation, log out and back in once.

The original animations come from [ryth9419-jpg/livewallpaper](https://github.com/ryth9419-jpg/livewallpaper). This KDE adaptation builds on that work with additional settings and interactions.

Feedback, bug reports, and ideas for additional themes are welcome!

Install:

1. Download and fully extract the ZIP.
2. Open a terminal inside the `Live_Background_KDE` folder and run `bash install.sh` **without sudo**.
3. Right-click the desktop → **Configure Desktop and Wallpaper**.
4. Set the wallpaper type to **Live Background (KDE)**, choose a theme, and click **Apply**.

After updating an existing installation, log out and back in once.


## Windows 11 / Lively Wallpaper

A Windows version with all nine themes is available as a Lively web wallpaper.

1. Install [Lively Wallpaper](https://www.rocksdanister.com/lively/), preferably 2.2 or newer.
2. Download [Live_Background_Lively_v0.3.2.zip](./Live_Background_Lively_v0.3.2.zip).
3. Drag that ZIP directly into Lively, select the imported wallpaper, then right-click > **Customise**.

The default is Neon Emblem SDC. Theme selection, random rotation, custom SDC/Bazzite
images, speed, FPS, render resolution and dimming are configurable through Lively.
Fullscreen and battery pause rules are configured in Lively Settings > Performance.

[Deutsche Anleitung](windows/lively/README_DE.md) · [English instructions](windows/lively/README_EN.md)

The Windows package reuses the renderer and assets from the KDE ZIP. Lively provides
the native desktop integration. Automated Chromium tests simulate Lively's documented
settings and pause callbacks; full Windows/Lively desktop and touchscreen checks are
separate tests.

To rebuild: run python windows/lively/build.py, install Playwright, run
node windows/lively/test.mjs, then python windows/lively/build.py --pack.

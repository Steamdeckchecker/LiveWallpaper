# SDC Live Background 0.3.2 for Windows 11 / Lively Wallpaper

## Installation

1. Install Lively Wallpaper from https://www.rocksdanister.com/lively/.
   Lively 2.2 or newer with the default WebView2 player is recommended.
2. **Drag Live_Background_Lively_v0.3.2.zip directly into the Lively window.**
   Do not extract the ZIP for this import.
3. Select the imported wallpaper.
4. Right-click its tile > **Customise** to select a theme and adjust settings.

The default is **Neon Emblem SDC**. All nine themes are included:
Matrix Rain, Code Stream, Thunderstorm, Starfield, Fireflies,
Neon Emblem SDC, Neon Emblem Bazzite, Floating Bubbles SDC and
Floating Bubbles Bazzite.

## Features and settings

- Theme selection and shuffled rotation every 1–30 minutes.
- Animation speed, 10–60 FPS and 40–100% render resolution.
- Dimming of the image behind the floating bubbles.
- Separate custom logos and backgrounds for SDC and Bazzite variants.
- Manual pause, including the random rotation timer.
- Restore defaults through Lively.

The initial settings are **24 FPS and 60% render resolution**. Each theme
appears once per shuffled round, without immediate repeats. Pausing preserves
the remaining time until the next change. Lively saves the settings and
supports independent settings per display. German settings localization
requires Lively 2.2 or newer.

## Custom images

Each image selector lists files from the bundled **assets** folder. Use
Lively's image import button to add your own images. If your version does
not offer an import button, right-click the wallpaper tile > Open File
Location, copy your image into **assets**, then reload the wallpaper.

Transparent PNG or SVG files work well for emblems. The original SDC and
Bazzite images remain included and can be selected again. Lively's Restore
Default command also resets the other wallpaper settings.

## Interaction and pausing

Enable mouse input under **Lively Settings > Wallpaper > Interaction**.
Lively forwards cursor movement and left clicks to the animation while
managing desktop icons and context menus.

The web player's touch handling remains included. Whether Lively forwards
touch events needs to be checked on the target Windows device.

Set fullscreen and battery pause rules under **Lively Settings >
Performance**. The wallpaper also processes Lively's pause notifications
for its rotation timer. Resuming through Lively does not override a manual
pause set in the wallpaper properties.

## Preview and removal

For a browser preview, extract the ZIP and open **Preview.html**.

To remove the wallpaper, select another wallpaper in Lively and delete the
SDC tile. No Linux installation scripts or administrator rights are needed.

## Validation

Automated tests run the actual HTML/JavaScript animations in Chromium and
simulate the documented Lively property and pause callbacks. They cover all
themes, image assignments, custom images, random rotation, settings replay
and combined manual/host pause.

A full Windows 11 desktop integration test with Lively and testing touch
input on Windows handhelds are separate checks. Lively provides the native
Windows desktop integration.

## Credits

See **CREDITS.md**. Original animation project:
https://github.com/ryth9419-jpg/livewallpaper.

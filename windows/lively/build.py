#!/usr/bin/env python3
"""Stage the shared renderer, then create a ZIP directly importable by Lively."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = Path(__file__).resolve().parent
SOURCE = ROOT / "Live_Background_KDE_v0.3.2.zip"
EXPECTED_SHA256 = "b67ce8339ff079784dfdfdbb3e9565da43999a75334d2d9de1ddd2e107aa150d"
STAGE = ROOT / "build" / "lively"
OUTPUT = ROOT / "Live_Background_Lively_v0.3.3.zip"
PREFIX = "Live_Background_KDE/org.steamdeckchecker.livebackground/contents/web/"

def stage():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit("The KDE source ZIP changed; review the source version and checksum before building.")
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)
    with ZipFile(SOURCE) as archive:
        assert archive.testzip() is None, "Corrupt source archive"
        for name in archive.namelist():
            if not name.startswith(PREFIX) or name.endswith("/"):
                continue
            relative = Path(name[len(PREFIX):])
            assert not relative.is_absolute() and ".." not in relative.parts
            target = STAGE / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(name))
    for name in ["lively.js", "player.js", "randomizer.js", "LivelyInfo.json", "LivelyInfo.loc.json",
                 "LivelyProperties.json", "LivelyProperties.loc.json",
                 "README_DE.md", "README_EN.md", "CREDITS.md"]:
        shutil.copyfile(TEMPLATES / name, STAGE / name)
    index = (STAGE / "index.html").read_text(encoding="utf-8")
    marker = '<script src="player.js"></script>'
    assert index.count(marker) == 1
    index = index.replace(marker, '<script src="lively.js"></script>\n    ' + marker)
    index = index.replace("Live Background – KDE", "SDC Live Background – Windows / Lively")
    (STAGE / "index.html").write_text(index, encoding="utf-8")
    engine = (STAGE / "engine.js").read_text(encoding="utf-8")
    for old, new in [
        ("Neon-Emblem-SDC", "Neon Emblem SDC"),
        ("Neon-Emblem-Bazzite", "Neon Emblem Bazzite"),
        ("Schwebende Blasen SDC", "Floating Bubbles SDC"),
        ("Schwebende Blasen Bazzite", "Floating Bubbles Bazzite")
    ]:
        assert old in engine
        engine = engine.replace(old, new)
    (STAGE / "engine.js").write_text(engine, encoding="utf-8")
    (STAGE / "Preview.html").write_text(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta http-equiv="refresh" content="0;url=index.html?preview">'
        '<title>SDC Live Background Preview</title></head><body>'
        '<a href="index.html?preview">Open preview</a></body></html>\n',
        encoding="utf-8")
    print(f"Staged Lively wallpaper: {STAGE}")

def pack():
    required = ["LivelyInfo.json", "LivelyProperties.json", "index.html",
                "lively.js", "player.js", "engine.js", "thumbnail.jpg",
                "assets/steam-deck-checker.png", "assets/steam-deck-checker-games.png",
                "assets/bazzite-logo.svg", "assets/bazzite-wallpaper.png"]
    for name in required:
        assert (STAGE / name).is_file(), f"Missing {name}; run staging and browser tests first."
    info = json.loads((STAGE / "LivelyInfo.json").read_text(encoding="utf-8"))
    assert info["Type"] == 1 and info["FileName"] == "index.html"
    assert info["Arguments"] == "--pause-event true"
    assert not info["IsAbsolutePath"]
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(STAGE.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(STAGE).as_posix())
    with ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None
        assert "LivelyInfo.json" in archive.namelist()
        assert not any(name.endswith((".qml", ".sh", ".exe")) for name in archive.namelist())
    digest = hashlib.sha256(OUTPUT.read_bytes()).hexdigest()
    OUTPUT.with_suffix(OUTPUT.suffix + ".sha256").write_text(f"{digest}  {OUTPUT.name}\n", encoding="utf-8")
    print(f"Created {OUTPUT.name} ({OUTPUT.stat().st_size:,} bytes), SHA-256 {digest}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pack", action="store_true", help="Pack the existing, tested staging directory")
    args = parser.parse_args()
    pack() if args.pack else stage()

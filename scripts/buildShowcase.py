#!/usr/bin/env python3
"""Build README gallery assets from committed images (optional: Pillow >= 10)."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS = ROOT / "docs" / "screenshots"
BACKGROUND = "#050711"


def build_tour():
    """A screenshot slideshow, not an interaction recording."""
    slides = [
        "02-desktop-home.png",
        "03-desktop-library-grid.png",
        "04-desktop-item-detail.png",
        "05-desktop-player-osd.png",
    ]
    frames = []
    for filename in slides:
        frame = Image.new("RGB", (960, 540), BACKGROUND)
        with Image.open(SCREENSHOTS / filename) as image:
            scaled = ImageOps.contain(image.convert("RGB"), frame.size)
            frame.paste(scaled, ((960 - scaled.width) // 2, (540 - scaled.height) // 2))
        frames.append(frame.quantize(colors=256))

    frames[0].save(
        SCREENSHOTS / "theme-tour.gif",
        save_all=True,
        append_images=frames[1:],
        duration=4500,
        loop=0,
        disposal=2,
        optimize=False,
    )


def build_covers():
    covers = [
        "movies", "tv", "live-tv", "collections", "music", "playlists",
    ]
    sheet = Image.new("RGB", (1200, 456), BACKGROUND)
    for index, filename in enumerate(covers):
        x = 12 + (index % 3) * 396
        y = 12 + (index // 3) * 228
        with Image.open(ROOT / "assets" / "covers" / f"{filename}.png") as image:
            sheet.paste(ImageOps.fit(image.convert("RGB"), (384, 216)), (x, y))
    sheet.save(SCREENSHOTS / "library-covers.png", optimize=True)


if __name__ == "__main__":
    build_tour()
    build_covers()
    print("Built docs/screenshots/theme-tour.gif and library-covers.png")

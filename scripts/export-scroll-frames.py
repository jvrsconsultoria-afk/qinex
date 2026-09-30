"""Export lightweight, individually seekable frames for the mobile scroll animation."""

from pathlib import Path
from PIL import Image

project = Path(__file__).resolve().parents[1]
destination = project / "public/media/usdt-box-frames"
destination.mkdir(parents=True, exist_ok=True)

frame_count = 90
with Image.open(project / "public/media/usdt-box.gif") as source:
    for index in range(frame_count):
        source.seek(round(index * (source.n_frames - 1) / (frame_count - 1)))
        frame = source.convert("RGB")
        frame = frame.resize((320, 458), Image.Resampling.LANCZOS)
        frame.save(destination / f"{index:03d}.webp", quality=80, method=6)

size = sum(path.stat().st_size for path in destination.glob("*.webp"))
print(f"Exported {frame_count} frames, {size / 1024:.0f} KiB total")

"""Package the user-supplied icon into installable app sizes."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'star-icon.png').convert('RGBA')
for size in (192, 512):
    source.resize((size, size), Image.Resampling.LANCZOS).save(root / f'star-icon-{size}.png')

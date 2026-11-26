"""Draw the app's original book/check icon; no network assets required."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
for size in (192, 512):
    image = Image.new('RGB', (512, 512), '#1e293b')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((138,126,360,386), radius=28, fill='#e7efff')
    draw.line((174,126,174,386), fill='#1e293b', width=16)
    draw.line((217,210,317,210), fill='#1e293b', width=16)
    draw.line((217,258,292,258), fill='#1e293b', width=16)
    draw.line([(228,319),(255,346),(320,278)], fill='#4f7fe5', width=19, joint='curve')
    image.resize((size,size), Image.Resampling.LANCZOS).save(root / f'icon-{size}.png')

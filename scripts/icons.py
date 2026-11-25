"""Draw the app's original book/check icon; no network assets required."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
for size in (192, 512):
    image = Image.new('RGB', (512, 512), '#163f38')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((138,126,360,386), radius=28, fill='#e4edce')
    draw.line((174,126,174,386), fill='#163f38', width=16)
    draw.line((217,210,317,210), fill='#163f38', width=16)
    draw.line((217,258,292,258), fill='#163f38', width=16)
    draw.line([(228,319),(255,346),(320,278)], fill='#28785e', width=19, joint='curve')
    image.resize((size,size), Image.Resampling.LANCZOS).save(root / f'icon-{size}.png')

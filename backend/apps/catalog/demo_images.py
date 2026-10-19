"""AquaLedger product art: fish, plants, medicines, liquids."""

import random
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont


def _load_font(size: int, bold=False):
    names = (
        ["C:/Windows/Fonts/segoeb.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    names += [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
    for path in names:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _aquarium_canvas(width=960, height=720, water=(186, 230, 253)):
    img = Image.new("RGB", (width, height), (240, 249, 255))
    draw = ImageDraw.Draw(img)
    for y in range(int(height * 0.35), height):
        t = (y - height * 0.35) / (height * 0.65)
        r = int(water[0] + (water[0] - 40) * t)
        g = int(water[1] + (water[1] - 50) * t)
        b = int(water[2] + (water[2] - 30) * t)
        draw.line([(0, y), (width, y)], fill=(max(0, r), max(0, g), max(0, b)))
    # light rays
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    o = ImageDraw.Draw(overlay)
    o.polygon([(0, 0), (width, 0), (width, int(height * 0.4)), (0, int(height * 0.55))], fill=(255, 255, 255, 45))
    composed = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return composed, ImageDraw.Draw(composed)


def _studio_canvas(width=960, height=720):
    img = Image.new("RGB", (width, height), (248, 250, 252))
    draw = ImageDraw.Draw(img)
    for y in range(int(height * 0.6), height):
        t = (y - height * 0.6) / (height * 0.4)
        c = int(228 - 20 * t)
        draw.line([(0, y), (width, y)], fill=(c, c + 3, c + 8))
    return img, draw


def _shadow(draw, box):
    x0, y0, x1, y1 = box
    draw.ellipse((x0, y1 - 15, x1, y1 + 20), fill=(160, 175, 190))


def _fish_body(draw, cx, cy, length, color, fin_color):
    _shadow(draw, (cx - length, cy - 30, cx + length, cy + 50))
    draw.ellipse((cx - length, cy - 25, cx + length // 2, cy + 25), fill=color)
    draw.polygon(
        [(cx + length // 2, cy), (cx + length + 20, cy - 35), (cx + length + 10, cy + 35)],
        fill=fin_color,
    )
    draw.ellipse((cx - length + 15, cy - 8, cx - length + 35, cy + 8), fill=(20, 20, 20))


def _draw_fish_betta(d, cx, cy):
    img, d = _aquarium_canvas()
    _fish_body(d, cx, cy, 90, (37, 99, 235), (59, 130, 246))
    d.polygon([(cx - 40, cy - 30), (cx - 80, cy - 70), (cx - 20, cy - 10)], fill=(96, 165, 250))
    d.polygon([(cx - 40, cy + 30), (cx - 90, cy + 80), (cx - 15, cy + 15)], fill=(96, 165, 250))
    return img


def _draw_fish_guppy(d, cx, cy):
    img, d = _aquarium_canvas()
    _fish_body(d, cx - 30, cy, 55, (234, 88, 12), (251, 146, 60))
    _fish_body(d, cx + 40, cy + 10, 45, (124, 58, 237), (167, 139, 250))
    return img


def _draw_fish_neon(d, cx, cy):
    img, d = _aquarium_canvas()
    for i, ox in enumerate((-80, -40, 0, 40, 80)):
        _fish_body(d, cx + ox, cy + (i % 2) * 12, 35, (15, 23, 42), (15, 23, 42))
        d.line([(cx + ox - 20, cy), (cx + ox + 10, cy)], fill=(56, 189, 248), width=4)
    return img


def _draw_fish_goldfish(d, cx, cy):
    img, d = _aquarium_canvas(water=(200, 230, 255))
    _fish_body(d, cx, cy, 100, (245, 158, 11), (251, 191, 36))
    d.ellipse((cx - 60, cy - 35, cx - 20, cy + 5), fill=(252, 211, 77))
    return img


def _draw_fish_pleco(d, cx, cy):
    img, d = _aquarium_canvas(water=(170, 210, 230))
    draw = d
    _shadow(draw, (cx - 110, cy, cx + 110, cy + 60))
    draw.ellipse((cx - 100, cy - 35, cx + 80, cy + 35), fill=(55, 65, 81))
    for i in range(8):
        draw.line([(cx - 70 + i * 18, cy - 20), (cx - 60 + i * 18, cy + 25)], fill=(30, 41, 59), width=2)
    return img


def _draw_fish_angelfish(d, cx, cy):
    img, d = _aquarium_canvas()
    draw = d
    _shadow(draw, (cx - 70, cy - 80, cx + 70, cy + 90))
    draw.polygon([(cx, cy - 70), (cx - 55, cy + 50), (cx + 55, cy + 50)], fill=(203, 213, 225))
    draw.polygon([(cx, cy - 70), (cx - 25, cy - 20), (cx + 25, cy - 20)], fill=(148, 163, 184))
    return img


def _draw_plant_anubias(d, cx, cy):
    img, d = _studio_canvas()
    draw = d
    _shadow(draw, (cx - 80, cy, cx + 80, cy + 120))
    draw.rounded_rectangle((cx - 70, cy + 40, cx + 70, cy + 100), radius=8, fill=(101, 67, 33))
    for ox, oy in ((-40, 10), (0, 0), (35, 15), (-15, 25)):
        draw.ellipse((cx + ox - 35, cy + oy - 25, cx + ox + 35, cy + oy + 20), fill=(22, 101, 52))
    return img


def _draw_plant_java_fern(d, cx, cy):
    img, d = _studio_canvas()
    draw = d
    _shadow(draw, (cx - 90, cy + 20, cx + 90, cy + 110))
    draw.polygon([(cx - 80, cy + 90), (cx + 80, cy + 90), (cx + 60, cy + 30), (cx - 60, cy + 30)], fill=(21, 128, 61))
    for i in range(5):
        draw.polygon([(cx - 50 + i * 22, cy + 30), (cx - 40 + i * 22, cy - 40), (cx - 25 + i * 22, cy + 25)], fill=(34, 197, 94))
    return img


def _draw_plant_crypt(d, cx, cy):
    img, d = _studio_canvas()
    draw = d
    _shadow(draw, (cx - 50, cy + 30, cx + 50, cy + 100))
    draw.ellipse((cx - 45, cy + 50, cx + 45, cy + 95), fill=(120, 53, 15))
    for i in range(7):
        draw.polygon([(cx - 30 + i * 8, cy + 45), (cx - 22 + i * 8, cy - 35), (cx - 14 + i * 8, cy + 40)], fill=(180, 50 + i * 8, 50))
    return img


def _draw_plant_stem(d, cx, cy):
    img, d = _studio_canvas()
    draw = d
    _shadow(draw, (cx - 40, cy + 10, cx + 40, cy + 110))
    for i in range(6):
        draw.line([(cx - 15 + i * 5, cy + 90), (cx - 20 + i * 6, cy - 50)], fill=(34, 197, 94), width=4)
        draw.ellipse((cx - 28 + i * 6, cy - 65, cx - 12 + i * 6, cy - 45), fill=(74, 222, 128))
    return img


def _med_bottle(draw, cx, cy, body, label, sublabel=""):
    _shadow(draw, (cx - 50, cy - 10, cx + 50, cy + 130))
    draw.rectangle((cx - 32, cy - 55, cx + 32, cy + 105), fill=(248, 250, 252), outline=(180, 190, 200))
    draw.rectangle((cx - 28, cy + 5, cx + 28, cy + 95), fill=body)
    draw.rectangle((cx - 12, cy - 75, cx + 12, cy - 55), fill=(100, 110, 120))
    draw.rectangle((cx - 26, cy + 25, cx + 26, cy + 55), fill=(255, 255, 255))
    draw.text((cx - 22, cy + 30), label, fill=(127, 29, 29), font=_load_font(16, bold=True))
    if sublabel:
        draw.text((cx - 20, cy + 52), sublabel, fill=(71, 85, 105), font=_load_font(12))


def _draw_med_ich(d, cx, cy):
    img, d = _studio_canvas()
    _med_bottle(d, cx, cy, (254, 202, 202), "ICH+")
    return img


def _draw_med_antibacterial(d, cx, cy):
    img, d = _studio_canvas()
    _med_bottle(d, cx, cy, (191, 219, 254), "CURE")
    return img


def _draw_med_tablets(d, cx, cy):
    img, d = _studio_canvas()
    draw = d
    _shadow(draw, (cx - 70, cy, cx + 70, cy + 100))
    draw.rounded_rectangle((cx - 65, cy - 30, cx + 65, cy + 70), radius=10, fill=(220, 38, 38))
    draw.text((cx - 38, cy - 10), "MED", fill=(255, 255, 255), font=_load_font(22, bold=True))
    for i in range(3):
        for j in range(4):
            draw.ellipse((cx - 45 + j * 22, cy + 15 + i * 14, cx - 32 + j * 22, cy + 28 + i * 14), fill=(254, 226, 226))
    return img


def _draw_liquid_bottle(d, cx, cy, liquid, label, cap=(14, 116, 144)):
    _shadow(d, (cx - 48, cy - 5, cx + 48, cy + 135))
    d.rectangle((cx - 35, cy - 60, cx + 35, cy + 115), fill=(255, 255, 255), outline=(200, 210, 220))
    d.rectangle((cx - 30, cy + 10, cx + 30, cy + 105), fill=liquid)
    d.rectangle((cx - 14, cy - 85, cx + 14, cy - 60), fill=cap)
    d.rectangle((cx - 28, cy + 30, cx + 28, cy + 62), fill=(255, 255, 255))
    d.text((cx - 24, cy + 36), label, fill=(15, 23, 42), font=_load_font(15, bold=True))


def _draw_liquid_conditioner(d, cx, cy):
    img, d = _studio_canvas()
    _draw_liquid_bottle(d, cx, cy, (45, 212, 191), "SAFE")
    return img


def _draw_liquid_fertilizer(d, cx, cy):
    img, d = _studio_canvas()
    _draw_liquid_bottle(d, cx, cy, (74, 222, 128), "PLANT")
    return img


def _draw_liquid_bacteria(d, cx, cy):
    img, d = _studio_canvas()
    _draw_liquid_bottle(d, cx, cy, (147, 197, 253), "BIO")
    return img


def _draw_liquid_algae(d, cx, cy):
    img, d = _studio_canvas()
    _draw_liquid_bottle(d, cx, cy, (134, 239, 172), "ALGAE")
    return img


def _draw_liquid_vitamins(d, cx, cy):
    img, d = _studio_canvas()
    _draw_liquid_bottle(d, cx, cy, (253, 224, 71), "VITA")
    return img


RENDERERS = {
    "fish_betta": _draw_fish_betta,
    "fish_guppy": _draw_fish_guppy,
    "fish_neon": _draw_fish_neon,
    "fish_goldfish": _draw_fish_goldfish,
    "fish_pleco": _draw_fish_pleco,
    "fish_angelfish": _draw_fish_angelfish,
    "plant_anubias": _draw_plant_anubias,
    "plant_java_fern": _draw_plant_java_fern,
    "plant_crypt": _draw_plant_crypt,
    "plant_stem": _draw_plant_stem,
    "med_ich": _draw_med_ich,
    "med_antibacterial": _draw_med_antibacterial,
    "med_tablets": _draw_med_tablets,
    "liquid_conditioner": _draw_liquid_conditioner,
    "liquid_fertilizer": _draw_liquid_fertilizer,
    "liquid_bacteria": _draw_liquid_bacteria,
    "liquid_algae": _draw_liquid_algae,
    "liquid_vitamins": _draw_liquid_vitamins,
}


def render_product_image(
    product_name: str,
    category_slug: str,
    sku: str,
    image_key: str,
) -> BytesIO:
    renderer = RENDERERS.get(image_key)
    if renderer:
        image = renderer(None, 480, 360)
    else:
        image, draw = _studio_canvas()
        _draw_liquid_bottle(draw, 480, 360, (56, 189, 248), "AQUA")

    draw = ImageDraw.Draw(image)
    font = _load_font(17)
    draw.rounded_rectangle((32, image.height - 52, 32 + len(sku) * 10 + 24, image.height - 18), radius=8, fill=(255, 255, 255))
    draw.text((44, image.height - 44), sku, fill=(30, 58, 95), font=font)

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    return buffer

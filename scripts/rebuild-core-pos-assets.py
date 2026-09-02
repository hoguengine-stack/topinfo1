from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / "public" / "assets" / "product"
RESEARCH = ROOT / ".asset-research"
RIGHTS_PENDING = RESEARCH / "rights-pending"
PUBLIC_BLOCKED_PRODUCT = RIGHTS_PENDING / "public-blocked" / "product"
PUBLIC_BLOCKED_PRODUCT.mkdir(parents=True, exist_ok=True)

APEXA_SOURCE = RESEARCH / "posbank-in" / "official-05.png"
POS_SCREEN = PUBLIC_BLOCKED_PRODUCT / "toss-pos-screen-verified.png"
TOSS_FRONT = PRODUCT / "toss-front.webp"
ROUTER_SOURCE = ROOT / "public" / "assets" / "uplus" / "uplus-internet-router.png"
PRINTER_SOURCE = RESEARCH / "ahapos" / "source-03.jpg"
CASH_DRAWER_SOURCE = RESEARCH / "core-pos" / "white-cash-drawer-source.png"
CAFE_BACKGROUND = RESEARCH / "core-pos" / "cafe-table-background.png"
RESTAURANT_BACKGROUND = RESEARCH / "core-pos" / "restaurant-table-background.png"
ORDER_POS_SOURCE = RESEARCH / "core-pos" / "feature-order-pos-source.webp"

FONT_REGULAR = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")

CANVAS_SIZE = (1536, 1024)


def antialiased_polygon(size: tuple[int, int], points: list[tuple[float, float]], scale: int = 4) -> Image.Image:
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon([(round(x * scale), round(y * scale)) for x, y in points], fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def trim_alpha(image: Image.Image, padding: int = 0) -> Image.Image:
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if bbox is None:
        return rgba
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(rgba.width, bbox[2] + padding)
    bottom = min(rgba.height, bbox[3] + padding)
    return rgba.crop((left, top, right, bottom))


def fit_height(image: Image.Image, height: int) -> Image.Image:
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def fit_width(image: Image.Image, width: int) -> Image.Image:
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def add_drop_shadow(
    canvas: Image.Image,
    image: Image.Image,
    position: tuple[int, int],
    blur: int = 20,
    offset: tuple[int, int] = (0, 16),
    opacity: int = 54,
) -> None:
    alpha = image.getchannel("A")
    padding = blur * 3
    shadow_alpha = Image.new("L", (image.width + padding * 2, image.height + padding * 2), 0)
    shadow_alpha.paste(alpha, (padding, padding))
    shadow_alpha = shadow_alpha.point(lambda value: round(value * opacity / 255))
    shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(blur))
    shadow = Image.new("RGBA", shadow_alpha.size, (19, 33, 54, 0))
    shadow.putalpha(shadow_alpha)
    canvas.alpha_composite(
        shadow,
        (position[0] + offset[0] - padding, position[1] + offset[1] - padding),
    )
    canvas.alpha_composite(image, position)


def studio_background() -> Image.Image:
    width, height = CANVAS_SIZE
    canvas = Image.new("RGBA", CANVAS_SIZE, "#f4f7fb")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, width, 714), fill="#eef4fb")
    draw.rectangle((0, 714, width, height), fill="#e2e8f0")
    draw.line((0, 714, width, 714), fill="#cbd6e4", width=2)
    return canvas


def build_apexa_with_toss_screen() -> Image.Image:
    base = Image.open(APEXA_SOURCE).convert("RGBA")
    original_alpha = base.getchannel("A").copy()
    screen = Image.open(POS_SCREEN).convert("RGBA")

    screen_box = (337, 138, 894, 547)
    screen = screen.resize((screen_box[2] - screen_box[0], screen_box[3] - screen_box[1]), Image.Resampling.LANCZOS)
    base.alpha_composite(screen, (screen_box[0], screen_box[1]))

    # Official catalogue artwork contains blue polygons around the product.
    # Draw only the measured monitor and stand silhouettes; a broad clip polygon
    # would retain translucent catalogue artwork behind the stand.
    scale = 4
    silhouette = Image.new("L", (base.width * scale, base.height * scale), 0)
    draw = ImageDraw.Draw(silhouette)
    monitor = [
        (303, 86),
        (935, 86),
        (945, 96),
        (949, 116),
        (952, 588),
        (947, 607),
        (938, 616),
        (302, 616),
        (294, 608),
        (290, 598),
        (294, 116),
        (298, 98),
    ]
    draw.polygon([(x * scale, y * scale) for x, y in monitor], fill=255)
    stand = [
        (438, 607),
        (770, 607),
        (799, 668),
        (790, 725),
        (431, 725),
        (421, 668),
    ]
    draw.polygon([(x * scale, y * scale) for x, y in stand], fill=255)
    silhouette = silhouette.resize(base.size, Image.Resampling.LANCZOS)
    clean_alpha_values = np.minimum(
        np.asarray(original_alpha, dtype=np.uint8),
        np.asarray(silhouette, dtype=np.uint8),
    )
    rgb = np.asarray(base.convert("RGB"), dtype=np.float32)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    saturation = np.divide(maximum - minimum, np.maximum(maximum, 1), dtype=np.float32)
    yy, xx = np.indices((base.height, base.width))
    colored_catalogue_edge = (
        (yy < 622)
        & ((xx < 300) | (xx > 940))
        & (saturation > 0.075)
        & (maximum > 45)
    )
    clean_alpha_values[colored_catalogue_edge] = 0
    clean_alpha = Image.fromarray(clean_alpha_values, mode="L")
    base.putalpha(clean_alpha)
    return base


def build_printer_cutout() -> Image.Image:
    source = Image.open(PRINTER_SOURCE).convert("RGB")
    crop = source.crop((66, 522, 500, 1025))

    pixels = np.asarray(crop)
    value = pixels.max(axis=2)
    binary = Image.fromarray(np.where(value > 55, 255, 0).astype(np.uint8), mode="L")
    binary = binary.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    flood = binary.copy()
    boundary = (
        [(x, 0) for x in range(flood.width)]
        + [(x, flood.height - 1) for x in range(flood.width)]
        + [(0, y) for y in range(flood.height)]
        + [(flood.width - 1, y) for y in range(flood.height)]
    )
    for point in boundary:
        if flood.getpixel(point) == 0:
            ImageDraw.floodfill(flood, point, 128, thresh=0)
    flood_values = np.asarray(flood)
    alpha = Image.fromarray(np.where(flood_values == 128, 0, 255).astype(np.uint8), mode="L")
    outline = [(34, 137), (226, 57), (391, 153), (347, 379), (180, 488), (25, 317)]
    alpha = Image.fromarray(
        np.minimum(
            np.asarray(alpha, dtype=np.uint8),
            np.asarray(antialiased_polygon(crop.size, outline), dtype=np.uint8),
        ),
        mode="L",
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))

    rgba = crop.convert("RGBA")
    rgba.putalpha(alpha)
    return trim_alpha(rgba, 14)


def build_cash_drawer_cutout() -> Image.Image:
    source = Image.open(CASH_DRAWER_SOURCE).convert("RGBA")
    body = [
        (145, 391),
        (548, 296),
        (1417, 325),
        (1417, 565),
        (1203, 751),
        (148, 652),
    ]
    mask = antialiased_polygon(source.size, body)
    source_values = np.asarray(source.convert("RGB")).max(axis=2)
    feet_region = Image.new("L", source.size, 0)
    feet_draw = ImageDraw.Draw(feet_region)
    feet_draw.rounded_rectangle((180, 635, 244, 690), radius=20, fill=255)
    feet_draw.rounded_rectangle((1125, 724, 1207, 782), radius=22, fill=255)
    feet_draw.rounded_rectangle((1375, 545, 1417, 603), radius=15, fill=255)
    feet = (np.asarray(feet_region) > 0) & (source_values < 190)
    mask = Image.fromarray(
        np.maximum(np.asarray(mask, dtype=np.uint8), np.where(feet, 255, 0).astype(np.uint8)),
        mode="L",
    )
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    source.putalpha(mask)
    return trim_alpha(source, 12)


def save_transparent_products(apexa_canvas: Image.Image, printer: Image.Image, drawer: Image.Image) -> None:
    # The reconstructed screen is retained for audit only and must never return to public assets.
    apexa_canvas.save(PUBLIC_BLOCKED_PRODUCT / "posbank-apexa-x-white-toss.png", optimize=True)
    printer.save(PRODUCT / "ahapos-white-printer.png", optimize=True)
    drawer.save(PRODUCT / "white-cash-drawer.png", optimize=True)


def save_apexa_product(apexa: Image.Image) -> None:
    canvas = studio_background()
    product = fit_height(apexa, 760)
    x = (CANVAS_SIZE[0] - product.width) // 2
    y = 105
    add_drop_shadow(canvas, product, (x, y), blur=24, offset=(0, 20), opacity=62)
    canvas.convert("RGB").save(RIGHTS_PENDING / "posbank-apexa-x-toss-pos.webp", "WEBP", quality=94, method=6)


def save_counter_set(apexa: Image.Image, printer: Image.Image, drawer: Image.Image) -> None:
    canvas = studio_background()

    # Same-plane physical-height ratios:
    # APEXA X 333 mm, Toss Front 193.5 mm (58.1%), CPP-3000 140 mm (42.0%).
    apexa_height = 540
    front_height = round(apexa_height * 193.5 / 333)
    printer_height = round(apexa_height * 140 / 333)

    drawer_render = fit_width(drawer, 800)
    apexa_render = fit_height(apexa, apexa_height)
    printer_render = fit_height(printer, printer_height)
    front_render = fit_height(trim_alpha(Image.open(TOSS_FRONT).convert("RGBA"), 8), front_height)

    drawer_position = (205, 632)
    apexa_position = (310, 162)
    printer_position = (978, 575)
    front_position = (1196, 487)

    add_drop_shadow(canvas, drawer_render, drawer_position, blur=22, offset=(0, 17), opacity=46)
    add_drop_shadow(canvas, apexa_render, apexa_position, blur=22, offset=(0, 18), opacity=58)
    add_drop_shadow(canvas, printer_render, printer_position, blur=16, offset=(0, 13), opacity=48)
    add_drop_shadow(canvas, front_render, front_position, blur=17, offset=(0, 14), opacity=50)

    canvas.convert("RGB").save(RIGHTS_PENDING / "system-pos-apexa-x-toss.webp", "WEBP", quality=94, method=6)


def save_internet_counter_set(apexa: Image.Image, printer: Image.Image, drawer: Image.Image) -> None:
    canvas = studio_background()
    draw = ImageDraw.Draw(canvas)

    # The router's published hero does not identify a physical model or dimensions,
    # so it is shown as a network endpoint rather than a same-plane scale reference.
    router = fit_height(trim_alpha(Image.open(ROUTER_SOURCE).convert("RGBA"), 8), 260)
    drawer_render = fit_width(drawer, 760)
    apexa_render = fit_height(apexa, 500)
    printer_render = fit_height(printer, round(500 * 140 / 333))
    front_render = fit_height(
        trim_alpha(Image.open(TOSS_FRONT).convert("RGBA"), 8),
        round(500 * 193.5 / 333),
    )

    line_color = (38, 113, 246, 108)
    node_color = (38, 113, 246, 210)
    draw.line((264, 667, 445, 667, 586, 610), fill=line_color, width=7)
    draw.line((264, 667, 1092, 667), fill=line_color, width=7)
    draw.line((1092, 667, 1298, 623), fill=line_color, width=7)
    for x, y in [(264, 667), (586, 610), (1092, 667), (1298, 623)]:
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=node_color)
    for inset, opacity in [(0, 170), (24, 115), (48, 70)]:
        draw.arc(
            (116 - inset, 398 - inset, 322 + inset, 604 + inset),
            220,
            320,
            fill=(38, 113, 246, opacity),
            width=7,
        )

    add_drop_shadow(canvas, router, (96, 548), blur=18, offset=(0, 14), opacity=54)
    add_drop_shadow(canvas, drawer_render, (326, 648), blur=22, offset=(0, 17), opacity=46)
    add_drop_shadow(canvas, apexa_render, (432, 192), blur=22, offset=(0, 18), opacity=58)
    add_drop_shadow(canvas, printer_render, (1016, 573), blur=16, offset=(0, 13), opacity=48)
    add_drop_shadow(canvas, front_render, (1220, 500), blur=17, offset=(0, 14), opacity=50)

    canvas.convert("RGB").save(RIGHTS_PENDING / "system-internet-apexa-x.webp", "WEBP", quality=94, method=6)


def save_customer_payment_scene() -> None:
    source = Image.open(RIGHTS_PENDING / "toss-front-customer-payment.png").convert("RGB")
    image = ImageOps.fit(source, CANVAS_SIZE, method=Image.Resampling.LANCZOS, centering=(0.53, 0.5))
    image.save(RIGHTS_PENDING / "system-pos-order-payment.webp", "WEBP", quality=93, method=6)


def draw_centered(draw: ImageDraw.ImageDraw, box_width: int, y: int, text: str, font: ImageFont.FreeTypeFont, fill: str) -> None:
    text_box = draw.textbbox((0, 0), text, font=font)
    width = text_box[2] - text_box[0]
    draw.text(((box_width - width) // 2, y), text, font=font, fill=fill)


def build_receipt(kind: str) -> Image.Image:
    width, height = 430, 760
    paper = Image.new("RGBA", (width, height), (252, 250, 244, 255))
    draw = ImageDraw.Draw(paper)
    regular = ImageFont.truetype(str(FONT_REGULAR), 22)
    small = ImageFont.truetype(str(FONT_REGULAR), 18)
    bold = ImageFont.truetype(str(FONT_BOLD), 30)
    total_font = ImageFont.truetype(str(FONT_BOLD), 28)

    draw.rectangle((0, 0, width - 1, height - 1), outline="#e4e0d8", width=2)
    if kind == "cafe":
        draw.line((171, 55, 177, 103), fill="#242424", width=5)
        draw.arc((176, 72, 250, 118), 0, 180, fill="#242424", width=5)
        draw.line((249, 55, 249, 94), fill="#242424", width=5)
        draw.line((171, 55, 249, 55), fill="#242424", width=5)
        draw.arc((238, 65, 280, 105), 270, 90, fill="#242424", width=5)
        title = "TOPINFO CAFE"
        subtitle = "카페 맞춤 영수증 예시"
        items = [("아메리카노  x 2", "8,000"), ("카페라떼  x 1", "4,500")]
        total = "12,500원"
        footer = "매장 로고와 안내 문구를\n영수증에 담을 수 있어요"
    else:
        draw.ellipse((177, 39, 253, 115), outline="#242424", width=5)
        draw.ellipse((188, 50, 242, 104), outline="#242424", width=2)
        draw.line((153, 43, 153, 111), fill="#242424", width=4)
        draw.line((144, 43, 144, 75), fill="#242424", width=3)
        draw.line((162, 43, 162, 75), fill="#242424", width=3)
        title = "TOPINFO TABLE"
        subtitle = "음식점 맞춤 영수증 예시"
        items = [("식사 메뉴  x 2", "28,000"), ("음료  x 2", "4,000")]
        total = "32,000원"
        footer = "리뷰 안내와 매장 메시지를\n영수증에 함께 전할 수 있어요"

    draw_centered(draw, width, 128, title, bold, "#171717")
    draw_centered(draw, width, 174, subtitle, small, "#555555")
    draw.line((40, 224, width - 40, 224), fill="#7e7a72", width=2)
    draw.text((42, 248), "품목", font=small, fill="#555555")
    draw.text((width - 92, 248), "금액", font=small, fill="#555555")
    y = 302
    for label, price in items:
        draw.text((42, y), label, font=regular, fill="#252525")
        price_width = draw.textbbox((0, 0), price, font=regular)[2]
        draw.text((width - 42 - price_width, y), price, font=regular, fill="#252525")
        y += 58
    draw.line((40, 430, width - 40, 430), fill="#7e7a72", width=2)
    draw.text((42, 454), "합계", font=total_font, fill="#171717")
    total_width = draw.textbbox((0, 0), total, font=total_font)[2]
    draw.text((width - 42 - total_width, 454), total, font=total_font, fill="#171717")
    draw.line((40, 520, width - 40, 520), fill="#7e7a72", width=2)
    draw_centered(draw, width, 554, "이용해 주셔서 감사합니다", regular, "#252525")
    for index, line in enumerate(footer.splitlines()):
        draw_centered(draw, width, 612 + index * 34, line, small, "#555555")

    # Deterministic thermal-paper texture without changing the legibility of text.
    rng = np.random.default_rng(20260715 if kind == "cafe" else 20260716)
    noise = rng.normal(0, 1.1, (height, width, 1))
    rgb = np.asarray(paper.convert("RGB"), dtype=np.float32)
    rgb = np.clip(rgb + noise, 0, 255).astype(np.uint8)
    textured = Image.fromarray(rgb, mode="RGB").convert("RGBA")
    textured.putalpha(paper.getchannel("A"))
    return textured


def composite_receipt_feature(background_path: Path, kind: str, angle: float, position: tuple[int, int]) -> Image.Image:
    background = ImageOps.fit(Image.open(background_path).convert("RGB"), CANVAS_SIZE, method=Image.Resampling.LANCZOS).convert("RGBA")
    receipt = build_receipt(kind).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    add_drop_shadow(background, receipt, position, blur=20, offset=(14, 18), opacity=72)
    return background.convert("RGB")


def save_sector_features() -> None:
    cafe = composite_receipt_feature(CAFE_BACKGROUND, "cafe", -6.0, (250, 132))
    cafe.save(RIGHTS_PENDING / "feature-cafe-receipt.png", optimize=True)

    restaurant = composite_receipt_feature(RESTAURANT_BACKGROUND, "restaurant", 5.5, (300, 132))
    restaurant.save(RIGHTS_PENDING / "feature-restaurant-receipt.png", optimize=True)

    source = Image.open(ORDER_POS_SOURCE).convert("RGB")
    backdrop = ImageOps.fit(source, CANVAS_SIZE, method=Image.Resampling.LANCZOS)
    backdrop = backdrop.filter(ImageFilter.GaussianBlur(32))
    backdrop = Image.blend(backdrop, Image.new("RGB", CANVAS_SIZE, "#17283a"), 0.38).convert("RGBA")
    foreground = fit_height(source.convert("RGBA"), 920)
    add_drop_shadow(backdrop, foreground, ((CANVAS_SIZE[0] - foreground.width) // 2, 52), blur=24, offset=(0, 14), opacity=70)
    backdrop.convert("RGB").save(ROOT / "public" / "assets" / "sector" / "feature-order-pos.webp", "WEBP", quality=93, method=6)


def main() -> None:
    RIGHTS_PENDING.mkdir(parents=True, exist_ok=True)
    apexa_canvas = build_apexa_with_toss_screen()
    apexa = trim_alpha(apexa_canvas, 8)
    printer = build_printer_cutout()
    drawer = build_cash_drawer_cutout()

    save_transparent_products(apexa_canvas, printer, drawer)
    save_apexa_product(apexa)
    save_counter_set(apexa, printer, drawer)
    save_internet_counter_set(apexa, printer, drawer)
    save_customer_payment_scene()
    save_sector_features()

    print(f"APEXA cutout: {apexa.size}")
    print(f"CPP-3000 cutout: {printer.size}")
    print(f"Cash drawer cutout: {drawer.size}")
    print("Rebuilt 9 core POS assets.")


if __name__ == "__main__":
    main()

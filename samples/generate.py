"""
Generates the sample images in this folder.

These are SYNTHETIC test fixtures, drawn from scratch by this script. They are
not photographs of anyone's real payouts or documents, and the identity
documents carry a visible SAMPLE marking so they cannot be mistaken for
genuine ones. The script is committed so anyone can see exactly how they were
made and regenerate or adapt them.

    python samples/generate.py

Requires Pillow.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.dirname(os.path.abspath(__file__))

INK = (17, 17, 17)
MUTED = (95, 95, 95)
LINE = (222, 222, 222)
OK = (11, 107, 58)
RED = (165, 31, 31)


def font(size, bold=False):
    for name in (("arialbd.ttf" if bold else "arial.ttf"), "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rows(d, items, x, y, width, size=26, gap=70):
    for key, value, colour in items:
        d.text((x, y), key, font=font(size - 2), fill=MUTED)
        vw = d.textlength(value, font=font(size, True))
        d.text((x + width - vw, y), value, font=font(size, True), fill=colour)
        d.line([(x, y + size + 14), (x + width, y + size + 14)], fill=LINE)
        y += gap
    return y


def sample_marker(d, w, h):
    """Unmistakable, but out of the way of the fields being read."""
    d.rectangle([0, h - 46, w, h], fill=(255, 243, 205))
    d.text((18, h - 36), "SAMPLE IMAGE - GENERATED FOR APP TESTING, NOT A REAL DOCUMENT",
           font=font(19, True), fill=(140, 90, 0))


def payout(filename, brand, brand_rgb, period, data, net):
    w, h = 720, 1060
    img = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, w, 108], fill=brand_rgb)
    d.text((30, 36), f"{brand}  |  Weekly Payout", font=font(34, True), fill=(255, 255, 255))

    d.text((30, 150), f"Payout period: {period}", font=font(24), fill=INK)
    y = rows(d, data, 30, 215, w - 60)

    d.rectangle([20, y + 10, w - 20, y + 112], fill=(238, 248, 241))
    d.text((40, y + 42), "Net credited", font=font(30, True), fill=OK)
    nw = d.textlength(net, font=font(30, True))
    d.text((w - 40 - nw, y + 42), net, font=font(30, True), fill=OK)

    sample_marker(d, w, h)
    img.save(os.path.join(OUT, filename))
    print("wrote", filename)


# 1. A clean week. Establishes the baseline the Deduction Detective compares against.
payout(
    "1-payout-swiggy-clean.png",
    "Swiggy", (252, 128, 25),
    "02 Oct 2026 - 08 Oct 2026",
    [
        ("Order earnings", "Rs 1,760.00", INK),
        ("Incentive / surge", "Rs 180.00", INK),
        ("Trips completed", "21", INK),
        ("Login hours", "30.0", INK),
        ("Distance travelled", "178.2 km", INK),
        ("TDS", "- Rs 20.00", RED),
    ],
    "Rs 1,920.00",
)

# 2. The same platform, a week later, with a penalty that has never appeared
#    before. Upload this second to see the Detective flag it.
payout(
    "2-payout-swiggy-penalty.png",
    "Swiggy", (252, 128, 25),
    "09 Oct 2026 - 15 Oct 2026",
    [
        ("Order earnings", "Rs 1,840.00", INK),
        ("Incentive / surge", "Rs 200.00", INK),
        ("Trips completed", "22", INK),
        ("Login hours", "31.5", INK),
        ("Distance travelled", "186.4 km", INK),
        ("Quality penalty", "- Rs 400.00", RED),
        ("TDS", "- Rs 20.00", RED),
    ],
    "Rs 1,620.00",
)

# 3. A second platform, so the ledger spans more than one and the income
#    certificate has a real platform mix.
payout(
    "3-payout-blinkit.png",
    "Blinkit", (241, 196, 15),
    "09 Oct 2026 - 15 Oct 2026",
    [
        ("Delivery earnings", "Rs 1,240.00", INK),
        ("Peak hour bonus", "Rs 310.00", INK),
        ("Orders delivered", "48", INK),
        ("Hours online", "26.5", INK),
        ("Distance travelled", "122.0 km", INK),
        ("Late delivery charge", "- Rs 150.00", RED),
    ],
    "Rs 1,400.00",
)


def petrol_bill():
    w, h = 560, 780
    img = Image.new("RGB", (w, h), (252, 252, 250))
    d = ImageDraw.Draw(img)
    d.text((30, 34), "BHARAT PETROLEUM", font=font(30, True), fill=INK)
    d.text((30, 76), "Lajpat Nagar Fuel Station, New Delhi", font=font(20), fill=MUTED)
    d.line([(30, 120), (w - 30, 120)], fill=LINE)
    rows(d, [
        ("Date", "14-10-2026", INK),
        ("Product", "PETROL", INK),
        ("Rate / Litre", "Rs 94.80", INK),
        ("Volume", "4.22 L", INK),
        ("Vehicle No.", "DL 3S AB 1234", INK),
    ], 30, 150, w - 60, size=24, gap=62)
    d.rectangle([20, 470, w - 20, 556], fill=(238, 248, 241))
    d.text((40, 498), "Total", font=font(28, True), fill=OK)
    d.text((w - 190, 498), "Rs 400.00", font=font(28, True), fill=OK)
    d.text((30, 596), "Thank you for fuelling with us", font=font(19), fill=MUTED)
    sample_marker(d, w, h)
    img.save(os.path.join(OUT, "4-petrol-bill.png"))
    print("wrote 4-petrol-bill.png")


petrol_bill()


def licence():
    w, h = 820, 540
    img = Image.new("RGB", (w, h), (237, 243, 252))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 92], fill=(26, 74, 140))
    d.text((26, 28), "GOVERNMENT OF NCT OF DELHI", font=font(28, True), fill=(255, 255, 255))
    d.text((26, 112), "DRIVING LICENCE", font=font(32, True), fill=INK)
    d.text((26, 156), "SAMPLE - NOT VALID FOR ANY OFFICIAL USE", font=font(20, True), fill=RED)
    y = 200
    for key, value in [
        ("DL No.", "DL-0420110149646"),
        ("Name", "RAVI KUMAR"),
        ("S/W/D of", "SURESH KUMAR"),
        ("Date of Birth", "14-03-1995"),
        ("Issue Date", "12-01-2021"),
        ("Valid Till", "11-01-2027"),
        ("Vehicle Class", "MCWG, LMV"),
    ]:
        d.text((30, y), key, font=font(21), fill=MUTED)
        d.text((300, y), value, font=font(23, True), fill=INK)
        y += 42
    sample_marker(d, w, h)
    img.save(os.path.join(OUT, "5-driving-licence.png"))
    print("wrote 5-driving-licence.png")


licence()


def puc():
    w, h = 760, 600
    img = Image.new("RGB", (w, h), (250, 252, 248))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 88], fill=(16, 110, 72))
    d.text((26, 26), "POLLUTION UNDER CONTROL CERTIFICATE",
           font=font(26, True), fill=(255, 255, 255))
    d.text((26, 112), "SAMPLE - NOT VALID FOR ANY OFFICIAL USE", font=font(20, True), fill=RED)
    y = 160
    for key, value in [
        ("Certificate No.", "DL24PUC0098771"),
        ("Vehicle No.", "DL 3S AB 1234"),
        ("Owner Name", "RAVI KUMAR"),
        ("Fuel Type", "PETROL"),
        ("Test Date", "28-04-2026"),
        ("Valid Until", "27-10-2026"),
    ]:
        d.text((30, y), key, font=font(21), fill=MUTED)
        d.text((330, y), value, font=font(23, True), fill=INK)
        y += 46
    sample_marker(d, w, h)
    img.save(os.path.join(OUT, "6-puc-certificate.png"))
    print("wrote 6-puc-certificate.png")


puc()
print("\nAll samples written to", OUT)

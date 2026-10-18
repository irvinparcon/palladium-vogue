"""Circled PV Interlace marks, built from the existing mark SVGs.

Writes pv-interlace-circle-{gold,ivory,onyx}.svg, pv-interlace-horizontal-circle-gold.svg and
../favicon.svg. Run from the repo root:  python3 assets/logo/tools/circle_marks.py
"""
import os, re

LOGO = os.path.join(os.path.dirname(__file__), "..")
COLORS = {"gold": "#C6A86A", "ivory": "#F5F3EF", "onyx": "#0B0B0D"}
BOX = (0, -660, 1010, 680)  # the mark's own viewBox


def inner(color, uid):
    """The mark's drawing (no <svg>/<title>), with its mask id made unique."""
    s = open(os.path.join(LOGO, f"pv-interlace-mark-{color}.svg"), encoding="utf-8").read()
    body = re.sub(r"^.*?</title>", "", s, flags=re.S).rsplit("</svg>", 1)[0]
    old = re.search(r'mask id="([^"]+)"', body).group(1)
    return body.replace(f'id="{old}"', f'id="{uid}"').replace(f"url(#{old})", f"url(#{uid})")


def place(body, cx, cy, width):
    bx, by, bw, bh = BOX
    s = width / bw
    return f'<g transform="translate({cx - (bx + bw / 2) * s:.3f} {cy - (by + bh / 2) * s:.3f}) scale({s:.5f})">{body}</g>'


def ring(cx, cy, r, w, hex_):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{hex_}" stroke-width="{w}"/>'


def svg(w, h, body, extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="Palladium Vogue">'
            f'<title>Palladium Vogue</title>{extra}{body}</svg>\n')


def write(path, text):
    open(path, "w", encoding="utf-8").write(text)
    print(os.path.relpath(path, os.path.join(LOGO, "..", "..")))


# the mark inside a single fine ring
for name, hex_ in COLORS.items():
    write(os.path.join(LOGO, f"pv-interlace-circle-{name}.svg"),
          svg(200, 200, ring(100, 100, 96, 4, hex_) + place(inner(name, f"mc{name}"), 100, 101, 118)))

# horizontal lockup: circled mark | wordmark (wordmark and divider kept from the original)
h = open(os.path.join(LOGO, "pv-interlace-horizontal-gold.svg"), encoding="utf-8").read()
mark_g = re.search(r'<g transform="[^"]*">.*?</g>(?=<rect)', h, flags=re.S).group(0)
h = h.replace(mark_g, ring(60, 60, 55, 2.2, COLORS["gold"]) + place(inner("gold", "mch"), 60, 60.5, 68))
write(os.path.join(LOGO, "pv-interlace-horizontal-circle-gold.svg"), h)

# favicon: circled mark on onyx
write(os.path.join(LOGO, "..", "favicon.svg"),
      svg(64, 64, ring(32, 32, 29.5, 2, COLORS["gold"]) + place(inner("gold", "mfav"), 32, 32.4, 38),
          extra=f'<rect width="64" height="64" fill="{COLORS["onyx"]}"/>'))

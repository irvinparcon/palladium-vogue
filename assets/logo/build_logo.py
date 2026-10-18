import json, os, sys
G = json.load(open(sys.argv[1])); GL = json.load(open(sys.argv[2])); OUT = sys.argv[3]
os.makedirs(OUT, exist_ok=True)
GOLD, IVORY, ONYX = "#C6A86A", "#F5F3EF", "#0B0B0D"

# ---------- 1. Interlace: Cormorant P and V, V passes over P with a hairline gap ----------
P, V = G["P"]["d"], G["V"]["d"]
VX = 330  # V offset so its left arm sweeps through the P's bowl
def interlace(color, uid):
    # P sits in front and stays whole; the V passes behind it with a hairline gap
    return f'''<defs><mask id="m{uid}" maskUnits="userSpaceOnUse" x="-100" y="-800" width="1200" height="900">
<rect x="-100" y="-800" width="1200" height="900" fill="#fff"/>
<path d="{P}" fill="#000" stroke="#000" stroke-width="30" stroke-linejoin="round"/>
<path d="M140 -628 H330 C440 -628 506 -560 506 -445 C506 -330 440 -262 330 -262 H140 Z" fill="#000" stroke="#000" stroke-width="30"/></mask></defs>
<g mask="url(#m{uid})"><path d="{V}" transform="translate({VX} 0)" fill="{color}"/></g>
<path d="{P}" fill="{color}"/>'''
IL_BOX = (0, -660, 1010, 680)   # x, y, w, h in glyph units

# ---------- 2. Ligature: custom Didone mark, P and V share one stem ----------
STEM = "M14 10 H25 L43.5 90 H38.5 Z"                      # V thick left arm, doubles as the P stem
SERIF = "M7 10 H27 V11.6 H7 Z"
DIAG = "M39.5 90 L77 10 H80.5 L43.5 90 Z"                   # V hairline right arm
DSERIF = "M70 10 H88 V11.6 H70 Z"
BOWL = ("M24 10 H44 C58 10 65 18.5 65 29 C65 40 57 48 42 48 H33.8 L33.2 45.6 H42 "
        "C52.5 45.6 57.7 39 57.7 29 C57.7 19.5 53 12.4 44 12.4 H24.5 Z")
def ligature(color, uid):
    return f'''<defs><mask id="l{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
<rect width="100" height="100" fill="#fff"/><path d="{DIAG}" fill="#000" stroke="#000" stroke-width="3.2"/></mask></defs>
<g fill="{color}"><path d="{STEM}"/><path d="{SERIF}"/><path d="{DSERIF}"/>
<path d="{BOWL}" mask="url(#l{uid})"/><path d="{DIAG}"/></g>'''
LG_BOX = (2, 2, 90, 96)

def place(inner, box, cx, cy, h):
    """Place a mark (in its own unit box) centred at cx,cy with height h."""
    bx, by, bw, bh = box; s = h / bh
    return f'<g transform="translate({cx - bw*s/2 - bx*s:.3f} {cy - h/2 - by*s:.3f}) scale({s:.5f})">{inner}</g>'

def text(key, cx, baseline, width, color, src=None):
    t = (src or GL)[key]; s = width / t["width"]
    return f'<path d="{t["d"]}" fill="{color}" transform="translate({cx - width/2:.3f} {baseline}) scale({s:.5f})"/>'

def seal(inner_fn, box, color, uid):
    # 200x200 roundel: double ring, four diamond points, monogram
    dots = "".join(f'<path d="M100 {y-3} L103 {y} L100 {y+3} L97 {y} Z" transform="rotate({r} 100 100)"/>'
                   for r in (0, 90, 180, 270) for y in (9,))
    return (f'<g fill="none" stroke="{color}"><circle cx="100" cy="100" r="91" stroke-width="1.1"/>'
            f'<circle cx="100" cy="100" r="84.5" stroke-width=".5"/></g><g fill="{color}">{dots}</g>'
            + place(inner_fn(color, uid), box, 100, 100, 92))

def svg(w, h, body, bg=None, title="Palladium Vogue"):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{b}{body}</svg>\n'

files = {}
for name, fn, box in (("interlace", interlace, IL_BOX), ("ligature", ligature, LG_BOX)):
    # standalone monogram
    files[f"pv-{name}-monogram-gold.svg"] = svg(200, 200, place(fn(GOLD, name+"a"), box, 100, 100, 150))
    # seal
    files[f"pv-{name}-seal-gold.svg"] = svg(200, 200, seal(fn, box, GOLD, name+"s"))
    # vertical lockup
    def vlock(c, uid):
        return (place(fn(c, uid), box, 300, 190, 210)
                + f'<rect x="270" y="330" width="60" height=".8" fill="{c}"/>'
                + text("word", 300, 392, 440, c)
                + text("milano", 300, 432, 190, c, GL))
    files[f"pv-{name}-lockup-gold.svg"] = svg(600, 480, vlock(GOLD, name+"v"))
    files[f"pv-{name}-lockup-onyx.svg"] = svg(600, 480, vlock(ONYX, name+"o"))
    # horizontal lockup
    def hlock(c, uid):
        return (place(fn(c, uid), box, 60, 60, 84)
                + f'<rect x="124" y="28" width=".8" height="64" fill="{c}"/>'
                + text("word", 148 + 230, 70, 460, c).replace(f"translate({148+230-230:.3f}", f"translate({148:.3f}"))
    files[f"pv-{name}-horizontal-gold.svg"] = svg(640, 120, hlock(GOLD, name+"h"))
# tight-cropped marks for inline use, and the favicon
for name, fn, box in (("interlace", interlace, IL_BOX), ("ligature", ligature, LG_BOX)):
    bx, by, bw, bh = box
    for cname, c in (("gold", GOLD), ("ivory", IVORY), ("onyx", ONYX)):
        files[f"pv-{name}-mark-{cname}.svg"] = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{bx} {by} {bw} {bh}" role="img" '
            f'aria-label="Palladium Vogue"><title>Palladium Vogue</title>{fn(c, name+cname)}</svg>\n')
files["favicon.svg"] = svg(64, 64, '<rect x="5.5" y="5.5" width="53" height="53" fill="none" stroke="#C6A86A" stroke-opacity=".45"/>'
                           + place(interlace(GOLD, "fav"), IL_BOX, 32, 32, 30), bg=ONYX)
for k, v in files.items():
    open(os.path.join(OUT, k), "w", encoding="utf-8").write(v)
print("\n".join(sorted(files)))

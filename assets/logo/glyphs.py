import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
src, wght, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
f = instancer.instantiateVariableFont(TTFont(src), {"wght": wght})
gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
def glyph(ch):
    name = cmap[ord(ch)]; g = gs[name]
    pen = SVGPathPen(gs); g.draw(TransformPen(pen, (1,0,0,-1,0,0)))
    bp = BoundsPen(gs); g.draw(bp)
    return {"d": pen.getCommands(), "adv": g.width, "bounds": bp.bounds}
def text(s, track):
    pen = SVGPathPen(gs); x = 0
    for ch in s:
        name = cmap[ord(ch)]; g = gs[name]
        g.draw(TransformPen(pen, (1,0,0,-1,x,0))); x += g.width + track
    return {"d": pen.getCommands(), "width": x - track}
res = {"upm": upm, "capH": f['OS/2'].sCapHeight,
       "P": glyph("P"), "V": glyph("V"),
       "word": text("PALLADIUM VOGUE", 260), "word2": text("PALLADIUM", 300), "word3": text("VOGUE", 300),
       "milano": text("MAISON · MILANO", 420)}
json.dump(res, open(out, "w"))
print(upm, res["capH"], res["P"]["bounds"], res["V"]["bounds"], res["word"]["width"], res["milano"]["width"])

import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent / '.fonttools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parents[2]
font = TTFont(root / 'public/fonts/HVSMEGS-Style1.otf')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
result = {}
for text in ['haus', 'we are', 'the devs.', 'built by us.', 'our haus.', 'your coin.']:
    pen = SVGPathPen(glyphs)
    bounds = BoundsPen(glyphs)
    x = 0
    for char in text:
        name = cmap[ord(char)]
        transform = (1, 0, 0, -1, x, 0)
        glyphs[name].draw(TransformPen(pen, transform))
        glyphs[name].draw(TransformPen(bounds, transform))
        x += glyphs[name].width
    result[text] = {'d': pen.getCommands(), 'bounds': bounds.bounds}
(root / 'scripts/brand-kit/scribble-lettering.json').write_text(json.dumps(result))
print('Outlined HV SMEGS Style 1 lettering.')

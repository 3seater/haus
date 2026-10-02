import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '.fonttools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

font = TTFont('C:/Windows/Fonts/Anton-Regular.ttf')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
pen = SVGPathPen(glyphs)
bounds = BoundsPen(glyphs)
x = 0
for char in 'HAUS':
    name = cmap[ord(char)]
    transform = (1, 0, 0, -1, x, 0)
    glyphs[name].draw(TransformPen(pen, transform))
    glyphs[name].draw(TransformPen(bounds, transform))
    x += glyphs[name].width
x0, y0, x1, y1 = bounds.bounds
width, height = x1-x0, y1-y0
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{1200*height/width:.3f}" viewBox="{x0} {y0} {width} {height}" role="img" aria-label="HAUS"><title>HAUS — Anton</title><path fill="#191919" d="{pen.getCommands()}"/></svg>'
out = Path(__file__).resolve().parents[2] / 'public/brand-kit/bold-wordmark'
out.mkdir(parents=True, exist_ok=True)
(out/'HAUS.svg').write_text(svg, encoding='utf-8')
(out/'index.html').write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS</title><style>html,body{{margin:0;background:#fff}}body{{min-height:100vh;display:grid;place-items:center}}svg{{display:block;width:min(1200px,92vw);height:auto}}</style></head><body>{svg}</body></html>', encoding='utf-8')
print('Created standalone inline-vector HAUS wordmark in Anton.')

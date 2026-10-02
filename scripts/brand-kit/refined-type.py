import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '.fonttools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
root = Path(__file__).resolve().parents[2]
result = {}
for family, file in [('scribble', root/'public/fonts/HVSMEGS-Style1.otf'), ('bold', Path('C:/Windows/Fonts/Anton-Regular.ttf'))]:
    font=TTFont(file)
    glyphs=font.getGlyphSet()
    cmap=font.getBestCmap()
    for text in ['Haus', 'HAUS', '.fun', '.FUN', 'WE ARE', 'THE DEVS.', 'we are', 'the devs.', 'built by us.', 'BUILT BY US.', 'build your', 'BUILD YOUR', 'your coin.', 'our Haus.', 'together.', 'us.', 'A HOME FOR', 'EVERY HOLDER.']:
        pen=SVGPathPen(glyphs)
        bounds=BoundsPen(glyphs)
        x=0
        for char in text:
            name=cmap[ord(char)]
            transform=(1,0,0,-1,x,0)
            glyphs[name].draw(TransformPen(pen,transform))
            glyphs[name].draw(TransformPen(bounds,transform))
            x+=glyphs[name].width
        result[family+':'+text]={'d':pen.getCommands(),'bounds':bounds.bounds}
(root/'scripts/brand-kit/refined-lettering.json').write_text(json.dumps(result))
print('Outlined capital-H Haus, HV SMEGS and Anton.')

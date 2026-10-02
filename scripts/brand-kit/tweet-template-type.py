import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.fonttools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
root=Path(__file__).resolve().parents[2]
result={}
families={
 'bold':('C:/Windows/Fonts/Anton-Regular.ttf',['DOCS','WHAT IS','HAUS','CREATE TOKEN','THE HOLDERS','ARE THE DEVS.']),
 'scribble':(root/'public/fonts/HVSMEGS-Style1.otf',['Haus','are live.']),
 'sans':('C:/Windows/Fonts/arial.ttf',['@hausdotfun','haus.fun','docs.haus.fun','apps.haus.fun']),
}
for family,(file,labels) in families.items():
 font=TTFont(file);glyphs=font.getGlyphSet();cmap=font.getBestCmap()
 for label in labels:
  pen=SVGPathPen(glyphs);bounds=BoundsPen(glyphs);x=0
  for c in label:
   name=cmap[ord(c)];trans=(1,0,0,-1,x,0)
   glyphs[name].draw(TransformPen(pen,trans));glyphs[name].draw(TransformPen(bounds,trans));x+=glyphs[name].width
  result[family+':'+label]={'d':pen.getCommands(),'bounds':bounds.bounds}
(root/'scripts/brand-kit/tweet-template-lettering.json').write_text(json.dumps(result))
print('Prepared headline and pill vector lettering.')

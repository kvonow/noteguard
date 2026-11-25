from pathlib import Path
import re,json,copy
import pdfplumber
from pypdf import PdfReader,PdfWriter,Transformation
from pypdf.generic import RectangleObject
from PIL import Image,ImageDraw
src=Path('/Users/kwonhaewon/Downloads/math_main_mun_S9YL7W55.pdf')
out=Path('output/pdf/math-all-questions-uniform.pdf')
r=PdfReader(src); writer=PdfWriter(); manifest=[]; parents={}
W,H=595.2756,841.8898
with pdfplumber.open(src) as pdf:
 for i,page in enumerate(pdf.pages):
  starts=[w for w in page.extract_words() if re.fullmatch(r'\d{1,2}\.',w['text'])]
  subject='공통' if i<8 else '확률과 통계' if i<12 else '미적분' if i<16 else '기하'
  for w in sorted(starts,key=lambda w:int(w['text'][:-1])):
   left=w['x0']<421;x0,x1=(82,417) if left else (431,761);top=w['top']-20
   nexts=[a['top']-22 for a in starts if (a['x0']<421)==left and a['top']>w['top']+10]
   cap=min(nexts+[960 if i in [7,11,15,19] else 1070])
   objects=[a for a in page.chars+page.curves+page.rects+page.lines+page.images if a['x0']>=x0 and a['x1']<=x1 and a['top']>=top and a['bottom']<=cap]
   bottom=max(a['bottom'] for a in objects)+10
   height=bottom-top;width=x1-x0;scale=min((W-72)/width,(H-72)/height,1.5)
   crop=RectangleObject((x0,page.height-bottom,x1,page.height-top))
   source=copy.copy(r.pages[i]);source.cropbox=crop;source.trimbox=crop
   dest=writer.add_blank_page(W,H)
   tx=(W-width*scale)/2-x0*scale;ty=H-36-(page.height-top)*scale
   dest.merge_transformed_page(source,Transformation().scale(scale).translate(tx,ty),expand=False)
   index=len(writer.pages)-1
   if subject not in parents:parents[subject]=writer.add_outline_item(subject,index)
   writer.add_outline_item(f"{subject} {w['text'][:-1]}번",index,parent=parents[subject])
   manifest.append(dict(output_page=index+1,source_page=i+1,subject=subject,question=int(w['text'][:-1]),crop=[x0,top,x1,bottom],scale=scale))
writer.add_metadata({'/Title':'수학 모의고사 - 문항별 동일 크기 페이지','/Subject':'공통 및 모든 선택과목 46문항, 원본 벡터 유지'})
writer.compress_identical_objects(remove_identicals=True,remove_orphans=True)
with out.open('wb') as f:writer.write(f)
Path('tmp/pdfs/question-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
check=PdfReader(out);assert len(check.pages)==46;assert len(set((float(p.mediabox.width),float(p.mediabox.height)) for p in check.pages))==1
with pdfplumber.open(out) as p:
 for b in range(6):
  sheet=Image.new('RGB',(1600,1140),'#d8d8d8');d=ImageDraw.Draw(sheet)
  for j in range(8):
   k=b*8+j
   if k>=len(p.pages):break
   im=p.pages[k].to_image(resolution=60).original;im.thumbnail((390,530));x=(j%4)*400;y=(j//4)*570;sheet.paste(im,(x,y+22));d.text((x+5,y+4),f"Page {k+1}: Q{manifest[k]['question']} (source {manifest[k]['source_page']})",fill='black')
  sheet.save(f'tmp/pdfs/output-sheet-{b}.png')
print(json.dumps({'pages':len(check.pages),'size':[W,H],'bytes':out.stat().st_size,'path':str(out.resolve())}))

"""Fetch attributed Wikipedia intros for named, Messier and Caldwell objects.
Remaining entries use the offline catalogue overview in src/descriptions.js.
This explicit maintenance task is not run during normal builds.
"""
from pathlib import Path
import json,urllib.request,urllib.parse,time,re
root=Path(__file__).resolve().parents[1]
objects=json.loads((root/'public/data/catalogue.json').read_text())
selected=[o for o in objects if o['name']!=o['id'] or o['id'].startswith('M') or any(re.match(r'^C\d+$',a) for a in o['aliases'])]
output={};dest=root/'public/data/descriptions.json'
if dest.exists():output=json.loads(dest.read_text())
for start in range(0,len(selected),20):
 batch=selected[start:start+20];titles={o['id']:('Messier '+o['id'][1:] if re.match(r'^M\d+$',o['id']) else re.sub(r'^(NGC|IC)0*(\d+)',r'\1 \2',o['ngc'])) for o in batch}
 params={'action':'query','format':'json','formatversion':2,'redirects':1,'prop':'extracts|pageprops','exintro':1,'explaintext':1,'exlimit':20,'titles':'|'.join(titles.values())}
 for attempt in range(3):
  try:
   req=urllib.request.Request('https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params),headers={'User-Agent':'SkyPatch/1.0 (https://github.com/claudeschneider/skypatch; offline educational summaries)'})
   data=json.load(urllib.request.urlopen(req,timeout=30));break
  except Exception:
   if attempt==2:raise
   time.sleep(2)
 q=data.get('query',{});redirect={a['from']:a['to'] for a in q.get('normalized',[])+q.get('redirects',[])};pages={p['title']:p for p in q.get('pages',[])}
 for id,title in titles.items():
  seen=set()
  while title in redirect and title not in seen:seen.add(title);title=redirect[title]
  page=pages.get(title,{})
  if page.get('missing') or 'disambiguation' in page.get('pageprops',{}):continue
  text=page.get('extract','').strip().split('\n\n')[0]
  if not text:continue
  if len(text)>1000:
   stop=text.rfind('. ',0,1000);text=text[:stop+1] if stop>200 else text[:1000]+'…'
  output[id]={'text':text,'url':'https://en.wikipedia.org/wiki/'+urllib.parse.quote(title.replace(' ','_')),'title':title,'revision':page.get('lastrevid'),'license':'CC BY-SA 4.0'}
 dest.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 print(f'{min(start+20,len(selected))}/{len(selected)} targets; {len(output)} introductions',flush=True)
 time.sleep(.2)

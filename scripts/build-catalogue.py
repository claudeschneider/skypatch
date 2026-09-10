"""Rebuild browser catalogue from an OpenNGC checkout (see docs/DEPENDENCIES.md)."""
import csv,json,sys
from pathlib import Path
root=Path(sys.argv[1]); out=Path(__file__).resolve().parents[1]/'public/data/catalogue.json'
types={'G':'Galaxy','GPair':'Galaxy group','GTrpl':'Galaxy group','GGroup':'Galaxy group','HII':'Emission nebula','EmN':'Emission nebula','RfN':'Reflection nebula','Neb':'Nebula','Cl+N':'Cluster + nebula','PN':'Planetary nebula','SNR':'Supernova remnant','OCl':'Open cluster','GCl':'Globular cluster','DrkN':'Dark nebula','*Ass':'Star association'}
names={'NGC7000':'North America Nebula','NGC6888':'Crescent Nebula','NGC5457':'Pinwheel Galaxy','NGC5194':'Whirlpool Galaxy','NGC6720':'Ring Nebula','IC1805':'Heart Nebula','IC1848':'Soul Nebula','IC1396':'Elephant’s Trunk region','IC5070':'Pelican Nebula'}
def num(s):return float(s) if s else None
def coord(s,ra=False):
 sign=-1 if s.startswith('-') else 1
 a,b,c=map(float,s.lstrip('+-').split(':'));return sign*(a+b/60+c/3600)*(15 if ra else 1)
def short(s):
 for prefix in ['NGC','IC']:
  if s.startswith(prefix) and s[len(prefix):].isdigit():return prefix+str(int(s[len(prefix):]))
 return s
objects=[]
for f in ['NGC.csv','addendum.csv']:
 for r in csv.DictReader((root/'database_files'/f).open(),delimiter=';'):
  if r['Type'] not in types or not r['RA'] or not r['Dec']:continue
  ident='M'+str(int(r['M'])) if r['M'] else short(r['Name'])
  aliases=[short(r['Name'])]+[x.strip() for x in r['Identifiers'].split(',') if x.strip()]
  common=names.get(short(r['Name'])) or r['Common names'].split(',')[0] or ident
  o={'id':ident,'ngc':r['Name'],'name':common,'aliases':aliases,'ra':coord(r['RA'],True),'dec':coord(r['Dec']),'type':types[r['Type']],'constellation':r['Const'],'major':num(r['MajAx']),'minor':num(r['MinAx']),'pa':num(r['PosAng']),'mag':num(r['V-Mag'] or r['B-Mag']),'band':'V' if r['V-Mag'] else 'B' if r['B-Mag'] else None,'sb':num(r['SurfBr'])}
  if short(r['Name'])=='NGC6888':o['aliases']+=['C27','Caldwell 27']
  for lv in [2,3,1]:
   path=root/'outlines/objects'/f"{r['Name']}_lv{lv}.txt"
   if path.exists():
    pts=[[float(x['RAJ2000']),float(x['DEJ2000'])] for x in csv.DictReader(path.open(),delimiter='\t') if x['RAJ2000'] and x['DEJ2000']]
    o['outline']=pts[::max(1,len(pts)//180)];o['outlineLevel']=lv;break
  objects.append(o)
# Keep distinct records, never pre-filter by a particular site, equipment or magnitude.
out.write_text(json.dumps(objects,separators=(',',':')))
print(f'{len(objects)} catalogue objects')

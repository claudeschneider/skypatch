"""Bump each commit's version and keep the GitHub landing-page summary in sync."""
from pathlib import Path
import datetime,json,re,subprocess,sys
root=Path(__file__).resolve().parents[1]
package=root/'package.json'; log=root/'CHANGELOG.md'
def sync():
 text=log.read_text(); entry=text.split('\n## ')[1]; title,*body=entry.splitlines()
 summary='<!-- release:start -->\n## Latest release · '+title+'\n'+'\n'.join(body).strip()+'\n\n[Full changelog](CHANGELOG.md) · [Website changelog](https://claudeschneider.github.io/skypatch/changelog.html)\n<!-- release:end -->'
 readme=root/'README.md'; content=readme.read_text()
 if '<!-- release:start -->' in content:content=re.sub(r'<!-- release:start -->.*?<!-- release:end -->',lambda _:summary,content,flags=re.S)
 else:content=content.replace('## Run locally',summary+'\n\n## Run locally')
 readme.write_text(content)
if sys.argv[1:]==['sync']:sync();sys.exit()
if sys.argv[1:]==['check']:
 # Validate every commit after the last historical, unversioned release.
 commits=subprocess.check_output(['git','rev-list','--reverse','202e821..HEAD'],cwd=root,text=True).splitlines()
 for commit in commits:
  def read(path,ref=commit):return subprocess.check_output(['git','show',ref+':'+path],cwd=root,text=True)
  current=json.loads(read('package.json'))['version']
  previous=json.loads(read('package.json',commit+'^'))['version']
  assert tuple(map(int,current.split('.')))>tuple(map(int,previous.split('.'))),'Each commit must increase package.json version: '+commit
  assert read('CHANGELOG.md').split('\n## ')[1].startswith(current+' — '),'Missing changelog: '+commit
  lock=json.loads(read('package-lock.json'))
  assert lock['version']==current and lock['packages']['']['version']==current,'Synchronize package-lock.json: '+commit
 print('Release versions and changelogs verified for',len(commits),'commits.');sys.exit()
if len(sys.argv)<3 or sys.argv[1] not in ['patch','minor','major']:
 sys.exit('Usage: npm run release -- patch "User-facing change" ["Another change"]')
kind,*notes=sys.argv[1:];data=json.loads(package.read_text());numbers=list(map(int,data['version'].split('.')));index=['major','minor','patch'].index(kind);numbers[index]+=1
for i in range(index+1,3):numbers[i]=0
version='.'.join(map(str,numbers));data['version']=version;package.write_text(json.dumps(data,indent=2)+'\n')
lock=root/'package-lock.json';data=json.loads(lock.read_text());data['version']=version;data['packages']['']['version']=version;lock.write_text(json.dumps(data,indent=2)+'\n')
content=log.read_text();pos=content.index('\n## ');entry='\n## '+version+' — '+datetime.date.today().isoformat()+'\n\n'+'\n'.join('- '+note for note in notes)+'\n'
log.write_text(content[:pos]+entry+content[pos:]);sync();print('Prepared version '+version+'; review the changelog and landing page before committing.')

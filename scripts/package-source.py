"""Package corresponding app source for the static build's credits link."""
from pathlib import Path
import tarfile
root=Path(__file__).resolve().parents[1]
dest=root/'public/source/skypatch-source.tar.gz'
# Explicit allowlist excludes local settings, browser traces, node_modules and builds.
files=[root/f for f in ['README.md','LICENSE','package.json','package-lock.json','index.html','vite.config.js','playwright.config.js','playwright.pwa.config.js','.gitignore']]
for folder in ['src','scripts','tests','docs','public','landing','.github']:
 for f in (root/folder).rglob('*'):
  if not f.is_file() or (f.suffix=='.pyc' or (f.suffix=='.png' and not f.name.startswith('icon-'))):continue
  if 'public/source' in f.as_posix():continue
  files.append(f)
with tarfile.open(dest,'w:gz') as archive:
 for f in files:archive.add(f,arcname='skypatch/'+str(f.relative_to(root)))
print('Packaged application source. Engine source is supplied separately alongside it.')

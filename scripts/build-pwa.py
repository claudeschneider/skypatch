from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
files=sorted(str(f.relative_to(dist)) for f in dist.rglob('*') if f.is_file() and f.name!='sw.js' and 'source' not in f.relative_to(dist).parts)
digest=hashlib.sha256()
for name in files:digest.update((dist/name).read_bytes())
template=(root/'scripts/sw-template.js').read_text()
digest.update(template.encode())
# Scope is part of the cache name so multiple GitHub Pages projects never collide.
template=template.replace('__CACHE__',"'skypatch-core-'+new URL('./',self.location.href).pathname+'-"+digest.hexdigest()[:16]+"'").replace('__FILES__',json.dumps(files)).replace('__VERSION__',json.dumps(digest.hexdigest()[:12]))
(dist/'sw.js').write_text(template)
print(f'Offline core: {len(files)} files, {sum((dist/f).stat().st_size for f in files)/1048576:.1f} MB (source archives excluded).')

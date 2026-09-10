from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
site=root/'site'
if site.exists():shutil.rmtree(site)
shutil.copytree(root/'landing',site)
shutil.copytree(root/'dist',site/'app')
(site/'.nojekyll').touch()
print('Public site built: landing page at /, planner and PWA at /app/.')
# Render the shared changelog with a deliberately small, escaped Markdown subset.
import html,json
parts=[];in_list=False
for line in (root/'CHANGELOG.md').read_text().splitlines():
 if not line.startswith('- ') and in_list:parts.append('</ul>');in_list=False
 if line.startswith('# '):parts.append('<h1>'+html.escape(line[2:])+'</h1>')
 elif line.startswith('## '):parts.append('<h2>'+html.escape(line[3:])+'</h2>')
 elif line.startswith('- '):
  if not in_list:parts.append('<ul>');in_list=True
  parts.append('<li>'+html.escape(line[2:])+'</li>')
 elif line.strip():parts.append('<p>'+html.escape(line)+'</p>')
if in_list:parts.append('</ul>')
version=json.loads((root/'package.json').read_text())['version']
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>What’s new — Sky Patch</title><link rel="stylesheet" href="style.css"></head><body><header><a class="brand" href="./">✦ Sky Patch</a><nav aria-label="Main navigation"><a href="./">Feature tour</a><a class="button small" href="app/">Open planner ↗</a></nav></header><main class="release-notes">'''+''.join(parts)+'''<p><a href="https://github.com/claudeschneider/skypatch/blob/main/CHANGELOG.md">Changelog on GitHub ↗</a></p></main></body></html>'''
(site/'changelog.html').write_text(page)
p=site/'index.html';p.write_text(p.read_text().replace('Free & open source · No account · Desktop and mobile','Free & open source · No account · Desktop and mobile · v'+html.escape(version)))
print('Website changelog generated for v'+version)

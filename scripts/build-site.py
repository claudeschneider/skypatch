from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
site=root/'site'
if site.exists():shutil.rmtree(site)
shutil.copytree(root/'landing',site)
shutil.copytree(root/'dist',site/'app')
(site/'.nojekyll').touch()
print('Public site built: landing page at /, planner and PWA at /app/.')

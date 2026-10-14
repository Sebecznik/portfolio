#!/usr/bin/env python3
"""Build the bilingual portfolio with Python's standard library only."""
import html, json, re, shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
copy = json.loads((ROOT / 'src/content.json').read_text())
template = (ROOT / 'src/index.html').read_text()
keys = set(re.findall(r'\{\{([\w.]+)\}\}', template))
missing = keys - set(copy)
if missing:
    raise ValueError(f'Missing translations: {sorted(missing)}')
for key, value in copy.items():
    if set(value) != {'en', 'pl'} or not all(value.values()):
        raise ValueError(f'Incomplete translation: {key}')
rendered = re.sub(r'\{\{([\w.]+)\}\}', lambda m: html.escape(copy[m[1]]['en']), template)
(ROOT / 'index.html').write_text(rendered)
(ROOT / 'assets/js/content.js').write_text('window.PORTFOLIO_COPY = '+json.dumps(copy, ensure_ascii=False, separators=(',', ':'))+';\n')
for source, target in [('styles.css','assets/css/styles.css'),('app.js','assets/js/app.js'),('boot.js','assets/js/boot.js'),('playground.js','assets/js/playground.js'),('playground.css','assets/css/playground.css')]:
    shutil.copyfile(ROOT / 'src' / source, ROOT / target)
print(f'Built EN/PL portfolio: {len(copy)} translations.')

#!/usr/bin/env python
# coding=UTF-8

from PIL import Image
from devtools import *

for thing, url in [
    ('jquery.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js'),
    ('angular.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular.js'),
]: download(TARGET / 'thirdparty' / thing, url)

for path in ORIGIN.glob('**/*.js'):
    if path.is_file():
        copy(TARGET / path.relative_to(ORIGIN), path)    
  
copy(TARGET / 'icon.png', ORIGIN / 'icon.png')

with (ORIGIN / 'version').open(encoding='UTF-8') as version_file:
    version = version_file.read().strip()

icons = [
    (get_image_size(TARGET / 'icon.png'), 'icon.png')
] 

render(TARGET / 'manifest.json', ORIGIN / 'manifest.json.template',
       version=version,
       icons=icons)

scripts = [s.relative_to(TARGET) for s in TARGET.glob('**/*.js')]

render(TARGET / 'index.html', ORIGIN / 'index.html.template',
       scripts=scripts)

finish()

#!/usr/bin/env python
# coding=UTF-8

from devtools import *

for path in ORIGIN.glob('**/*.js'):
    if path.is_file():
        copy(TARGET / path.relative_to(ORIGIN), path)    

for thing, url in [
    ('jquery.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js'),
    ('angular.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular.js'),
]: download(TARGET / 'thirdparty' / thing, url)
  
copy(TARGET / 'icon.png', ORIGIN / 'icon.png')

render(TARGET / 'manifest.json', ORIGIN / 'manifest.json.template',
    version=(ORIGIN / 'version').open(encoding='UTF-8').read().strip(),
    icons=[(get_image_size(TARGET / 'icon.png'), 'icon.png')],
    scripts=['thirdparty/jquery.js'] + ['background.js'] + [s.relative_to(TARGET) for s in TARGET.glob('background/**/*.js')]     
)

render(TARGET / 'foreground.html', ORIGIN / 'foreground.html.template',
    scripts=[
        'thirdparty/jquery.js',
        'thirdparty/angular.js',
    ] + ['foreground.js'] + [s.relative_to(TARGET) for s in TARGET.glob('foreground/**/*.js')]
)

finish()

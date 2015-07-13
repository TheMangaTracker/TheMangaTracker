#!/usr/bin/env python
# coding=UTF-8

from itertools import chain
from devtools import *

for thing, url in [
    ('jquery.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js'),
    ('angular.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular.js'),
    ('angular-route.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular-route.js'),
]: download(TARGET / 'thirdparty' / thing, url)

for path in chain(ORIGIN.glob('**/*.js'), ORIGIN.glob('**/*.html'), ORIGIN.glob('**/*.png')):
    if path.is_file():
        copy(TARGET / path.relative_to(ORIGIN), path)    

render(TARGET / 'manifest.json', ORIGIN / 'manifest.json.template',
    version=(ORIGIN / 'version').open(encoding='UTF-8').read().strip(),
    icons=[(get_image_size(TARGET / 'icon.png'), 'icon.png')],
    scripts=['thirdparty/jquery.js'] + ['background.js'] + [s.relative_to(TARGET) for s in TARGET.glob('background/**/*.js')]     
)

render(TARGET / 'ui.html', ORIGIN / 'ui.html.template')

finish()

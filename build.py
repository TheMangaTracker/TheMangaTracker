#!/usr/bin/env python
# coding=UTF-8

from itertools import chain
from devtools import *

for thing, url in [
    ('jquery.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js'),
    ('angular.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular.js'),
]: download(TARGET / 'thirdparty' / thing, url)

for path in chain(ORIGIN.glob('**/*.js'), ORIGIN.glob('**/*.html'), ORIGIN.glob('**/*.png')):
    copy(TARGET / path.relative_to(ORIGIN), path)    

for path in ORIGIN.glob('**/*.template'):
    render(TARGET / (path.parent / path.stem).relative_to(ORIGIN), path)

finish()

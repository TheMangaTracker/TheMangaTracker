#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

begin()

for thing, url in [
    ('jquery.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js'),
    ('angular.js', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.2/angular.js'),
]: download(TARGET / 'thirdparty' / thing, url)

for path in chain(SOURCE.glob('**/*.js'), SOURCE.glob('**/*.html'), SOURCE.glob('**/*.png')):
    copy(TARGET / path.relative_to(SOURCE), path)    

for path in SOURCE.glob('**/*.template'):
    render(TARGET / (path.parent / path.stem).relative_to(SOURCE), path)

end()


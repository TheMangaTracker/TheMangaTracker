#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

for thing, url in read_yaml(SOURCE / 'thirdparty.yaml').items():
    download(OUTPUT / 'thirdparty' / thing, url)

for path in chain(SOURCE.glob('**/*.js'), SOURCE.glob('**/*.html'), SOURCE.glob('**/*.png')):
    copy(OUTPUT / path.relative_to(SOURCE), path)    

for path in SOURCE.glob('**/*.template'):
    render(OUTPUT / (path.parent / path.stem).relative_to(SOURCE), path)

finish()

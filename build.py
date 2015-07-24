#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

CONFIG = read_yaml('config.yaml')

for file, url in read_yaml('thirdparty.yaml').items():
    download('thirdparty' / Path(file), url)

render('servers.js', modules=glob('servers/*.js'))

for template in glob('**/*.template'):
    render(template.parent / template.stem, template,
           CONFIG=CONFIG)

for file in glob('**/*.yaml') + glob('**/*.template'):
    remove(file)

finish()

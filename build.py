#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

CONFIG = read_yaml('config.yaml')

for file, url in read_yaml('thirdparty.yaml').items():
    download('thirdparty' / Path(file), url)

sites = [s.stem for s in glob('sites/*.js')]

render('manifest.json', CONFIG=CONFIG, sites=sites)
render('sites.js', CONFIG=CONFIG, sites=sites)
render('search.html', CONFIG=CONFIG)

transpile('quasiAmd.js', disableModuleWrap=True)
for file in ['search.js', 'sites.js'] + glob('sites/*.js') + glob('utility/**/*.js'):
    transpile(file)

for file in glob('**/*.yaml'):
    remove(file)

finish()

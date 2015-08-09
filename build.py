#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

CONFIG = read_yaml('config.yaml')

for file, url in read_yaml('thirdparty.yaml').items():
    download('thirdparty' / Path(file), url)

sites = [s.name for s in glob('sites/*') if s.is_dir()]

render('manifest.json', CONFIG=CONFIG, sites=sites)
render('sites/search.js', CONFIG=CONFIG, sites=sites)
render('search.html', CONFIG=CONFIG)

for file in ['search.js'] + glob('sites/**/*.js') + glob('utility/*.js'):
    transpile(file);

for file in glob('**/*.yaml'):
    remove(file)

finish()

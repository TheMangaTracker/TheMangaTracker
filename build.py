#!/usr/bin/env python3
# coding: UTF-8

from itertools import chain
from buildtools import *

CONFIG = read_yaml('config.yaml')

for file, url in read_yaml('thirdparty.yaml').items():
    download('thirdparty' / Path(file), url)

servers = [s.stem for s in glob('servers/*.js')]

render('manifest.json', CONFIG=CONFIG, servers=servers)
render('servers.js', CONFIG=CONFIG, servers=servers)
render('search.html', CONFIG=CONFIG)

for file in glob('**/*.yaml'):
    remove(file)

finish()

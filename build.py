#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

sites = {s.name for s in glob('sites/*') if s.is_dir()}
extension = read_yaml('extension.yaml')

render('sites.js', {
    'sites': sites,
})

render('search.html', {
    'extensionName': extension['name'],
})
render('detail.html', {
    'extensionName': extension['name'],
})
render('read.html', {
    'extensionName': extension['name'],
})

render('manifest.json', {
    'name': extension['name'],
    'version': extension['version'],
    'description': extension['description'].replace('\n', '\\n'),
    'icon': {
        'path': '/icon.png',
        'size': get_image_size('icon.png'),
    },
    'siteDomains': {d for s in sites for d in [s] + read_yaml(Path('sites') / s / 'other_hosts.yaml')},
})

for p in glob('**/*.js'):
    transpile(p)

for name, url in read_yaml('thirdparty.yaml').items():
    download(Path('thirdparty') / name, url)

for p in glob('**/*.yaml'):
    remove(p)

finish()

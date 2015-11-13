#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

siteIds = {s.parent.name for s in glob('core/sites/*/site.js')}
extension = read_yaml('extension.yaml')

render('core/siteIds.js', {
    'siteIds': siteIds,
})

render('search_query.html', {
    'extensionName': extension['name'],
})
render('search_results.html', {
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
    'hosts': {h for sid in siteIds for h in read_yaml(Path('core/sites') / sid / 'hosts.yaml')},
})

for p in glob('**/*.js'):
    transpile(p)

for name, url in read_yaml('thirdparty.yaml').items():
    download(Path('thirdparty') / name, url)

for p in glob('**/*.yaml'):
    remove(p)

finish()

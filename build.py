#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

extension = read_yaml('extension.yaml')

render('sites.js', {
    'sites': [s.parent.name for s in glob('sites/*/sites.js')],
})

for view in ['search.html', 'chapters.html', 'pages.html']:
    render(view, {
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
    'accessedUris': {uri for uris in glob('sites/*/accessedUris.yaml') for uri in read_yaml(uris)},
})

for p in glob('**/*.js'):
    transpile(p)

for name, url in read_yaml('thirdparty.yaml').items():
    download(Path('thirdparty') / name, url)

for p in glob('**/*.yaml'):
    remove(p)

finish()

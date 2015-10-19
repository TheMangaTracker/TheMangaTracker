#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

sites = {s.name for s in glob('sites/*') if s.is_dir()}
thirdparty = read_yaml('thirdparty.yaml')
extension = read_yaml('extension.yaml')

render('sites.js', {
    'sites': sites,
})

render('require-config.js', {
    'thirdparty': [{ 'name': name, 'url': url[:-3] } for name, url in thirdparty.items() if name != 'require'],
})

render('search.html', {
    'requireUrl': thirdparty['require'],
    'extensionName': extension['name'],
})
render('details.html', {
    'requireUrl': thirdparty['require'],
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
    'siteDomains': {d for s in sites for d in read_yaml(Path('sites') / s / 'domains.yaml')},
    'remoteScriptOrigins': {urlunparse(urlparse(s)[:2] + ('',) * 4) for s in thirdparty.values()},
})

for p in glob('**/*.js'):
    transpile(p)

for p in glob('**/*.yaml'):
    remove(p)

finish()

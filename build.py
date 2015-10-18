#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

sites = {s.name for s in glob('sites/*') if s.is_dir()}
thirdparty = read_yaml('thirdparty.yaml')
extension = read_yaml('extension.yaml')
require_url = read_yaml('require-url.yaml')

render('sites.js', {
    'sites': sites,
})

render('require-config.js', {
    'thirdparty': [{ 'name': name, 'url': url[:-3] if url.endswith('.js') else url } for name, url in thirdparty.items()],
})

render('search.html', {
    'requireUrl': require_url,
    'extensionName': extension['name'],
})
render('read.html', {
    'requireUrl': require_url,
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
    'remoteScriptOrigins': {urlunparse(urlparse(s)[:2] + ('',) * 4) for s in [require_url] + list(thirdparty.values())},
})

for p in glob('**/*.js'):
    transpile(p)

for p in glob('**/*.yaml'):
    remove(p)

finish()

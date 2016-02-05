#!/usr/bin/env python3
# coding: UTF-8

from urllib.parse import urlparse, urlunparse
from buildtools import *

extension = read_yaml('extension.yaml')

def load_site_paths(path):
    path = Path(path)
    if (path / 'sites.yaml').exists():
        for subpath in read_yaml(path / 'sites.yaml'):
            yield load_site_paths(path / subpath)
    else:
        assert (path / 'site.js').exists()
        assert (path / 'accessedUris.yaml').exists()
        yield path
site_paths = [p.relative_to('sites') for p in glob('sites/*/') for pp in load_site_paths(p)]

render('sites.js', {
    'paths': site_paths,
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
    'accessedUris': {u for p in site_paths for u in read_yaml('sites' / p / 'accessedUris.yaml')},
})

for p in glob('**/*.js'):
    transpile(p)

for name, url in read_yaml('thirdparty.yaml').items():
    download(Path('thirdparty') / name, url)

for p in glob('**/*.yaml'):
    remove(p)

finish()

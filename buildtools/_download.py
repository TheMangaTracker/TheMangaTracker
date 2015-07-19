# coding: UTF-8

__all__ = [
    'download',
]

from pathlib import Path
from urllib.request import urlopen

from ._make_parents import *

def download(target, url):
    target = Path(target)
    
    with urlopen(url) as remote:
        data = remote.read()
    
    make_parents(target)
    
    with target.open('wb') as local:
        local.write(data)


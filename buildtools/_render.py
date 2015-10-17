# coding: UTF-8

__all__ = [
    'render',
]

from os import chdir
from pathlib import Path
from itertools import chain
import pystache

from ._make_parents import *

_renderer = pystache.Renderer()

def render(target, context):
    target = Path(target)

    make_parents(target)
    result = _renderer.render_path(str(target), context)
    with target.open('w', encoding='UTF-8') as target_file:
        target_file.write(result)


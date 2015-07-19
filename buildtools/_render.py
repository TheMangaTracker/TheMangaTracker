# coding: UTF-8

__all__ = [
    'render',
]

from os import chdir
from pathlib import Path
from itertools import chain
from mako.template import Template

from ._make_parents import *

def render(target, source, **variables):
    from ._tools import tools

    target = Path(target)
    source = Path(source)

    template = Template(filename=str(source))
    
    variables = dict(chain(tools.items(), variables.items()))

    cwd = Path.cwd()
    chdir(str(source.parent))
    result = template.render(**variables)
    chdir(str(cwd))

    make_parents(target)
    with target.open('w', encoding='UTF-8') as target_file:
        target_file.write(result)


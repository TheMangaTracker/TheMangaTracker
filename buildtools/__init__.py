# coding: UTF-8

__all__ = [
    'begin',
    'end',
]

from os import chdir
from pathlib import Path

from ._tools import *
from ._locations import *
from ._copy import *
from ._remove import *

def begin():
    global cwd
    
    cwd = Path.cwd()
    chdir(str(Path(__file__).parents[1]))
    
    remove(TMP)
    copy(SOURCE, 'source')

def end():
    copy('target', TARGET)
    remove(TMP)

    chdir(str(cwd))

globals().update(tools)
__all__ += list(tools.keys())

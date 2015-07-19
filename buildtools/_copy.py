# coding: UTF-8

__all__ = [
    'copy',
]

from shutil import copytree, copy2

from ._remove import *
from ._make_parents import *

def copy(target, source):
    remove(target)
    try:
        copytree(str(source), str(target))
    except NotADirectoryError:
        make_parents(target)
        copy2(str(source), str(target))


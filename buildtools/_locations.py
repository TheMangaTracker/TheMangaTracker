# coding: UTF-8

__all__ = [
    'TMP',
    'SOURCE',
    'OUTPUT',
]

import atexit
from tempfile import mkdtemp
from pathlib import Path

from ._remove import *

TMP = Path(mkdtemp(dir=str(Path(__file__).parents[1]), prefix='.buildtmp-'))
atexit.register(lambda: remove(TMP))

SOURCE = TMP / 'source'
OUTPUT = TMP / 'output'


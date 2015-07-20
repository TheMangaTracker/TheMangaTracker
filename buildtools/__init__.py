# coding: UTF-8

__all__ = [
    'finish',
]

from os import chdir
from pathlib import Path
import atexit

from ._tools import *
from ._locations import *
from ._copy import *
from ._remove import *
from ._run import *
from ._output import *
    
def finish():
    output()
    run()

globals().update(tools)
__all__.extend(tools.keys())

cwd = Path.cwd()
chdir(str(Path(__file__).parents[1]))
atexit.register(lambda: chdir(str(cwd)))

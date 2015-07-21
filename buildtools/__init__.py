# coding: UTF-8

__all__ = [
    'finish',
]

from os import chdir
from pathlib import Path
from tempfile import mkdtemp
import atexit

from ._arg_parser import *
from ._tools import *
from ._copy import *
from ._remove import *
from ._run import *
from ._output import *
   
args = arg_parser.parse_args()

def finish():
    run(args)
    output(args)

globals().update(tools)
__all__.extend(tools.keys())

root = Path(__file__).parents[1]

build_dir = mkdtemp(dir=str(root), prefix='.buildtmp-')
atexit.register(lambda: remove(build_dir))

copy(build_dir, root / 'source')

chdir(build_dir)


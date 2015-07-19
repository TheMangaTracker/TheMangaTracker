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
from ._arg_parser import *

arg_parser.add_arg(
    'output', type=Path,
    nargs='?', default=Path('output'),
    help='build output path'
)

args = arg_parser.parse_args()
    
def finish():
    copy(args.output, OUTPUT)

    run()

globals().update(tools)
__all__.extend(tools.keys())

remove(TMP)
copy(SOURCE, Path(__file__).parents[1] / 'source')
atexit.register(lambda: remove(TMP))

cwd = Path.cwd()
chdir(str(Path(__file__).parents[1]))
atexit.register(lambda: chdir(str(cwd)))

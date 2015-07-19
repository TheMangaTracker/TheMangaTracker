# coding: UTF-8

__all__ = [
    'output',
]

from pathlib import Path

from ._locations import *
from ._arg_parser import *
from ._copy import *

arg_parser.add_arg(
    '--output', type=Path,
    nargs='?', default=None, const=Path('output'),
    help='directory to place build output into'
)

def output():
    args = arg_parser.parse_args()

    if args.output is not None:
        copy(args.output, OUTPUT)

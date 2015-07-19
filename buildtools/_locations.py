# coding: UTF-8

__all__ = [
    'TMP',
    'SOURCE',
    'OUTPUT',
]

from pathlib import Path

TMP = Path(__file__).parents[1] / '.buildtmp'
SOURCE = TMP / 'source'
OUTPUT = TMP / 'output'


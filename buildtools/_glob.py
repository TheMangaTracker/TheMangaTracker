# coding: UTF-8

__all__ = [
    'glob',
]

from pathlib import Path

def glob(pattern):
    return list(Path().glob(pattern))


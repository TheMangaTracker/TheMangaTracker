# coding: UTF-8

__all__ = [
    'make_parents',
]

from pathlib import Path

def make_parents(target):
    target = Path(target)

    for parent in reversed(target.parents):
        if parent.exists():
            assert parent.is_dir()
        else:
            parent.mkdir()


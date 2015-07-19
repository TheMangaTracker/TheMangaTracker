# coding: UTF-8

__all__ = [
    'remove',
]

from pathlib import Path

def remove(target):
    target = Path(target)

    if not target.exists():
        return
    
    if target.is_dir():
        for entry in target.iterdir():
            remove(entry)
        target.rmdir()
    else:
        target.unlink()


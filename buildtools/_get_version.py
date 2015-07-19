# coding: UTF-8

__all__ = [
    'get_version',
]

from ._locations import *

def get_version():
    with (SOURCE / 'version').open(encoding='UTF-8') as version_file:
        version = version_file.read()
    return version.strip()


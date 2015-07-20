# coding: UTF-8

__all__ = [
    'CONFIG',
]

from ._locations import *
from ._read_yaml import *

CONFIG = read_yaml(SOURCE / 'config.yaml')

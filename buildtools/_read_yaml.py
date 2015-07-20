# coding: UTF-8

__all__ = [
    'read_yaml',
]

from pathlib import Path
import yaml

def read_yaml(document):
    document = Path(document)
    with document.open(encoding='UTF-8') as document_file:
        return yaml.load(document_file)


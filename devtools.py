# coding=UTF-8

__all__ = [
    'ORIGIN',
    'TARGET',
    'remove',
    'download',
    'copy',
    'get_image_size',
    'render',
    'finish',
]

from os import chdir
from pathlib import Path
from argparse import ArgumentParser
from mako.lookup import TemplateLookup
from mako.exceptions import TemplateLookupException
from mako.template import Template

def remove(what):
    what = Path(what)
    if not what.exists():
        return
    if what.is_dir():
        for entry in what.iterdir():
            remove(entry)
        what.rmdir()
    else:
        what.unlink()

def download(save_as, url):
    from urllib.request import urlopen
    
    save_as = Path(save_as)
    with urlopen(url) as remote:
        data = remote.read()
    make_parent_dirs(save_as)
    with save_as.open('wb') as local:
        local.write(data)

def copy(target, origin):
    import shutil
    import errno

    origin = str(origin)
    target = str(target)
    remove(target)
    try:
        shutil.copytree(origin, target)
    except NotADirectoryError:
        make_parent_dirs(target)
        shutil.copy2(origin, target)

def get_image_size(path):
    from PIL import Image

    image = Image.open(str(path))
    size, vertical_size = image.size
    assert vertical_size == size
    return size

def render(target, template, **variables):
    target = Path(target)
    template = Template(filename=str(template), lookup=MyTemplateLookup(template))
    for k, v in globals().items():
        if k in __all__ and k not in variables:
            variables[k] = v
    result = template.render(**variables)
    make_parent_dirs(target)
    with target.open('w', encoding='UTF-8') as target_file:
        target_file.write(result)

def finish():
    copy(args.target, TARGET)
    remove(TMP)

class MyTemplateLookup(TemplateLookup):
    def __init__(self, path, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__path = path

    def get_template(self, uri):
        path = Path(uri)
        if not path.exists():
            raise TemplateLookupException()
        return Template(filename=str(path), lookup=MyTemplateLookup(path))

def make_parent_dirs(path):
    path = Path(path)
    for parent in reversed(path.parents):
        if parent.exists():
            assert parent.is_dir()
        else:
            parent.mkdir()

chdir(str(Path(__file__).parent))

arg_parser = ArgumentParser()
arg_parser.add_argument('target', type=Path, nargs='?', default='build', help='Directory to place build results into.')
args = arg_parser.parse_args()

TMP = Path('.tmp')

ORIGIN = TMP / 'origin'
TARGET = TMP / 'target'

copy(ORIGIN, 'source')


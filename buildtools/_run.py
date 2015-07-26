# coding: UTF-8

__all__ = [
    'run',
]

import platform
import subprocess
from pathlib import Path
from os.path import expanduser
from tempfile import mkdtemp

from ._arg_parser import *
from ._copy import *
from ._remove import *

system = platform.system()

if system == 'Linux':
    browsers = {
        'chromium': expanduser('~/.config/chromium'),
        'google-chrome': expanduser('~/.config/google-chrome'),
    }
else:
    raise Exception('Unknown system \'{}\''.format(system))

arg_parser.add_arg(
    '--run', type=str,
    nargs='?', default=None, const='chromium', choices=list(browsers.keys()),
    help='run extension in browser after build'
)

def run(args):
    browser = args.run

    if browser is None:
        return

    user_data_dir = Path(mkdtemp())
    try:
        copy(user_data_dir / 'First Run', Path(browsers[browser]) / 'First Run')
       
        subprocess.call([
            browser,
            '--user-data-dir=' + str(user_data_dir),
            '--no-first-run',
            '--load-extension=.',
            '--start-maximized',
        ])

    finally:
        remove(user_data_dir)

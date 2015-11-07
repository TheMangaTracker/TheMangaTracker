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
        'chromium': {
            'data_dir': expanduser('~/.config/chromium'),
            'executable': 'chromium',
        },
        'google-chrome': {
            'data_dir': expanduser('~/.config/google/chrome'),
            'executable': 'google-chrome',
        },
    }
elif system == 'Darwin':
    browsers = {
        'chromium': {
            'data_dir': expanduser('~/Library/Application Support/Chromium'),
            'executable': '/Applications/Chromium.app/Contents/MacOS/Chromium',
        },
        'google-chrome': {
            'data_dir': expanduser('~/Library/Application Support/Google/Chrome'),
            'executable': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        }
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
        copy(user_data_dir / 'First Run', Path(browsers[browser]['data_dir']) / 'First Run')

        subprocess.call([
            browsers[browser]['executable'],
            '--user-data-dir=' + str(user_data_dir),
            '--no-first-run',
            '--load-extension=.',
            '--start-maximized',
        ])

    finally:
        remove(user_data_dir)

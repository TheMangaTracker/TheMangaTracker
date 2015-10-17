# coding: UTF-8

__all__ = [
    'transpile',   
]

import subprocess

def transpile(target, *sources):
    if not sources:
        sources = [target]

    result = subprocess.call(['babel',
        '--no-non-standard',
        '--whitelist', 'strict,es6.arrowFunctions,es6.classes,es6.destructuring,es6.parameters,es6.spread,es6.objectSuper,es6.templateLiterals',
        '-o', str(target),
    ] + list(map(str, sources)))
    
    if result != 0:
        raise Exception('Transpilation error')


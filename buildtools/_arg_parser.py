# coding: UTF-8

__all__ = [
    'arg_parser',
]

from argparse import ArgumentParser

class ArgParser(ArgumentParser):
    def add_arg(self, *args, **kwargs):
        self.add_argument(*args, **kwargs)

arg_parser = ArgParser()

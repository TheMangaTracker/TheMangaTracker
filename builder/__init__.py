#!/usr/bin/env python
# -*- coding: UTF-8 -*-

__all__ = [
    'Builder',
]

from pathlib import Path
import shutil
import jinja2
import PIL.Image as Image

class TemplateLoader(jinja2.BaseLoader):
    def get_source(self, environment, path):
        path = Path(path)
        if not path.exists():
            raise jinja2.TemplateNotFound(str(path))
        with path.open("r", encoding="UTF-8") as file:
            source = file.read()
        return source, str(path), lambda: True

class Builder:
    def __init__(self, location, **global_variables):
        self.__location = Path(location)
        self.__environment = jinja2.Environment(loader=TemplateLoader())
        self.__environment.globals.update(global_variables)

    def clean(self):
        shutil.rmtree(str(self.__location), ignore_errors=True)

    def render(self, pattern, **variables):
        for template_path in list(Path().glob(pattern)):
            if self.__location in template_path.parents:
                continue

            template = self.__environment.get_template(str(template_path))
            result = template.render(**variables)

            result_path = self.__location / template_path
            if not result_path.parent.exists():
                result_path.parent.mkdir(parents=True)
            with result_path.open("w", encoding="UTF-8") as result_file:
                result_file.write(result)

    def copy(self, pattern):
        for path in list(Path().glob(pattern)):
            if self.__location in path.parents:
                continue

            if not (self.__location / path).parent.exists():
                (self.__location / path).parent.mkdir(parents=True)
            shutil.copy(str(path), str(self.__location / path))

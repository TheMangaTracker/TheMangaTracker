# coding: UTF-8

__all__ = [
    'get_image_size',
]

from PIL import Image

def get_image_size(path):
    image = Image.open(str(path))
    size, vertical_size = image.size
    assert vertical_size == size
    return size


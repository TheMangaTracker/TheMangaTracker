'use strict';

export default function createEmptyDocument() {
    return new DOMParser().parseFromString('<!DOCTYPE html><html></html>', 'text/html');
}


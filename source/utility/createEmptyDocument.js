'use strict';

var createEmptyDocument;

define([], function() {
    createEmptyDocument = function() {
        return new DOMParser().parseFromString('<!DOCTYPE html><html></html>', 'text/html');
    };
});

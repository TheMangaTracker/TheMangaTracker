'use strict';

var createDocument;

define([], function() {
    createDocument = function(text) {
        return new DOMParser().parseFromString(text, 'text/html');
    };
});

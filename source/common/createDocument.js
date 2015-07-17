'use strict';

var createDocument = function(text) {
    return new DOMParser().parseFromString(text, 'text/html');
};

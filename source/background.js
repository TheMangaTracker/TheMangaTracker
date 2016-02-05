(function() {
    'use strict';

    var manifest = chrome.runtime.getManifest();

    chrome.browserAction.setTitle({ title: manifest.name });
    var get_icon_for = function(desired_size) {
        var max_size = undefined;
        for (var size in manifest.icons) {
            if (Number(size) == desired_size) {
                return manifest.icons[size];    
            }
            if (max_size === undefined || Number(size) > Number(max_size)) {
                max_size = size
            }
        }    
        return manifest.icons[max_size];
    };
    chrome.browserAction.setIcon({
        path: {
            '19': get_icon_for(19),
            '38': get_icon_for(38),
        }
    });
    chrome.browserAction.onClicked.addListener(function(_tab) {
        chrome.tabs.create({ url: chrome.extension.getURL('search.html') });
    });

})();

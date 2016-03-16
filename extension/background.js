'use strict';

modules.define(async (require) => {
    let manifest = chrome.runtime.getManifest();

    chrome.browserAction.setTitle({ title: manifest.name });
    function getIconFor(perfectSize) {
        let maxSize = undefined;
        for (let size in manifest.icons) {
            size = parseInt(size);
            if (size === perfectSize) {
                return manifest.icons[size];    
            }

            if (maxSize === undefined || size > maxSize) {
                maxSize = size
            }
        }    
        return manifest.icons[maxSize];
    };
    chrome.browserAction.setIcon({
        path: {
            '19': getIconFor(19),
            '38': getIconFor(38),
        }
    });
    chrome.browserAction.onClicked.addListener(tab => {
        chrome.tabs.create({ url: chrome.extension.getURL('search.html') });
    });
});

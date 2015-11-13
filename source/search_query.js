'use strict';

modules.define(async (require) => {
    let ng = await require('angular');

    let getSiteById = await require('/core/getSiteById.js');

    let languages = [];
    for (let [id, name] of await require('/utility/languages.js')) {
        languages.push({ id, name });
    }

    let sites = [];
    for (let id of await require('/core/siteIds.js')) {
        let site = await getSiteById(id);
        sites.push({
            id: await site.getId(),
            name: await site.getName(),
        });
    }

    function buildQueryString(query) {
        let pairs = [];
        for (let name in query) {
            let value = query[name];
            
            switch (name) {
              case 'siteIds':
              case 'languageIds':
                value = value.map(encodeURIComponent).join(',');
                break;
              default:
                value = encodeURIComponent(value);
            }

            if (value === '') {
                continue;
            }

            name = encodeURIComponent(name);
            pairs.push(name + '=' + value);
        }
        let string = pairs.join('&');
        if (string.length > 0) {
            string = '?' + string;
        }
        return string;
    }

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }]);

    page.run([
        '$rootScope',
       ( $rootScope ) => {
        $rootScope.sites = sites;
        $rootScope.languages = languages;
        $rootScope.buildQueryString = buildQueryString;
    }]);

    page.controller('page', $scope => {
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});


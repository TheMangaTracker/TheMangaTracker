'use strict';

var modules = (() => {
    let modules = new Map();

    let [getModule, setModule] = (() => {
        let resolves = new Map();

        function get(url) {
            if (!modules.has(url)) {
                modules.set(url, new Promise((resolve, reject) => {
                    resolves.set(url, resolve);
                }));
            }
            return modules.get(url);
        }

        function set(url, module) {
            if (resolves.has(url)) {
                let resolve = resolves.get(url); resolves.delete(url);
                resolve(module);
            } else {
                modules.set(url, Promise.resolve(module));
            }
        }

        return [get, set];
    })();

    let aliasIdUrls = new Map();
    let urlGlobalExports = new Map();

    function define(initialize) {
        let script = document.currentScript;
        let url = new URL(script.src, document.baseURI).href;

        function require(dependencyUrlOrAliasId) {
            let dependencyUrl;
            if (aliasIdUrls.has(dependencyUrlOrAliasId)) {
                let dependencyAliasId = dependencyUrlOrAliasId;
                dependencyUrl = aliasIdUrls.get(dependencyAliasId);
            } else {
                dependencyUrl = new URL(dependencyUrlOrAliasId, url).href;
            }

            let dependencyScript = (() => {
                let scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; ++i) {
                    let script = scripts[i];
                    if (script.src === dependencyUrl) {
                        return script;
                    }
                }
                return null;
            })();

            if (dependencyScript === null) {
                dependencyScript = document.createElement('script');
                script.parentElement.insertBefore(dependencyScript, script);
                if (urlGlobalExports.has(dependencyUrl)) {
                    dependencyScript.addEventListener('load', () => {
                        let globalExport = urlGlobalExports.get(dependencyUrl);
                        setModule(dependencyUrl, window[globalExport]);
                    });
                }
                dependencyScript.src = dependencyUrl;
            }

            return getModule(dependencyUrl);
        }

        setModule(url, initialize(require));
    }

    function setup(settings) {
        for (let url in settings) {
            let setting = settings[url];
            url = new URL(url, document.baseURI).href;
            if ('aliasId' in setting) {
                aliasIdUrls.set(setting.aliasId, url); 
            }
            if ('globalExport' in setting) {
                urlGlobalExports.set(url, setting.globalExport);
            }
        }
    }

    return {
        define,
        setup,
    };
})();

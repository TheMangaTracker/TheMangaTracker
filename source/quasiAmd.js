'use strict';

console.assert(define === undefined);

var define = (() => {
    function getCurrentScriptPath() {
        let anchor = document.createElement('a');
        anchor.href = document.currentScript.src;
        return anchor.pathname;
    }

    function isAbsolutePath(path) {
        return path.startsWith('/');
    }

    function joinPaths(...paths) {
        let path = paths.join('/').split('/');
        for (let i = 0; i < path.length; ) {
            if (i > 0 && i < path.length - 1 && path[i] === '' || path[i] === '.') {
                path.splice(i, 1);
            } else if (path[i] === '..') {
                --i;
                if (path[i] === '') {
                    throw new Error('Attempred to go above root.');
                }
                path.splice(i, 2);
            } else {
                ++i;
            }
        }
        if (path.length === 1) {
            path.push('');
        }
        path = path.join('/');
        return path;
    }

    let states = new Map();
    let modules = new Map();
    let listeners = new Map();

    let addListener = (path, listener) => {
        if (!listeners.has(path)) {
            listeners.set(path, []);
        }

        listeners.get(path).push(listener);
    };

    let notifyListeners = path => {
        if (listeners.has(path)) {
            for (let listener of listeners.get(path)) {
                listener();
            }
            listeners.delete(path);
        }
    };

    function define(paths, factory) {
        console.assert(paths[0] === 'exports');
        paths.shift();

        let exportsViaModule = (paths.length > 0 && paths[0] === 'module');
        if (exportsViaModule) {
            paths.shift();
        }

        let thisPath = getCurrentScriptPath();

        states.set(thisPath, 'initializing');
       
        let importCount = 0;
        let imports = [];

        let initialize = () => {
            let thisModule = {};
            
            if (exportsViaModule) {
                imports.unshift({});
            }
            imports.unshift(thisModule);

            factory(...imports);

            if (exportsViaModule) {
                console.assert(Object.keys(thisModule).length === 0);
                thisModule = imports[1].exports;
            }

            modules.set(thisPath, thisModule);
            states.set(thisPath, 'ready');
            notifyListeners(thisPath);
        };

        if (paths.length === 0) {
            initialize();
            return;
        }

        let noteLoaded = (i, module) => {
            imports[i] = module; ++importCount;
            if (importCount === paths.length) {
                initialize();
            }
        };

        for (let i = 0; i < paths.length; ++i) {
            let path = paths[i];
            if (!isAbsolutePath(path)) {
                path = joinPaths(thisPath, '..', path);
            }

            if (states.get(path) === 'ready') {
                noteLoaded(i, modules.get(path));
                continue;
            }

            addListener(path, () => {
                noteLoaded(i, modules.get(path));
            });

            if (states.get(path) === undefined) {
                let script = document.createElement('script');
                script.onload = () => {
                    if (states.get(path) === 'required') {
                        modules.set(path, null);
                        states.set(path, 'ready');
                        notifyListeners(path);
                    }
                };
                script.src = path;
                document.currentScript.parentElement.insertBefore(script, document.currentScript);
                states.set(path, 'required');
                continue;
            }
        }
    }

    return define;
})();

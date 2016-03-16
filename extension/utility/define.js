'use strict';

var define = (() => {
    let [getModule, setModule] = (() => {
        let modules = new Map();
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
                let resolve = resolves.get(url);
                resolves.delete(url);
                resolve(module);
            } else {
                modules.set(url, Promise.resolve(module));
            }
        }

        return [get, set];
    })();

    let virtuals = new Map();
    let shims = new Map();

    function define(initialize) {
        let selfScript = document.currentScript;
        let self = new URL(selfScript.src, document.baseURI).href;

        function require(dependency) {
            dependency = new URL(dependency, self).href;
            if (virtuals.has(dependency)) {
                dependency = virtuals.get(dependency);
            }

            let dependencyScript = (() => {
                let scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; ++i) {
                    let script = scripts[i];
                    if (script.src === dependency) {
                        return script;
                    }
                }

                return null;
            })();

            if (dependencyScript === null) {
                dependencyScript = document.createElement('script');
                selfScript.parentElement.insertBefore(dependencyScript, selfScript);
                if (shims.has(dependency)) {
                    dependencyScript.addEventListener('load', () => {
                        let name = shims.get(dependency);
                        setModule(dependency, window[name]);
                    });
                }

                dependencyScript.src = dependency;
            }

            return getModule(dependency);
        }

        setModule(self, initialize(require));
    }

    define.setup = function setup(settings) {
        let self = new URL(document.currentScript.src, document.baseURI).href;

        for (let virtual in settings.virtual || {}) {
            let target = settings.virtual[virtual];
            virtual = new URL(virtual, self).href;
            target = new URL(target, self).href;
            virtuals.set(virtual, target);
        }

        for (let subject in settings.shim || {}) {
            let name = settings.shim[subject];
            subject = new URL(subject, self).href;
            shims.set(subject, name);
        }

      virtual_loop:
        for (;;) {
            for (let [virtual, target] of virtuals) {
                if (virtuals.has(target)) {
                    virtuals.set(virtual, virtuals.get(target));
                    continue virtual_loop;
                }
            }

            break virtual_loop;
        }

      shim_loop:
        for (;;) {
            for (let [subject, name] of shims) {
                if (virtuals.has(subject)) {
                    shims.delete(subject);
                    shims.set(virtuals.get(subject), name);
                    continue shim_loop;
                }
            }

            break shim_loop;
        }

        define.setup = function setup() {
            throw new Error('define.setup() called twice.');
        };
    };

    return define;
})();

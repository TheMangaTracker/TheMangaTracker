'use strict';

modules.define(async (require) => {
    let tag = 'asyncCall';

    let nextUnusedId = 0;
    let recycledIds = new Set();
    let callables = new Map();

    window.addEventListener('message', ({ source, data }) => {
        if (source !== window) {
            return;    
        }    
       
        if (data.tag !== tag) {
            return; 
        }
        
        let callable = callables.get(data.id);

        callables.delete(data.id);
        recycledIds.add(data.id);
        
        callable();
    });

    function asyncCall(callable, ...args) {
        let id;
        if (recycledIds.size === 0) {
            id = nextUnusedId;
            ++nextUnusedId;
        } else {
            for (let recycledId of recycledIds) {
                id = recycledId;
                recycledIds.delete(recycledId);
                break;
            }   
        }

        callables.set(id, () => callable(...args));

        window.postMessage({ tag, id }, '*');
    }

    return asyncCall;
});

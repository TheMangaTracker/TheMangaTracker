let nextId = 0;
let callables = new Map();

window.addEventListener('message', ({ source, data: { tag, id } }) => {
    if (source !== window) {
        return;    
    }    
   
    if (tag != 'asyncCall') {
        return; 
    }
    
    let callable = callables.get(id);
    callables.delete(id);
    
    callable();
});

export default function asyncCall(callable) {
    let id = nextId++;

    callables.set(id, callable);

    window.postMessage({ tag: 'asyncCall', id }, '*');
}

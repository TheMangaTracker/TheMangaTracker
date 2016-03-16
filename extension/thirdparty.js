define.setup({
    virtual: {
        {{#modules}}
            ['/thirdparty/{{{id}}}.js']: '{{{uri}}}',
        {{/modules}}
    },
    shim: {
        {{#modules}}
            ['/thirdparty/{{{id}}}.js']: '{{{id}}}',
        {{/modules}}
    },
});

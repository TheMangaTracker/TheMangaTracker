require.config({
    baseUrl: '/',
    paths: {
        {{#thirdparty}}
            '{{{name}}}': '{{{url}}}',
        {{/thirdparty}}
    },
    shim: {
        'angular': {
            exports: 'angular',
        },
    },
});

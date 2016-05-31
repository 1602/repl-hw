'use strict';

const utils = require('./utils');
const vm = require('vm');

module.exports = function() {

    return {
        run
    };

    function run(code, params) {
        const filename = params.filename;
        const displayErrors = params.displayErrors;

        return Promise.resolve()
            .then(() => vm.createScript(code, {filename, displayErrors}))
            .then(script => runScript(script, {displayErrors}))
            .then(out => {
                return Promise.resolve(out.result)
                    .then(value => out.value = value)
                    .catch(err => out.error = err)
                    .then(() => out);
            })
            .catch(e => ({error: e, viaPromise: false}));

        function runScript(script) {
            const result = script.runInThisContext({displayErrors});
            return {
                viaPromise: utils.isPromise(result),
                result,
                value: undefined,
                error: null
            };
        }
    }

};

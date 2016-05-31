'use strict';

const history = [];

module.exports = function() {
    return {
        log
    };
};

function log(code, result, context) {
    history.unshift({code, result, date: new Date()});

    if (history.length > 10) {
        history.pop();
    }

    if (!result.error) {
        context.$ = result.value;
    }

    history.forEach((item, index) => {
        context['$' + index] = item.result.error || item.result.value;
    });
}

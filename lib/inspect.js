'use strict';

module.exports = function(colorscheme) {

    const regexp = colorscheme.regexp;
    const string = colorscheme.string;
    const number = colorscheme.number;
    const comment = colorscheme.comment;
    const variable = colorscheme.variable;

    return {
        inspect,
        callback
    };

    function inspect(obj) {
        if (obj instanceof Array) {
            return obj.length === 0 ? '[]' : '[' + inspect(obj[0]) + ']' + '{' + obj.length + '}';
        } else if (obj instanceof Object) {
            if (obj instanceof Error) {
                return obj.constructor.name + ': ' + obj.message;
            } else if (obj instanceof RegExp) {
                return obj.constructor.name + ': ' + regexp(obj.toString());
            } else if (obj.constructor && obj.constructor.modelName) {
                return obj.constructor.modelName + '(id: ' + (obj.id || '?') + ')';
            } else if (obj.constructor && obj.constructor.name) {
                return obj.constructor.name + '(' + (Object.keys(obj)) + ')';
            }
        } else {
            if ('string' === typeof obj) {
                return string(JSON.stringify(obj));
            }
            if ('number' === typeof obj) {
                return number(String(obj));
            }
            return JSON.stringify(obj);
        }
    }

    function callback() {
        const l = arguments.length;
        let message = comment('Callback called with ') + number(String(l)) +
            comment(' argument' + (l === 1 ? '' : 's') + (l > 0 ? ':\n' : ''));

        for (let i = 0; i < 10; i++) {
            if (i < arguments.length) {
                context['_' + i] = arguments[i];
                message += variable('let _' + i) + comment(' = ') + inspect(arguments[i]) + '\n';
            } else if (context.hasOwnProperty('_' + i)) {
                delete context['_' + i];
            }
        }
        console.log(message);
    }

};


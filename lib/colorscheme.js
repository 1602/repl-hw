'use strict';

const clc = require('cli-color');

module.exports = function(config) {
    config = Object.assign({
        regexp: 128,
        string: 202,
        number: 38,
        variable: {
            color: 238,
            bold: true
        },
        comment: 238,
        highlight: {
            bold: true
        },
    }, config);

    return Object.keys(config).reduce(
        (res, key) => makeColor(res, key, config[key]),
        {}
    );

    function makeColor(scheme, key, conf) {
        if ('number' === typeof conf) {
            scheme[key] = clc.xterm(conf);
        }

        if ('object' === typeof conf && conf) {
            let fmt;

            if (conf.bold) {
                fmt = (fmt || clc).bold;
            }

            if (conf.color) {
                fmt = (fmt || clc).xterm(conf.color);
            }

            scheme[key] = fmt;

        }

        return scheme;
    }

};


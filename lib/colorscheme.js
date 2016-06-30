'use strict';

const colors = require('ansi-256-colors');

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
            scheme[key] = function(str) {
                return colors.fg.codes[conf] + str + colors.reset;
            };
        }

        if ('object' === typeof conf && conf) {
            let fmt = '';

            if (conf.bold) {
                fmt += colors.fg.bright[7];
            }

            if (conf.color) {
                fmt += colors.fg.codes[conf.color];
            }

            scheme[key] = function(str) {
                return fmt + str + colors.reset;
            };

        }

        return scheme;
    }

};


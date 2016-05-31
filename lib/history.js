'use strict';

const utils = require('./utils');
// const os = require('os');
const path = require('path');
const fs = require('fs');
const historyFile = path.join(process.env.HOME, '.node_repl_history');
// const historyFile = path.join(os.tmpdir(), '.repl_history');

module.exports = function() {

    return loadHistory()
        .then(records => ({
            records,
            appendLine,
            saveHistory,
        }));

    function appendLine(line) {
        fs.appendFile(historyFile, '\n' + line);
    }

    function loadHistory() {
        return utils.promisify(fs, 'readFile', historyFile, {encoding: 'utf8'})
            .then(data => data.split('\n').slice(1).reverse());
    }

    function saveHistory(records) {
        const data = '\n' + records.reverse().join('\n');
        return utils.promisify(fs, 'writeFile', historyFile, data);
    }

};


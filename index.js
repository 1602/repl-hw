'use strict';

const createReplServer = require('./lib');

// process.on('SIGINT', function() {
//     createReplServer();
// });

exports.start = createReplServer;

if (!module.parent) {
    exports.start();
}


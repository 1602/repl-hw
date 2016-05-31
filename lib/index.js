
const repl = require('repl');
const colorscheme = require('./colorscheme')();
const logger = require('./inspect')(colorscheme);
const defineCommands = require('./commands');
const evalCommand = require('./eval.js')();
const recentCommands = require('./recent-commands')();
const extendReadline = require('./extend-readline');

module.exports = createReplServer;

function createReplServer(context) {

    const repl = startRepl();

    defineCommands(repl);
    extendContext(repl, context);
    extendReadline(repl);

    return repl;

}

function extendContext(repl, context) {
    repl.context.c = logger.callback;
    Object.assign(repl.context, context);
}

function startRepl() {

    return repl.start({
        prompt: '> ',
        useColors: true,
        useGlobal: true,
        eval: function(code, context, filename, callback) {
            evalCommand.run(code, {
                filename,
                displayErrors: false
            })
                .then(result => {
                    if (result.viaPromise) {
                        if (result.error) {
                            console.log(
                                colorscheme.comment('Promise rejected into'),
                                colorscheme.variable('$0'),
                                colorscheme.comment('='),
                                logger.inspect(result.error));
                        } else {
                            console.log(
                                colorscheme.comment('Promise resolved into'),
                                colorscheme.variable('$'),
                                colorscheme.comment('='),
                                logger.inspect(result.value));
                        }
                        recentCommands.log(code, result, context);
                    }
                    if (result.error) {
                        console.log(highlight(result.error.stack));
                        return callback();
                    }
                    if (result.viaPromise) {
                        return callback();
                    }
                    callback(null, result.value);
                })
                .catch(e => console.error('caught error', e.stack));
        }
    });

}

function highlight(stackTrace) {
    return stackTrace.split('\n')
        .map(line => {
            return line
                .replace(/\s+at/, s => colorscheme.comment(s))
                .replace(/([\/\(])(.*):(\d+):(\d+)\)?/, (s, lead, fn, line, col) => {
                    if (lead === '/') {
                        fn = '/' + fn;
                    }
                    if (fn.indexOf(process.cwd()) === 0) {
                        fn = '.' + fn.substr(process.cwd().length);
                    }
                    return `(${colorscheme.highlight(fn)}:${line}${colorscheme.comment(':' + col)})`;
                });
        })
        .join('\n');
}


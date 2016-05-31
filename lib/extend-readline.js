'use strict';

const loadHistory = require('./history');
const colorscheme = require('./colorscheme')();

module.exports = function(repl) {

    return loadHistory()
        .then(history => {
            const userInputHandler = createUserInputHandler(repl, history);

            // console.log(history.records);
            repl.rli.history = history.records;
            repl.rli.on('line', line => history.appendLine(line));
            repl.on('exit', () => history.saveHistory(repl.rli.history)
                .catch(err => {
                    console.log('Could not write history file', err);
                })
                .then(() => process.exit(0)));
            repl.rli.input.on('keypress', (s, key) => {
                if (!key) return;
                userInputHandler.handleInput(s, key);
            });
        });

};

function createUserInputHandler(repl, history) {

    history;

    let historySearchMode = false;
    let historyLookupMode = false;
    let historySearchString = '';
    let pos = 0;
    let prevLine = '';

    const historySearchPrompt = '(history-search)`%`:';
    const ttySwapper = ttySwap(repl.rli);

    return {
        handleInput
    };

    function handleInput(s, key) {

        const keyInterpreter = interpretKey(key);

        if (historySearchMode) {
            if (keyInterpreter.isApply()) {
                return applySearch();
            }
            if (keyInterpreter.isCancel()) {
                return cancelSearch();
            }
            return;
        }

        if (historyLookupMode) {
            if (keyInterpreter.isApply()) {
                historyLookupMode = false;
                return applySearch();
            }
            if (keyInterpreter.isCtrlC()) {
                historyLookupMode = false;
                return cancelSearch();
            }
            return;
        }

        if (keyInterpreter.isStartSearch()) {
            return startSearch();
        }

        if (keyInterpreter.isStartLookup()) {
            return startLookup();
        }

        prevLine = repl.rli.line;

    }

    function interpretKey(key) {
        const keyName = key.name;

        return {

            isApply() {
                return keyName === 'return' || keyName === 'enter' ||
                    keyName === 'linefeed';
            },

            isReturn() {
                return keyName === 'return' || keyName === 'enter' ||
                    keyName === 'linefeed';
            },

            isCtrlC() {
                return keyName === 'c' && key.ctrl;
            },

            isCtrlE() {
                return keyName === 'e' && key.ctrl;
            },

            isCancel() {
                return keyName === 'c' && key.ctrl ||
                    keyName === 'left' || keyName === 'right';
            },
            
            isStartSearch() {
                return key.ctrl && keyName === 'r';
            },

            isStartLookup() {
                return keyName === 'up';
            },

            isLookBackward() {
                return keyName === 'up';
            },

            isLookForward() {
                return keyName === 'down';
            },

            isRight() {
                return keyName === 'right';
            },

            isBackspace() {
                return keyName === 'backspace';
            },

            isLeft() {
                return keyName === 'left';
            },
        };
    }

    function startSearch() {
        historySearchMode = true;

        repl.rli.line = '';

        repl.setPrompt(historySearchPrompt);

        ttySwapper.replace(ttyWriteHistory);

        historySearchString = repl.rli.line;
        refreshHistoryPrompt();
    }

    function startLookup() {
        if (!prevLine) {
            return;
        }
        historyLookupMode = true;

        let searchIndex = -1;
        pos = 0;
        repl.rli.write(null, {ctrl: true, name: 'u'});
        repl.rli.write(prevLine);
        ttySwapper.replace(lookup);

        lookup('', {name: 'up'});
        
        function lookup(s, key) {
            // console.log('intercepted', key && key.name);
            if (!key && s) {
                key = {
                    name: s
                };
            }
            const keyInterpreter = interpretKey(key);
            if (keyInterpreter.isCtrlC()) {
                ttySwapper.restore();
                repl.rli.write(null, {ctrl: true, name: 'd'});
                return;
            }
            pos = repl.rli.cursor;

            let result;
            if (keyInterpreter.isLookBackward()) {
                result = performLookup(1);
            } else if (keyInterpreter.isLookForward()) {
                result = performLookup(-1);
            } else if (keyInterpreter.isLeft()) {
                // console.log('-pos=', pos);
                pos -= 1;
                searchIndex = -1;
                repl.rli.cursor = pos;
                result = prevLine;
            } else if (keyInterpreter.isCtrlE()) {
                pos = prevLine.length;
                repl.rli.cursor = pos;
                result = prevLine;
            } else if (keyInterpreter.isRight()) {
                // console.log('+pos=', pos);
                pos += 1;
                searchIndex = -1;
                repl.rli.cursor = pos;
                result = prevLine;
            } else if (keyInterpreter.isBackspace()) {
                result = prevLine.substr(0, pos - 1) +
                    prevLine.substr(pos);
                pos -= 1;
                result = performLookup(0);
                if (!result) {
                    result = prevLine.substr(0, pos);
                }
                repl.rli.cursor = pos;
            } else if (keyInterpreter.isReturn()) {
                pos = prevLine.length;
                repl.rli.cursor = pos;
                result = prevLine;
            } else if (s) {
                prevLine = prevLine.substr(0, pos) + s +
                    prevLine.substr(pos);
                pos += 1;
                result = performLookup(0);
                if (!result) {
                    result = prevLine.substr(0, pos);
                }
                repl.rli.cursor = pos;
            } else {
                console.log(key);
            }

            if (result) {
                // prevLine = result;
                // repl.rli.write(null, {ctrl: true, name: 'u'});
                // repl.rli.write(result);
                repl.rli.line = result.substr(0, pos) +
                    colorscheme.comment(result.substr(pos));
                const count = resultsCount();
                if (count > 1) {
                    repl.rli.line += ' ' + colorscheme.highlight('[' +
                        (searchIndex + 1) +
                        '/' + count + ']');
                }
                prevLine = result;
                repl.displayPrompt(true);
                return;
            }

            function search(line) {
                return line.indexOf(prevLine.substr(0, pos)) === 0;
            }

            function resultsCount() {
                return remDups(repl.rli.history.filter(search)).length;
            }

            function performLookup(incr) {
                const results = remDups(repl.rli.history.filter(search));
                const len = results.length;
                searchIndex += incr;
                if (searchIndex < 0) {
                    searchIndex = 0;
                } else if (searchIndex >= len) {
                    searchIndex = len - 1;
                }
                return results[searchIndex];
            }

            function remDups(arr) {
                let prev;
                const res = [];
                arr.forEach(item => {
                    if (item !== prev) {
                        res.push(item);
                        prev = item;
                    }
                });
                return res;
            }
        }
    }

    function ttyWriteHistory(s, key) {
        if (!key) {
            historySearchString += s;
            refreshHistoryPrompt();
            return;
        }

        if (key.name.length === 1) {
            historySearchString += key.sequence;
            refreshHistoryPrompt();
            return;
        }

        if (key.name === 'backspace') {
            historySearchString = historySearchString.substr(0, historySearchString.length - 1);
            refreshHistoryPrompt();
            return;
        }

        if (key.name === 'space') {
            historySearchString += ' ';
            refreshHistoryPrompt();
            return;
        }
    }

    function refreshHistoryPrompt() {
        repl.setPrompt(historySearchPrompt.split('%').join(historySearchString));
        prevLine = matchHistory(historySearchString);
        repl.rli.line = prevLine;
        repl.displayPrompt();
    }

    function matchHistory(match) {
        if (match.length < 1) return '';
        // Search through the repl.rli.history array for a match
        for (let i = 0; i < repl.rli.history.length; ++i) {
            if (repl.rli.history[i].match(match.replace(/\(/g, '\\('))) {
                repl.rli.historyIndex = i;
                return repl.rli.history[i];
            }
        }
        return '';
    }

    function applySearch() {
        handleHistory(true);
    }

    function cancelSearch(s, key) {
        handleHistory(false, s, key);
    }

    function handleHistory(run, s, key) {
        historySearchMode = false;
        repl.setPrompt('> ');
        repl.rli.line = prevLine;
        ttySwapper.restore(s, key);
        if (run) {
            console.log('');
            const cmd = repl.rli.line;
            // if (!s) {
                // console.log(cmd);
            // }
            repl.rli.line = '';
            repl.rli._onLine(cmd);
        }
        repl.displayPrompt(true);
        historySearchString = '';
    }

    function ttySwap(rli) {

        const initialTTY = rli._ttyWrite;

        return Object.freeze({
            restore,
            replace
        });

        function restore(s, key) {
            rli._ttyWrite = initialTTY;
            if (s || key) {
                rli._ttyWrite(s, key);
                repl.displayPrompt(true);
            }
        }

        function replace(fn) {
            rli._ttyWrite = fn;
        }

    }

}


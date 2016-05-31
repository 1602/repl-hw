
module.exports = defineCommands;

function defineCommands(repl) {
    repl.defineCommand('history', {
        help: 'Show history of latest commands',
        action: function() {
            console.log(history); 
        }
    });
}


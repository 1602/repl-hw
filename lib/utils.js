module.exports = {
    promisify,
    isPromise
};

function promisify(obj, key) {
    const args = arguments;
    const fn = obj[key];

    return new Promise((resolve, reject) => fn.apply(obj, pass(resolve, reject)));

    function pass(resolve, reject) {
        const res = [].slice.call(args, 2).concat((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
        return res;
    }

}

function isPromise(result) {
    return result instanceof Promise ||
        result && result.constructor && result.constructor.name === 'Promise' &&
        'function' === typeof result.then;
}


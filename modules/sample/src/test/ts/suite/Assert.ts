let eq = function (a: any, b: any, label?: string) {
    if (a !== b) {
        throw new Error('a is not b');
    }
};

export {
    eq
};

declare let window: any;

let register = function (name: string, test: (success: Function, failure: Function) => void) {
    if (typeof window.__tests === 'undefined') {
        window.__tests = [];
    }

    window.__tests.push({ name: name, test: test });
};

let asynctest = function (name: string, test: (success: Function, failure: Function) => void) {
    register(name, test);
};

let test = function (name: string, test: () => void) {
    register(name, function (success: Function, failure: Function) {
        test();
        success();
    });
};

export {
    test,
    asynctest
};

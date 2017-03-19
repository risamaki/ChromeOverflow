chrome.storage.sync.set({"chromeOverflow": []}, function (items) {});

var errors = [];

document.addEventListener('WindowError', function (e) {
    // STACK and toString are the only useful ones.
    // toString = name + message
    // stack = toString + stack_stuff
    var error = e.detail;

    //console.log('stack: ', e.detail.stack);
    //console.log('toString: ', e.detail.toString);
    //console.log('is404: ', e.detail.is404);
    //console.log('src: ', e.detail.src);

    if (errors.length > 0) {
        // check that previous error not the same as current error
        var previousError = errors[errors.length - 1];
        if ((error.is404 && previousError.is404 && error.src === previousError.src) ||
            (!error.is404 && !previousError.is404 && error.stack === previousError.stack)) {
            return;
        }
    }
    errors.push(error);
    // Save it using the Chrome extension storage API.
    chrome.storage.sync.get("chromeOverflow", function (items) {
        var newResult = [];
        if (!chrome.runtime.error) {
            newResult = items.chromeOverflow;
        }
        newResult.push(error);
        chrome.storage.sync.set({"chromeOverflow": newResult}, function () {});
    });
});

// Capture event in webpage context as error event object is null in Content Script context.
// https://stackoverflow.com/questions/20323600/how-to-get-errors-stack-trace-in-chrome-extension-content-script/20399910#20399910
function injectErrorListener() {

    // Catches uncaught errors
    window.addEventListener('error', function (e) {
        // e has other properties https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
        var error = {
            stack: e.error.stack,
            toString: e.error.toString()
        };
        document.dispatchEvent(new CustomEvent('WindowError', {detail: error}));
    });

    // Catches 404 errors
    window.addEventListener('error', function (e) {
        var src = e.target.src || e.target.href;
        var baseUrl = e.target && e.target.baseURI;
        if (src && baseUrl && src != baseUrl) {
            var error = {
                is404: true,
                src: src
            };
            document.dispatchEvent(new CustomEvent('WindowError', {detail: error}));
        }
    }, true); // true to use this eventListener (capture phase) instead of bubbling up
}

//Inject code
var script = document.createElement('script');
script.textContent = '(' + injectErrorListener + '())';
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

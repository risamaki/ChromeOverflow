document.addEventListener('WindowError', function (e) {
	var error = e.detail;
	// STACK and toString are the only useful ones.
	// toString = name + message
	// stack = toString + stack_stuff

	chrome.runtime.sendMessage({
		message: error
	});
});

// Capture event in webpage context as error event object is null in Content Script context.
// https://stackoverflow.com/questions/20323600/how-to-get-errors-stack-trace-in-chrome-extension-content-script/20399910#20399910
function injectErrorListener() {
	// handle console.error()
	window.console.error = function () {
		var e = new Error();
		var stack = e.stack.split("\n");
		var callSrc = (stack.length > 3 && (/^.*?\((.*?):(\d+):(\d+)/.exec(stack[3]) || /(\w+:\/\/.*?):(\d+):(\d+)/.exec(stack[3]))) || [null, null, null, null];
		delete stack[1];
		delete stack[2];
		var error = {
			stack: stack.join("\n"),
			toString: arguments[0] + arguments[1],
			src: callSrc[1],
			line: callSrc[2],
			col: callSrc[3]
		};
		document.dispatchEvent(new CustomEvent('WindowError', {detail: error}));
	};

	// Catches uncaught errors
	window.addEventListener('error', function (e) {
		// e has other properties https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
		var error = {
			stack: e.error.stack,
			toString: e.message || e.error.toString(),
			name: e.error.name,
			src: e.filename,
			line: e.lineno,
			col: e.colno
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

var script = document.createElement('script');
script.textContent = '(' + injectErrorListener + '())';
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);
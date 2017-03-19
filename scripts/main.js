	var errors = [];

	document.addEventListener('WindowError', function(e) {
		// STACK and toString are the only useful ones.
		// toString = name + message
		// stack = toString + stack_stuff
		var error = e.detail;

		console.log('stack: ', e.detail.stack);
		console.log('toString: ', e.detail.toString);
		console.log('is404: ', e.detail.is404);
		console.log('url: ', e.detail.src);

		errors.push(error);
	});

	// Capture event in webpage context as error event object is null in Content Script context.
	// https://stackoverflow.com/questions/20323600/how-to-get-errors-stack-trace-in-chrome-extension-content-script/20399910#20399910
	function injectErrorListener() {

		// Catches uncaught errors
		window.addEventListener('error', function(e) {
			// e has other properties https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
			var error = {
				//columnNumber: e.error.columnNumber,
				//fileName: e.error.fileName,
				//lineNumber: e.error.lineNumber,
				//message: e.error.message,
				//name: e.error.name,
				stack: e.error.stack,
				toString: e.error.toString()
			};

			document.dispatchEvent(new CustomEvent('WindowError', { detail: error}));
		});

		// Catches 404 errors
		window.addEventListener('error', function(e) {
			var src = e.target.src || e.target.href;
			var baseUrl = e.target && e.target.baseURI;
			if(src && baseUrl && src != baseUrl) {
				var error = {
					is404: true,
					src: src
				};
				document.dispatchEvent(new CustomEvent('WindowError', { detail: error}));
			}
		}, true); // true to use this eventListener (capture phase) instead of bubbling up
	}

	//Inject code
	var script = document.createElement('script');
	script.textContent = '(' + injectErrorListener + '())';
	(document.head || document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);



	/** Stack overflow - get results **/

	var url = "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&tagged=JavaScript&site=stackoverflow&accepted=True&filter=!Su916jaHmcZfZh5aMc&key=3siWGPWi0UesJ1Q2D6RMgg((";
	function search(query, page, callback) {
		if (typeof query !== "string") throw new Error("Pass in a string!");
		var requestUrl = url + "&title=" + encodeURIComponent(query) +
			"&page=" + page + "&pagesize=1";
		var ret = {};
		$.get(requestUrl).done(function (data) {
			processResults(data, function (val) {
				callback(val);
			});
		}).fail(function (XMLHttpRequest) {
			ret.error = "Couldn't access StackExchange (Code " + XMLHttpRequest.status + ")";
			ret.results = [];
			ret.resultsLength = 0;
			ret.hasMore = false;
			callback(ret);
		});
	}

	// take object retrieve only
	function processResults(data, callback) {
		var ret = {
			hasMore: false,
			results: []
		};
		if (data.has_more) {
			ret.hasMore = true;
		}
		var promises = [];
		var answerURLParts = [
			"https://api.stackexchange.com/2.2/answers/",
			"?&site=stackoverflow&filter=!SWJ_BpAceOSdpTaUxQ&key=3siWGPWi0UesJ1Q2D6RMgg(("
		];
		data.items.forEach(function (item) {
			var answerURL = answerURLParts[0] + item.accepted_answer_id + answerURLParts[1];
			promises.push(ignoreRejects($.get(answerURL), item));
		});
		Promise.all(promises).then(function (r) {
			r = r.filter(function (items) {
				return items.status === "resolved";
			});
			r.forEach(function (result) {
				ret.results.push({
					questionTitle: result.questionData.title,
					questionURL: "stackoverflow.com/q/" + result.questionData.question_id,
					answerURL: "stackoverflow.com/a/" + result.answerData.items[0].answer_id,
					answer_md: result.answerData.items[0].body_markdown
				});
			});
			ret.resultsLength = ret.results.length;
			callback(ret);
		});
	}

	function ignoreRejects(promise, item) {
		return promise.then(function (v) {
			return {answerData: v, questionData: item, status: "resolved"}
		}, function (e) {
			return {e: e, status: "rejected"}
		});
	}

	var hasMore = false;
	var questionTitle, questionURL, answerURL, answerMD = "";
	var answerLength = 0;

	search("javascript", 1, function (val) {
		// console.log(JSON.stringify(val));
		hasMore = val.hasMore;
		answerLength = val.resultsLength;
		for (var i = 0; i < answerLength; i++) {
			var queryRes = val.results[i];
			questionTitle = queryRes.questionTitle;
			questionURL = queryRes.questionURL;
			answerURL = queryRes.answerURL;
			answerMD = queryRes.answer_md;
			var resObject = {
				qTtl: questionTitle,
				qURL: questionURL,
				aURL: answerURL,
				aMD:  answerMD
			};
			// Todo: create HTML element with the above params?
		}

		// console.log("hm: " + hasMore);
		// console.log("al: " + answerLength);
		// console.log("qt: " + questionTitle);
		// console.log("qu: " + questionURL);
		// console.log("au: " + answerURL);
		// console.log("am: " + answerMD);
	});
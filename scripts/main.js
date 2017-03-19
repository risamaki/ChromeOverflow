function injectErrorListener() {
	window.addEventListener('error', function(e) {
		// e has other properties https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
		var error = {
			columnNumber: e.error.columnNumber,
			fileName: e.error.fileName,
			lineNumber: e.error.lineNumber,
			message: e.error.message,
			name: e.error.name,
			stack: e.error.stack,
			toString: e.error.toString()
		};

		document.dispatchEvent(new CustomEvent('WindowError', { detail: error}));
	});
}

document.addEventListener('WindowError', function(e) {
	// STACK is the only useful one.
	// toString = name + message
	// stack = toString + stack_stuff
	console.log('columnNumber: ', e.detail.columnNumber);
	console.log('fileName: ', e.detail.fileName);
	console.log('lineNumber: ', e.detail.lineNumber);
	console.log('message: ', e.detail.message);
	console.log('name: ', e.detail.name);
	console.log('stack: ', e.detail.stack);
	console.log('toString: ', e.detail.toString);
});

//Inject code
var script = document.createElement('script');
script.textContent = '(' + injectErrorListener + '())';
(document.head || document.documentElement).appendChild(script);
//script.parentNode.removeChild(script);

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

function mdToHtml(md) {
	var html;
	var converter = new showdown.Converter({
		headerLevelStart: 3,
		tables: true,
		disableForced4SpacesIndentedSublists: true
	});
	return converter.makeHtml(md);
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

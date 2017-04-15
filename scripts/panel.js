const CHROME_OVERFLOW = "chromeOverflow";

/** Stack overflow - get results **/

var url = "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&tagged=JavaScript&site=stackoverflow&accepted=True&filter=!Su916jaHmcZfZh5aMc&key=3siWGPWi0UesJ1Q2D6RMgg((";
function search(query, text, page, callback) {
	if (typeof query !== "string") throw new Error("Pass in a string!");
	var requestUrl = url + "&title=" + encodeURIComponent(query) +
			"&page=" + page + "&pagesize=5";
	var ret = {};
	$.get(requestUrl).done(function (data) {
		processResults(data, function (val) {
			callback(val, text);
		});
	}).fail(function (XMLHttpRequest) {
		ret.error = "Couldn't access StackExchange (Code " + XMLHttpRequest.status + ")";
		ret.results = [];
		ret.resultsLength = 0;
		ret.hasMore = false;
		callback(ret, text);
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
	var converter = new showdown.Converter({
		headerLevelStart: 3,
		tables: true,
		disableForced4SpacesIndentedSublists: true
	});
	return converter.makeHtml(md);
}

var indexCounter = 0;
function renderIssue(arrayQA, errorMsg, notCollapsible) {
	var panelElem = panel.document.body.querySelector("#panel");

	var panelGroup = document.createElement("div");
	panelGroup.className += "panel-group";

	var qa = document.createElement("div");
	qa.className += "panel panel-default";

	var panelHeading = document.createElement("div");
	panelHeading.className += "panel-heading";

	var panelTitle = document.createElement("h4");
	panelTitle.className += "panel-title";

	var errorMessage = document.createElement("a");
	errorMessage.setAttribute("data-toggle", "collapse");
	errorMessage.setAttribute("href", "#collapseQ" + indexCounter);
	errorMessage.setAttribute("data-target", '#collapseQ' + indexCounter);
	errorMessage.className += "collapsed";
	errorMessage.innerHTML = errorMsg;
	if (notCollapsible) {
		errorMessage.className += " not-collapsible";
	}

	panelElem.appendChild(panelGroup);
	panelGroup.appendChild(qa);
	qa.appendChild(panelHeading);
	panelHeading.appendChild(panelTitle);
	panelTitle.appendChild(errorMessage);

	if (!notCollapsible) {
		var answers = document.createElement("div");
		answers.setAttribute("id", "collapseQ" + indexCounter);
		answers.className += "panel-collapse collapse";
		qa.appendChild(answers);

		var panelBody = document.createElement("div");
		panelBody.className += "panel-body";
		answers.appendChild(panelBody);

		var panelAnswersGroup = document.createElement("div");
		panelAnswersGroup.className += "panel-group";
		panelBody.appendChild(panelAnswersGroup);

		if (arrayQA.resultsLength === 0) {
			var noResults = document.createElement("div");
			noResults.className += "panel panel-heading";
			noResults.innerHTML = "<i>No results on StackOverflow</i>";
			panelAnswersGroup.appendChild(noResults);
		}
		for (var i = 0; i < arrayQA.resultsLength; i++) {
			var answerPanel = document.createElement("div");
			answerPanel.className += "panel panel-default";
			panelAnswersGroup.appendChild(answerPanel);

			var answerPanelHeading = document.createElement("div");
			answerPanelHeading.className += "panel-heading";
			answerPanel.appendChild(answerPanelHeading);

			var answerTitle = document.createElement("a");
			answerTitle.setAttribute("data-toggle", "collapse");
			// MAX 99 answers for an error
			var answerIndex = i < 10 ? "0" + i : i;
			answerIndex = answerIndex.toString();
			answerTitle.setAttribute("href", "#collapseA" + indexCounter + answerIndex);
			answerTitle.setAttribute("data-target", '#collapseA' + indexCounter + answerIndex);
			answerTitle.className += "collapsed";
			answerTitle.innerHTML = arrayQA.results[i].questionTitle;
			answerPanelHeading.appendChild(answerTitle);

			var answerCollapseBody = document.createElement("div");
			answerCollapseBody.setAttribute("id", "collapseA" + indexCounter + answerIndex);
			answerCollapseBody.className += "panel-collapse collapse";
			answerPanel.appendChild(answerCollapseBody);

			var answerBody = document.createElement("div");
			answerBody.className += "panel-body";
			answerCollapseBody.appendChild(answerBody);

			var innerAnswer = document.createElement("div");
			innerAnswer.innerHTML = mdToHtml(arrayQA.results[i].answer_md);
			innerAnswer.className += "inner-answer";
			answerBody.appendChild(innerAnswer);

			var questionURL = document.createElement("a");
			questionURL.setAttribute("href", "http://" + arrayQA.results[i].questionURL);
			questionURL.innerHTML = "See this Question on Stack Overflow";
			questionURL.className += "question-url";
			answerBody.appendChild(questionURL);
		}
	}
	indexCounter++;
}

var hasMore = false;
var questionTitle, questionURL, answerURL, answerMD = "";
var answerLength = 0;

function searchHelper(error) {
	if (error.is404) {
		//TODO: Have renderer handle 404s differently
		renderIssue(null, "File not found: " + error.src, true);
	} else if (error.toString && error.stack) {
		var displayText = error.toString;
		if (error.src) {
			displayText += " (" + error.src;
			if (error.line) {
				displayText += ":" + error.line;
				if (error.col) {
					displayText += ":" + error.col;
				}
			}
			displayText += ")";
		}
		search(error.toString, displayText, 1, renderIssue);
	}
}

function clearErrors() {
	var panelElem = panel.document.body.querySelector("#panel");
	panelElem.innerHTML = "";
}
var url = "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&tagged=JavaScript&site=stackoverflow&accepted=True&filter=!Su916jaHmcZfZh5aMc"
function search(query, page, callback) {
	if (typeof query !== "string") throw new Error("Pass in a string!");
	let requestUrl = url + "&title=" + encodeURIComponent(query) +
	"&page=" + page + "pagesize=5";
	let ret = {};
	$.get(requestUrl).done(function(data) {
		processResults(data, function(val) {
			callback(val);
		}).fail(function(XMLHttpRequest) {
			ret.error = "Couldn't access StackExchange (Code " + XMLHttpRequest.status + ")";
			ret.results = [];
			ret.resultsLength = 0;
			ret.hasMore = false;
			callback(ret);
		});
	}).fail(function(XMLHttpRequest) {
		ret.error = "Couldn't access StackExchange (Code " + XMLHttpRequest.status + ")";
		ret.results = [];
		ret.resultsLength = 0;
		ret.hasMore = false;
		callback(ret);
	});
}

// take object retrieve only 
function processResults(data, callback) {
	let ret = {
		hasMore: false,
		results: []
	};
	if (data.has_more) {
		ret.hasMore = true;
	}
	var promises = [];
	let answerURLParts = [
		"https://api.stackexchange.com/2.2/answers/",
		"?&site=stackoverflow&filter=!SWJ_BpAceOSdpTaUxQ"
	];
	data.items.forEach(function(item) {
		var answerURL = answerURLParts[0] + item.accepted_answer_id + answerURLParts[1];
		promises.push(ignoreRejects($.get(answerURL), item));
	});
	Promise.all(promises).then(function(r) {
		r = r.filter(function(items) {
			return items.status === "resolved";
		});
		r.forEach(function(result) {
			ret.results.push({
				questionTitle: result.questionData.title,
				answerURL: "stackoverflow.com/a/" + result.answerData.answer_id,
				answer_md: result.answerData.body_markdown
			});
		});
		callback(ret);
	});
}

function ignoreRejects(promise, item) {
	return promise.then(function(v) {
		return {answerData: v, questionData: item, status: "resolved"}
	}, function(e) {
		return {e: e, status: "rejected"}
	});
}
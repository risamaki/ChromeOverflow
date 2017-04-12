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
    var html;
    var converter = new showdown.Converter({
        headerLevelStart: 3,
        tables: true,
        disableForced4SpacesIndentedSublists: true
    });
    return converter.makeHtml(md);
}

var indexCounter = 0;
function renderIssue(arrayQA, errorMsg) {
    var panelElem = panel.document.body.querySelector("#panel");
    var body = document.createElement("div");
    body.setAttribute("class", "panel-body");
    panelElem.appendChild(body);

    var errorMessage = document.createElement("a");
    errorMessage.setAttribute("data-toggle", "collapse");
    errorMessage.setAttribute("href", "#" + indexCounter);
    errorMessage.innerHTML = errorMsg;
    body.appendChild(errorMessage);

    var collapsible = document.createElement("div");
    collapsible.setAttribute("id", "" + indexCounter);
    collapsible.setAttribute("class", "panel-collapse");
    collapsible.setAttribute("class", "collapse");
    panelElem.appendChild(collapsible);

    var panelGroup = document.createElement("div");
    panelGroup.setAttribute("class", "panel-group");
    var qa = document.createElement("div");
    qa.setAttribute("class", "panel");
    qa.setAttribute("class", "panel-default");
    collapsible.appendChild(qa);
    if (arrayQA.resultsLength === 0) {
        var temp = document.createElement("div");
        temp.innerHTML = "<i>No results on StackOverflow</i>";
        temp.setAttribute("class", "panel-body");
        qa.appendChild(temp);            
    }
    for (var i = 0; i < arrayQA.resultsLength; i++) {
        var answerBody = document.createElement("div");
        answerBody.setAttribute("class", "panel");
        answerBody.setAttribute("class", "panel-header");
        qa.appendChild(answerBody);

        var answerRow = document.createElement("a");
        answerRow.setAttribute("data-toggle", "collapse");
        answerRow.setAttribute("href", "answer" + indexCounter + i);
        answerRow.innerHTML = arrayQA.results[i].questionTitle;
        answerRow.setAttribute("style", "padding-left: 15px");
        answerBody.appendChild(answerRow);

        var answerCollapsible = document.createElement("div");
        answerCollapsible.setAttribute("id", "answer" + indexCounter + i);
        answerCollapsible.setAttribute("class", "panel-collapse");
        answerCollapsible.setAttribute("class", "collapse");
        answerCollapsible.setAttribute("style", "padding-left: 15px");
        answerRow.addEventListener("click", function (_indexCounter, _i) {
            return function () {
                jQuery("#answer" + _indexCounter + _i).toggleClass("in");
            }
        }(indexCounter, i));
        qa.appendChild(answerCollapsible);

        var questionURL = document.createElement("a");
        questionURL.setAttribute("href", "http://" + arrayQA.results[i].questionURL);
        questionURL.innerHTML = "See this Question on Stack Overflow";
        answerCollapsible.appendChild(questionURL);

        var innerAnswer = document.createElement("div");
        innerAnswer.setAttribute("class", "panel-body");
        innerAnswer.innerHTML = mdToHtml(arrayQA.results[i].answer_md);
        answerCollapsible.appendChild(innerAnswer);
    }
    indexCounter++;
}

var hasMore = false;
var questionTitle, questionURL, answerURL, answerMD = "";
var answerLength = 0;

function searchHelper(error) {
    if (error.is404) {
        //TODO: Have renderer handle 404s differently
        search("404 File not found", "File not found: " + error.src, 1, renderIssue);
    } else if (error.name !== "ReferenceError" && error.toString && error.stack) {
        search(error.toString, error.stack, 1, renderIssue);
    } else if (error.name && error.stack) {
        search(error.name, error.stack, 1, renderIssue);
    }
}

function clearErrors() {
    var panelElem = panel.document.body.querySelector("#panel");
    panelElem.innerHTML = "";
}
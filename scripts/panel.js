const CHROME_OVERFLOW = "chromeOverflow";

/** Stack overflow - get results **/

var url = "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&tagged=JavaScript&site=stackoverflow&accepted=True&filter=!Su916jaHmcZfZh5aMc&key=3siWGPWi0UesJ1Q2D6RMgg((";
function search(query, page, callback) {
    if (typeof query !== "string") throw new Error("Pass in a string!");
    var requestUrl = url + "&title=" + encodeURIComponent(query) +
        "&page=" + page + "&pagesize=5";
    var ret = {};
    $.get(requestUrl).done(function (data) {
        processResults(data, function (val) {
            callback(val, query);
        });
    }).fail(function (XMLHttpRequest) {
        ret.error = "Couldn't access StackExchange (Code " + XMLHttpRequest.status + ")";
        ret.results = [];
        ret.resultsLength = 0;
        ret.hasMore = false;
        callback(ret, query);
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

function renderErr(errorMsg) {
    // Error collasping container items

    var ERRcard = document.createElement("div");
    ERRcard.setAttribute("class", "card");

    var ERRcardHeader = document.createElement("div");
    ERRcardHeader.setAttribute("class", "card-header");
    ERRcardHeader.setAttribute("role", "tab");
    ERRcardHeader.setAttribute("id", "errorHeading");

    var ERRh5 = document.createElement("h5");
    ERRh5.setAttribute("class", "mb-0");

    var ERRa = document.createElement("a")
    ERRa.setAttribute("class", "collapsed");
    ERRa.setAttribute("data-toggle", "collapse");
    ERRa.setAttribute("data-parent", "#errorAccordion");
    ERRa.setAttribute("aria-expanded", "false");
    ERRa.setAttribute("aria-controls", "collapseError");
    ERRa.setAttribute("href", "#collapseError");

    var ERRcollapse = document.createElement("div");
    ERRcollapse.setAttribute("id", "collapseError");
    ERRcollapse.setAttribute("class", "collapse");
    ERRcollapse.setAttribute("role", "tabpanel");
    ERRcollapse.setAttribute("aria-labelledby", "errorHeading");

    var ERRblock = document.createElement("div");
    ERRblock.setAttribute("class", "card-block");

    if (!errorMsg.is404) {

        ERRa.appendChild(errorMsg.stack);
        ERRh5.appendChild(ERRa);
        ERRcardHeader.appendChild(ERRh5);
        ERRcard.appendChild(ERRcardHeader);

        ERRcollapse.appendChild(ERRblock);
        ERRcard.appendChild(ERRcollapse);

        document.getElement("body").appendChild(ERRcard);

    } else {

        var errorText = "404:" + error.Msg
        ERRa.appendChild(errorText)
        ERRh5.appendChild(ERRa);
        ERRcardHeader.appendChild(ERRh5);
        ERRcard(appendChild(ERRcardHeader));

        ERRcollapse.appendChild(ERRblock);
        ERRcard.appendChild(ERRcollapse);

        document.getElement("body").appendChild(ERRcard);
    }

}

var indexCounter = 0;
function renderIssue(arrayQA, errorMsg) {
    var panel = document.querySelector("#panel");
    var body = document.createElement("div");
    body.setAttribute("class", "panel-body");
    panel.appendChild(body);

    var errorMessage = document.createElement("a");
    errorMessage.setAttribute("data-toggle", "collapse");
    errorMessage.setAttribute("href", "#" + indexCounter);
    errorMessage.innerHTML = errorMsg;
    body.appendChild(errorMessage);

    var collapsible = document.createElement("div");
    collapsible.setAttribute("id", "" + indexCounter);
    collapsible.setAttribute("class", "panel-collapse");
    collapsible.setAttribute("class", "collapse");
    panel.appendChild(collapsible);

    for (var i = 0; i < arrayQA.resultsLength; i++) {
        var panelGroup = document.createElement("div");
        panelGroup.setAttribute("class", "panel-group");
        panelGroup.setAttribute("id", "#" + indexCounter + "" + i);

        var qa = document.createElement("div");
        qa.setAttribute("class", "panel");
        qa.setAttribute("class", "panel-default");
        collapsible.appendChild(qa);

        var answerBody = document.createElement("div");
        answerBody.setAttribute("class", "panel-header");
        qa.appendChild(answerBody);

        var answerRow = document.createElement("a");
        answerRow.setAttribute("data-toggle", "collapse");
        answerRow.setAttribute("href", "#answer" + indexCounter + i);
        answerRow.setAttribute("data-parent", "#" + indexCounter + "" + i);
        answerRow.innerHTML = arrayQA.results[i].questionTitle;
        answerBody.appendChild(answerRow);

        var answerCollapsible = document.createElement("div");
        answerCollapsible.setAttribute("id", "#answer" + indexCounter + i);
        answerCollapsible.setAttribute("class", "panel-collapse");
        answerCollapsible.setAttribute("class", "collapse");
        qa.appendChild(answerCollapsible);

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


function handleQueuedErrors() {
    chrome.storage.sync.get(CHROME_OVERFLOW, function (items) {
        if (!chrome.runtime.error) {
            var results = items.chromeOverflow;
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                searchHelper(result);
            }
        }
        chrome.storage.sync.toRemove(CHROME_OVERFLOW, function (items) {
        });
    });
}

function searchHelper(error) {
    if (error.is404) {
        //TODO: Have renderer handle 404s differently
        search("404 File not found: " + error.src, 1, renderIssue);
    } else if (error.toString) {
        search(error.toString, 1, renderIssue);
    }
}

$(document).ready(handleQueuedErrors());

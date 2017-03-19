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
    search(error.toString, 1, renderIssue)
    errors.push(error);
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
        document.dispatchEvent(new CustomEvent('WindowError', { detail: error }));
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
            document.dispatchEvent(new CustomEvent('WindowError', { detail: error }));
        }
    }, true); // true to use this eventListener (capture phase) instead of bubbling up
}

//Inject code
var script = document.createElement('script');
console.log(injectErrorListener);
script.textContent = '(' + injectErrorListener + '())';
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);


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

function renderErr(errorMsg){
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
function renderIssue(arrayQA, errorMsg){
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

    var panelGroup = document.createElement("div");
    panelGroup.setAttribute("class", "panel-group");
    var qa = document.createElement("div");
    qa.setAttribute("class", "panel");
    qa.setAttribute("class", "panel-default");
    collapsible.appendChild(qa);
    for(var i = 0; i < arrayQA.resultsLength; i++) {
        var answerBody = document.createElement("div");
        answerBody.setAttribute("class", "panel");
        answerBody.setAttribute("class", "panel-header");
        qa.appendChild(answerBody);

        var answerRow = document.createElement("a");
        answerRow.setAttribute("data-toggle", "collapse");
        answerRow.setAttribute("href", "answer" + indexCounter + i);
        answerRow.innerHTML = arrayQA.results[i].questionTitle;
        answerBody.appendChild(answerRow);

        var answerCollapsible = document.createElement("div");
        answerCollapsible.setAttribute("id", "answer" + indexCounter + i);
        answerCollapsible.setAttribute("class", "panel-collapse");
        answerCollapsible.setAttribute("class", "collapse");
        answerRow.addEventListener("click", function(_indexCounter, _i) {
            return function() {
                jQuery("#answer" + _indexCounter + _i).toggleClass("in");
            }
        }(indexCounter, i));        
        qa.appendChild(answerCollapsible);

        var questionURL = document.createElement("a");
        questionURL.setAttribute("href", "http://" + arrayQA.results[i].questionURL);
        questionURL.innerHTML = "See this Question on Stack Overflow"
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


$(document).ready(search("JavaScript", 1, renderIssue)); //test
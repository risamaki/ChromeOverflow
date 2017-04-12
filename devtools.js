var panel;

// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

// listening to the port messages
backgroundPageConnection.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "onShowPanel" && panel) {
    if (request.errors) {
      for (var i=0; i<request.errors.length; i++) {
        searchHelper(request.errors[i]);
      }
    }
  } else if (request.type === "clearErrors" && panel) {
    clearErrors();
  } else if (request.type === "newError" && panel) {
    searchHelper(request.error);
  }
});

// Create a new panel
chrome.devtools.panels.create("ChromeOverflow",
  "resources/icons/ChromeOverflow128.png",
  "panel.html",
    function(extensionPanel) {
      var runOnce = false;
      extensionPanel.onShown.addListener(function (panelWindow) {
        panel = panelWindow;
        if (!runOnce) {
          runOnce = true;
          backgroundPageConnection.postMessage({
            name: 'getErrors',
            tabId: chrome.devtools.inspectedWindow.tabId,
          });
        }
      });
    }
);
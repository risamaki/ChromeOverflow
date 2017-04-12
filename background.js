// background.js
var connections = {};
var errors = {};

chrome.runtime.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "init") {
          connections[message.tabId] = port;
          return;
        }

        if (message.name == "getErrors") {
          port.postMessage({
            type: "onShowPanel",
            errors: errors[message.tabId],
          });
          return;
        }
    }

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);

        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] == port) {
            delete connections[tabs[i]]
            break;
          }
        }
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
      var tabId = sender.tab.id;
      if (request.clear) {
        errors[tabId] = [];
      } else if (request.message) {
        var error = request.message;
        if (errors[tabId]) {
          errors[tabId].push(error);
        } else {
          errors[tabId] = [error];
        }
      }
      if (tabId in connections) {
        if (request.clear) {
          connections[tabId].postMessage({
            type: "clearErrors"
          });
        } else {
          connections[tabId].postMessage({
            type: "newError",
            error: request.message
          });
        }
      } else {
        console.log("Tab not found in connection list.");
      }      
    } else {
      console.log("sender.tab not defined.");
    }
    return true;
});
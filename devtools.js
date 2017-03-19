// Create a new panel
chrome.devtools.panels.create("ChromeOverflow",
  "resources/icons/ChromeOverflow128.png",
  "panel.html",
    function(extensionPanel) {
      var runOnce = false;
      extensionPanel.onShown.addListener(function (panelWindow) {
        if (runOnce) return;
        runOnce = true;
        // panelWindow.document.body.appendChild(document.createTextNode('Hello!'));
      });
    }
);
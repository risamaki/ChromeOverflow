// Create a new panel
chrome.devtools.panels.create("ChromeOverflow",
  "resources/icons/ChromeOverflow128.png",
  "panel.html",
    function(extensionPanel) {
      var runOnce = false;
      extensionPanel.onShown.addListener(function (panelWindow) {
        if (runOnce) return;
        runOnce = true;
        // Do something, eg appending the text "Hello!" to the devtools panel
        // panelWindow.document.body.appendChild(document.createTextNode('Hello!'));
      });
    }
);
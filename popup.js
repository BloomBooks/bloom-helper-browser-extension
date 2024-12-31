chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  if (currentTab?.url) {
    chrome.runtime.sendMessage(
      { type: "checkSupport", url: currentTab.url },
      (response) => {
        const statusElement = document.getElementById("status");
        if (response.isSupported) {
          statusElement.className = "status supported";
          statusElement.textContent =
            "Any downloads you make on this page will be sent to Bloom.";
        } else {
          statusElement.className = "status unsupported";
          statusElement.textContent = "This site is not supported by Bloom";
        }
      }
    );
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  if (currentTab?.url) {
    console.log("Checking support for URL:", currentTab.url);
    chrome.runtime.sendMessage(
      { type: "checkSupport", url: currentTab.url },
      (response) => {
        console.log("Got response:", response);
        if (!response) {
          console.error("No response from background script");
          return;
        }
        const statusElement = document.getElementById("status");
        if (response.isSupported) {
          statusElement.className = "status supported";
          statusElement.textContent =
            "Any downloads you make on this page will be sent to Bloom.";
          updateQueueStatus();
        } else {
          statusElement.className = "status unsupported";
          statusElement.textContent = "This site is not supported by Bloom";
        }
      }
    );
  } else {
    console.error("No URL found for current tab");
    document.getElementById("status").textContent =
      "Error: Cannot check current page";
  }
});

function updateQueueStatus() {
  chrome.runtime.sendMessage({ type: "getQueueStatus" }, (response) => {
    const statusElement = document.getElementById("status");
    if (response.queuedCount > 0) {
      statusElement.textContent += ` (${response.queuedCount} download${
        response.queuedCount === 1 ? "" : "s"
      } queued)`;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Request the latest number from the service worker
  chrome.runtime.sendMessage({ type: "GET_QUEUE_SIZE" }, (response) => {
    if (response && response.number !== undefined) {
      document.getElementById("queue-info").textContent = response.number;
    }
  });
});

/// <reference types="chrome"/>

console.log("background.ts is loaded");

// NB: must match what the Bloom Gallery component expects
type DownloadMetadata = {
  urlOfPage: string;
  url: string;
  savedAtPath: string;
  when: Date;
};
const downloads: DownloadMetadata[] = [];

async function postDownloadsToBloom() {
  if (downloads.length === 0) return;

  try {
    console.log(
      "Attempting post of downloads to Bloom:",
      JSON.stringify(downloads, null, 2)
    );
    const response = await fetch(
      "http://localhost:5000/image-gallery/takeDownloads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(downloads),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Successfully posted to Bloom.");
    // Clear the array after successful POST
    downloads.length = 0;
  } catch (error) {
    console.error("Error posting to Bloom:", error);
  }
}

// Periodic try to deliver
setInterval(postDownloadsToBloom, 1000);

function updateIcon(tabId: number, shouldEnable: boolean) {
  const iconPath =
    downloads.length > 0
      ? "icon-when-queued.png"
      : shouldEnable
        ? "icon.png"
        : "icon-disabled.png";

  chrome.action.setIcon({
    path: iconPath,
    tabId: tabId,
  });
  if (shouldEnable) {
    chrome.action.enable(tabId);
  }
}

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log(`onUpdated ${tabId}`, changeInfo, tab);
//   if (tab.url) {
//     const url = new URL(tab.url);
//     const shouldEnable = hostPatterns.some((pattern) => {
//       const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
//       return regexp.test(url.href);
//     });
//     updateIcon(tabId, shouldEnable);
//   }
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("onMessage", request);
//   if (request.type === "checkSupport") {
//     try {
//       const url = new URL(request.url);
//       const isSupported = hostPatterns.some((pattern) => {
//         const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
//         return regexp.test(url.href);
//       });
//       console.log(`URL ${url} supported: ${isSupported}`);
//       sendResponse({ isSupported });
//     } catch (e) {
//       console.error("Error checking URL support:", e);
//       sendResponse({ isSupported: false });
//     }
//   } else if (request.type === "getQueueStatus") {
//     sendResponse({ queuedCount: downloads.length });
//   }
//   return true;
// });

function isImage(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
}

// Add download completion listener before the runtime.onMessage listener
chrome.downloads.onDeterminingFilename.addListener(
  async (downloadItem, suggest) => {
    if (
      isImage(downloadItem.url) ||
      (downloadItem.filename && isImage(downloadItem.filename))
    ) {
      console.log(`Image download detected: ${downloadItem.url}`);

      // Get the current tab's URL
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentPage = tabs[0]?.url || "";

      downloads.push({
        urlOfPage: currentPage,
        url: downloadItem.url,
        savedAtPath: downloadItem.filename,
        when: new Date(),
      });

      console.log(`Queued download:`, downloads[downloads.length - 1]);

      // Update icons in all tabs when queue changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) updateIcon(tab.id, true);
        });
      });
    }
    //suggest();
  }
);

/* 
In this experiment, I was preventing the download and jsut recording

chrome.downloads.onCreated.addListener(async (downloadItem) => {
  console.log(`onCreated`);
  chrome.downloads.cancel(downloadItem.id);
  console.log(`Intercepted download: ${downloadItem.url}`);

  // Get the current active tab's URL
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentPage = tabs[0]?.url;

  for (const adapter of adapters) {
    if (adapter.canHandleDownload(downloadItem.url)) {
      const metadata = await adapter.getMetadata(currentPage, downloadItem.url);
      if (metadata) {
        // Store the metadata in our array
        queuedDownloads.push(metadata);

        // Update icons in all tabs when queue changes
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) updateIcon(tab.id, true);
          });
        });

        postDownloadsToBloom();
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Bloom Downloader",
          message: "Could not get the metadata for that image.",
        });
      }
    }
    break;
  }
});
*/

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_QUEUE_SIZE") {
    sendResponse({ number: downloads.length });
  }
});

/// <reference types="chrome"/>

import { SiteAdapter } from "./SiteAdapter";
import { WikiCommonsAdapter } from "./adapters/WikiCommonsAdapter";
console.log("background.ts is loaded");

const adapters: SiteAdapter[] = [new WikiCommonsAdapter()];

const hostPatterns = adapters.flatMap((adapter) =>
  adapter.getHostWildcardPatterns()
);

// Store metadata for intercepted downloads
const queuedDownloads: any[] = [];

async function postDownloadsToBloom() {
  if (queuedDownloads.length === 0) return;

  try {
    const response = await fetch("http://localhost:5000/takeDownloads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queuedDownloads),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Posted downloads to Bloom.");
    // Clear the array after successful POST
    queuedDownloads.length = 0;
  } catch (error) {
    console.error("Error posting to Bloom:", error);
  }
}

// Periodic try to deliver
setInterval(postDownloadsToBloom, 1000);

function updateIcon(tabId: number, shouldEnable: boolean) {
  const iconPath =
    queuedDownloads.length > 0
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`onUpdated ${tabId}`, changeInfo, tab);
  if (tab.url) {
    const url = new URL(tab.url);
    const shouldEnable = hostPatterns.some((pattern) => {
      const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regexp.test(url.href);
    });
    updateIcon(tabId, shouldEnable);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("onMessage", request);
  if (request.type === "checkSupport") {
    try {
      const url = new URL(request.url);
      const isSupported = hostPatterns.some((pattern) => {
        const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regexp.test(url.href);
      });
      console.log(`URL ${url} supported: ${isSupported}`);
      sendResponse({ isSupported });
    } catch (e) {
      console.error("Error checking URL support:", e);
      sendResponse({ isSupported: false });
    }
  } else if (request.type === "getQueueStatus") {
    sendResponse({ queuedCount: queuedDownloads.length });
  }
  return true;
});

chrome.downloads.onCreated.addListener(async (downloadItem) => {
  console.log(`onCreated`);
  chrome.downloads.cancel(downloadItem.id);
  console.log(`Intercepted download: ${downloadItem.url}`);

  for (const adapter of adapters) {
    if (adapter.canHandleDownload(downloadItem.url)) {
      const metadata = await adapter.getMetadata(downloadItem.url);
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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_QUEUE_SIZE") {
    sendResponse({ number: queuedDownloads.length });
  }
});

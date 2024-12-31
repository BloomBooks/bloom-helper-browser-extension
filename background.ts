/// <reference types="chrome"/>

import { SiteAdapter } from "./interfaces/SiteAdapter";
import { WikiCommonsAdapter } from "./adapters/WikiCommonsAdapter";
console.log("background.ts is loaded");

const adapters: SiteAdapter[] = [new WikiCommonsAdapter()];

const hostPatterns = adapters.flatMap((adapter) =>
  adapter.getHostWildcardPatterns()
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`onUpdated ${tabId}`, changeInfo, tab);
  if (tab.url) {
    const url = new URL(tab.url);
    const shouldEnable = hostPatterns.some((pattern) => {
      const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regexp.test(url.href);
    });

    if (shouldEnable) {
      chrome.action.setIcon({
        path: "icon.png",
        tabId: tabId,
      });
      chrome.action.enable(tabId);
    } else {
      chrome.action.setIcon({
        path: "icon-disabled.png",
        tabId: tabId,
      });
      // if we disable as far as Chrome is concerned, then we can't explain why we chrome.action.disable(tabId);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("onMessage");
  if (request.type === "checkSupport") {
    const url = request.url;
    const isSupported = hostPatterns.some((pattern) => {
      const regexp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regexp.test(url);
    });
    sendResponse({ isSupported });
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
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Download Intercepted",
          message: JSON.stringify(metadata, null, 2),
        });
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Problem",
          message:
            "Bloom Downloader could not get the metadata for that image.",
        });
      }
    }
    break;
  }
});

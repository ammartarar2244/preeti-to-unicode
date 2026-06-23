// Background Service Worker for Manifest V3 extension

// Create context menu items on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convert-preeti-unicode",
    title: "Convert selected Preeti to Unicode",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "convert-unicode-preeti",
    title: "Convert selected Unicode to Preeti",
    contexts: ["selection"]
  });
  
  console.log("Nepali Language Tools context menus created.");
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convert-preeti-unicode" || info.menuItemId === "convert-unicode-preeti") {
    if (tab && tab.id) {
      // Send the text and mode to the content script in the active tab
      chrome.tabs.sendMessage(tab.id, {
        action: "convert_text",
        text: info.selectionText,
        mode: info.menuItemId
      }, (response) => {
        // Handle optional response or error if content script isn't loaded
        if (chrome.runtime.lastError) {
          console.warn("Content script not active on this page:", chrome.runtime.lastError.message);
          // Fallback: Notify the user that they can't convert on this system/browser page
          showNotification(
            "Cannot Convert",
            "Please refresh the page or try on a regular webpage."
          );
        }
      });
    }
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "show_notification") {
    showNotification(message.title, message.message);
    sendResponse({ status: "success" });
  }
  return true; // Keep message channel open for asynchronous responses
});

// Helper to show native chrome notifications
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: title,
    message: message,
    priority: 1
  });
}

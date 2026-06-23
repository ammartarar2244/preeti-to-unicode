// Content script running in the web page context

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convert_text") {
    const rawText = request.text;
    const mode = request.mode;
    let converted = "";

    try {
      // 1. Perform conversion
      if (mode === "convert-preeti-unicode") {
        converted = NepaliConverter.preetiToUnicode(rawText);
      } else if (mode === "convert-unicode-preeti") {
        converted = NepaliConverter.unicodeToPreeti(rawText);
      }

      // 2. Identify if target element is editable
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) {
        // Replace selected text inside the input
        replaceSelectedText(activeEl, converted);
        
        // Notify service worker to show notification
        chrome.runtime.sendMessage({
          action: "show_notification",
          title: "Text Replaced!",
          message: "The selected text was successfully converted and replaced."
        });
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(converted).then(() => {
          chrome.runtime.sendMessage({
            action: "show_notification",
            title: "Copied to Clipboard!",
            message: "Successfully converted and copied to your clipboard."
          });
        }).catch(err => {
          console.error("Clipboard copy failed:", err);
          // If writeText fails due to focus issues, alert the user
          chrome.runtime.sendMessage({
            action: "show_notification",
            title: "Conversion Completed",
            message: "Text converted! Click on the page to allow copying."
          });
        });
      }

      sendResponse({ status: "success", text: converted });
    } catch (e) {
      console.error("Nepali Language Tools extension error:", e);
      sendResponse({ status: "error", message: e.message });
    }
  }
  return true; // Keep channel open
});

/**
 * Replaces selected text inside active editable fields or contenteditable zones
 */
function replaceSelectedText(element, text) {
  const start = element.selectionStart;
  const end = element.selectionEnd;

  if (typeof start === "number" && typeof end === "number") {
    // Replace text inside textarea or input
    const originalValue = element.value;
    element.value = originalValue.substring(0, start) + text + originalValue.substring(end);
    
    // Position cursor after the replaced text
    const newCursorPos = start + text.length;
    element.setSelectionRange(newCursorPos, newCursorPos);

    // Dispatch input and change events so modern JS frameworks update their state
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // Rich text editor (contenteditable)
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    }
  }
}

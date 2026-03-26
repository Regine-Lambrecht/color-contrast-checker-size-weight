// This script allows the side panel to open when the user clicks the extension icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Optional: Open side panel automatically on specific sites or when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Colour Contrast Checker Pro installed.");
});

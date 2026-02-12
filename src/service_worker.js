
async function sendMessageToActiveTab(message) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, message);
}

chrome.contextMenus.onClicked.addListener(async(info, tab) => {
    if (info.menuItemId === "DisplayMerchSize") {
        const msg = { selectionText: info.selectionText };
        await sendMessageToActiveTab(msg);
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    chrome.contextMenus.create({
        id: "DisplayMerchSize",
        title: "実寸サイズをプレビュー",
        contexts: ["selection"]
    });
});

// background.js

/**
 * Helper function to escape special regex characters in domain names.
 * This ensures that domains like "example.com" are treated as literal strings
 * in the regex filter, preventing regex injection or unexpected matches.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


async function closeOpenTabsForBlockedSites() {
  try {
    const data = await chrome.storage.local.get('blockedSites');
    const sites = data.blockedSites || [];
    
    if (sites.length === 0) return;

    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (!tab.url) continue; // Skip tabs without a valid URL (e.g., new tab page)
      
      try {
        const urlObj = new URL(tab.url);
        const hostname = urlObj.hostname;
        
        // Check if the hostname exactly matches the blocked site 
        // or is a subdomain of it (e.g., "www.youtube.com" matches "youtube.com")
        const isBlocked = sites.some(site => 
          hostname === site || hostname.endsWith(`.${site}`)
        );

        if (isBlocked) {
          console.log(`[Blocksite] Closing tab that is now blocked: ${tab.url}`);
          await chrome.tabs.remove(tab.id);
        }
      } catch (e) {
        // Ignore invalid URLs that cannot be parsed (e.g., chrome://, chrome-extension://)
        continue;
      }
    }
  } catch (error) {
    console.error("[Blocksite] Error closing blocked tabs:", error);
  }
}

/**
 * Updates the declarativeNetRequest rules based on the current blocklist and pause status.
 */
async function updateBlockingRules() {
  try {
    const data = await chrome.storage.local.get(['blockedSites', 'pauseUntil']);
    const sites = data.blockedSites || [];
    const pauseUntil = data.pauseUntil || 0;
    const now = Date.now();

    // Get existing rules to clean them up before applying new ones
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(rule => rule.id);

    // If pause is active, clear all blocking rules to allow access
    if (pauseUntil > now) {
      if (existingIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingIds
        });
      }
      console.log('[Blocksite] Blocking is currently paused. Rules cleared.');
      return;
    }

    // Create new blocking rules for each site in the list
    const rules = sites.map((site, index) => {
      const cleanSite = escapeRegExp(site);
      return {
        id: 1000 + index, // Start from 1000 to avoid conflicts with other extensions
        priority: 1,
        action: {
          type: 'block' // Native and reliable blocking action
        },
        condition: {
          regexFilter: `^https?://(?:www\\.)?(${cleanSite})(?:/.*)?$`,
          resourceTypes: ['main_frame', 'sub_frame']
        }
      };
    });

    // Apply the new rules (remove old, add new)
    if (existingIds.length > 0 || rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: rules
      });
    }
    
    console.log(`[Blocksite] Successfully updated ${rules.length} blocking rules.`);
  } catch (error) {
    console.error('[Blocksite] Error updating rules:', error);
  }
}

// ==========================================
// Event Listeners
// ==========================================

// Initialize rules when the extension is installed or the browser starts
chrome.runtime.onInstalled.addListener(updateBlockingRules);
chrome.runtime.onStartup.addListener(updateBlockingRules);

// Listen for changes in local storage and update rules immediately
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.blockedSites || changes.pauseUntil)) {
    updateBlockingRules();
  }
});

// Listen for the alarm to automatically resume blocking after a pause
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'resumeBlocking') {
    console.log('[Blocksite] Pause expired. Resuming blocking...');
    await chrome.storage.local.remove('pauseUntil');
    await updateBlockingRules();
    
    // CRITICAL: Close any tabs that were left open during the pause
    await closeOpenTabsForBlockedSites(); 
  }
});

// Listen for messages from the popup (e.g., when the user manually clicks "Resume blocking")
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeBlockedTabs') {
    closeOpenTabsForBlockedSites();
    sendResponse({ status: 'ok' });
  }
});

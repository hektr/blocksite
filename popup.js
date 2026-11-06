const siteInput = document.getElementById('siteInput');
const addBtn = document.getElementById('addBtn');
const siteList = document.getElementById('siteList');
const pauseBtn = document.getElementById('pauseBtn');
const pauseStatus = document.getElementById('pauseStatus');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const timerText = document.getElementById('timerText');
const confirmInput = document.getElementById('confirmInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentAction = null;
let pendingRemoveSite = null;
let expectedText = '';
let actionTimer = null;
let sourceBtn = null;

function openConfirmationModal(action, textToType, siteName = '', btn = null) {
  currentAction = action;
  expectedText = textToType.toLowerCase();
  pendingRemoveSite = siteName;
  sourceBtn = btn;
  
  if (sourceBtn) sourceBtn.disabled = true;

  modalTitle.textContent = action === 'remove' ? 'Remove site?' : 'Pause blocking?';
  confirmBtn.textContent = action === 'remove' ? 'Remove' : 'Pause';
  
  modalOverlay.style.display = 'flex'; // Changed to flex for better centering
  confirmInput.style.display = 'none';
  confirmInput.value = '';
  confirmBtn.disabled = true;
  modalText.textContent = 'Wait 5 seconds...';
  
  timerText.style.display = 'block';
  let secondsLeft = 5;
  timerText.textContent = secondsLeft;
  
  actionTimer = setInterval(() => {
    secondsLeft--;
    timerText.textContent = secondsLeft;
    
    if (secondsLeft <= 0) {
      clearInterval(actionTimer);
      timerText.style.display = 'none';
      modalText.textContent = `Type "${textToType}" to confirm:`;
      confirmInput.style.display = 'block';
      confirmInput.placeholder = `Type "${textToType}"`;
      confirmInput.focus();
    }
  }, 1000);
}

function closeModal() {
  modalOverlay.style.display = 'none';
  currentAction = null;
  pendingRemoveSite = null;
  
  if (sourceBtn) {
    sourceBtn.disabled = false;
    sourceBtn = null;
  }

  if (actionTimer) {
    clearInterval(actionTimer);
    actionTimer = null;
  }
}

confirmInput.addEventListener('input', () => {
  confirmBtn.disabled = confirmInput.value.trim().toLowerCase() !== expectedText;
});

confirmBtn.addEventListener('click', async () => {
  if (confirmInput.value.trim().toLowerCase() === expectedText) {
    if (currentAction === 'remove') {
      await removeSite(pendingRemoveSite);
    } else if (currentAction === 'pause') {
      await activatePause();
    }
    closeModal();
  }
});

cancelBtn.addEventListener('click', closeModal);

async function renderSites() {
  const data = await chrome.storage.local.get('blockedSites');
  const sites = data.blockedSites || [];
  siteList.innerHTML = '';

  if (sites.length === 0) {
    siteList.innerHTML = '<div class="empty-msg">No sites blocked yet</div>';
    return;
  }

  sites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'site-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = site;
    nameSpan.className = 'site-name';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove site';
    removeBtn.onclick = () => openConfirmationModal('remove', site, site, removeBtn);

    item.appendChild(nameSpan);
    item.appendChild(removeBtn);
    siteList.appendChild(item);
  });
}

async function addSite() {
  let site = siteInput.value.trim().toLowerCase();
  if (!site) return;

  // Basic validation
  if (!site.includes('.') || site.startsWith('.') || site.endsWith('.')) {
    alert('Please enter a valid domain (e.g., example.com)');
    return;
  }

  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  const data = await chrome.storage.local.get('blockedSites');
  const sites = data.blockedSites || [];

  if (sites.includes(site)) {
    alert('This site is already blocked.');
    return;
  }

  sites.push(site);
  await chrome.storage.local.set({ blockedSites: sites });
  
  siteInput.value = '';
  renderSites();

  // Immediately close any already open tabs for this site
  await closeOpenTabsForSite(site);
}

// Finds and closes tabs matching the blocked domain
async function closeOpenTabsForSite(siteToBlock) {
  try {
    // Query all tabs. The 'tabs' permission allows us to read the 'url' property.
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (!tab.url) continue;
      
      try {
        const urlObj = new URL(tab.url);
        // Check if hostname is exactly the site (e.g., youtube.com) 
        // or a subdomain of it (e.g., www.youtube.com or m.youtube.com)
        if (urlObj.hostname === siteToBlock || urlObj.hostname.endsWith(`.${siteToBlock}`)) {
          await chrome.tabs.remove(tab.id);
        }
      } catch (e) {
        // Ignore invalid URLs (like chrome:// or chrome-extension://)
        continue;
      }
    }
  } catch (error) {
    console.error("Blocksite: Error closing tabs:", error);
  }
}

async function removeSite(siteToRemove) {
  const data = await chrome.storage.local.get('blockedSites');
  const sites = (data.blockedSites || []).filter(s => s !== siteToRemove);
  await chrome.storage.local.set({ blockedSites: sites });
  renderSites();
}

async function activatePause() {
  const now = Date.now();
  const pauseUntil = now + 15 * 60 * 1000;
  await chrome.storage.local.set({ pauseUntil });
  
  chrome.alarms.create('resumeBlocking', { delayInMinutes: 15 });
  updatePauseUI(pauseUntil);
}

async function deactivatePause() {
  await chrome.storage.local.remove('pauseUntil');
  await chrome.alarms.clear('resumeBlocking');
  
  chrome.runtime.sendMessage({ action: 'closeBlockedTabs' });
  
  updatePauseUI(null);
}

pauseBtn.addEventListener('click', async () => {
  const data = await chrome.storage.local.get('pauseUntil');
  const now = Date.now();
  
  if (data.pauseUntil && data.pauseUntil > now) {
    await deactivatePause();
  } else {
    openConfirmationModal('pause', 'pause', '', pauseBtn);
  }
});

function updatePauseUI(pauseUntil) {
  const now = Date.now();
  if (pauseUntil && pauseUntil > now) {
    const minutesLeft = Math.ceil((pauseUntil - now) / 60000);
    pauseBtn.textContent = `Resume blocking (${minutesLeft}m)`;
    pauseBtn.classList.add('active');
    pauseStatus.textContent = 'Blocking is temporarily paused';
  } else {
    pauseBtn.textContent = 'Pause blocking for 15 min';
    pauseBtn.classList.remove('active');
    pauseStatus.textContent = '';
  }
}

async function checkPauseStatus() {
  const data = await chrome.storage.local.get('pauseUntil');
  updatePauseUI(data.pauseUntil);
}

addBtn.addEventListener('click', addSite);
siteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addSite(); });

renderSites();
checkPauseStatus();

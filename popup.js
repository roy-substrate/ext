// Popup script for substrate-copy extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings and history
  await loadSettings();
  await loadHistory();
  
  // Set up event listeners
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['alwaysPlainText']);
    const alwaysPlainText = result.alwaysPlainText || false;
    
    const checkbox = document.getElementById('alwaysPlainText');
    checkbox.checked = alwaysPlainText;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load history from storage
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['copyHistory']);
    const history = result.copyHistory || [];
    
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <p>No recent copies</p>
          <small>Select text and use the context menu to get started</small>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const timeAgo = getTimeAgo(item.timestamp);
      const truncatedText = item.text.length > 50 
        ? item.text.substring(0, 50) + '...' 
        : item.text;
      
      historyItem.innerHTML = `
        <div class="history-content">
          <div class="history-text">${escapeHtml(truncatedText)}</div>
          <div class="history-meta">
            <span class="format-tag">${item.format}</span>
            <span class="timestamp">${timeAgo}</span>
          </div>
        </div>
        <button class="copy-again-btn" data-text="${escapeHtml(item.text)}" title="Copy again">
          📋
        </button>
      `;
      
      historyList.appendChild(historyItem);
    });
    
    // Add click listeners for copy-again buttons
    document.querySelectorAll('.copy-again-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const text = e.target.getAttribute('data-text');
        await copyToClipboard(text);
        showToast('✅ Copied again!');
      });
    });
    
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Always plain text toggle
  const alwaysPlainTextCheckbox = document.getElementById('alwaysPlainText');
  alwaysPlainTextCheckbox.addEventListener('change', async (e) => {
    try {
      await chrome.storage.local.set({ alwaysPlainText: e.target.checked });
      showToast(e.target.checked ? '✅ Always plain text enabled' : '❌ Always plain text disabled');
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  });
  
  // Clear clipboard button
  const clearClipboardBtn = document.getElementById('clearClipboard');
  clearClipboardBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('');
      await chrome.storage.local.set({ copyHistory: [] });
      await loadHistory(); // Refresh the history display
      showToast('🗑️ Clipboard cleared');
    } catch (error) {
      console.error('Error clearing clipboard:', error);
      showToast('❌ Failed to clear clipboard');
    }
  });
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Add to body
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

// Listen for storage changes to update history in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.copyHistory) {
    loadHistory();
  }
});

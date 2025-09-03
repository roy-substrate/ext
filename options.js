// Options page script for clip extension

let currentSettings = {};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  await checkProStatus();
});

// Load all settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'alwaysPlainText',
      'autoCleanText',
      'showNotifications',
      'historyLimit',
      'autoClearMinutes',
      'syncEnabled',
      'enabledFormats',
      'isPro',
      'openaiApiKey',
      'aiModel',
      'aiContextMenu'
    ]);
    
    currentSettings = {
      alwaysPlainText: result.alwaysPlainText || false,
      autoCleanText: result.autoCleanText || false,
      showNotifications: result.showNotifications !== false, // Default to true
      historyLimit: result.historyLimit || 5,
      autoClearMinutes: result.autoClearMinutes || 0,
      syncEnabled: result.syncEnabled || false,
      enabledFormats: result.enabledFormats || {
        markdown: true,
        html: true,
        json: true
      },
      isPro: result.isPro || false,
      openaiApiKey: result.openaiApiKey || '',
      aiModel: result.aiModel || 'gpt-3.5-turbo',
      aiContextMenu: result.aiContextMenu !== false // Default to true
    };
    
    updateUI();
  } catch (error) {
    console.error('Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

// Update UI with current settings
function updateUI() {
  // Basic settings
  document.getElementById('alwaysPlainText').checked = currentSettings.alwaysPlainText;
  document.getElementById('autoCleanText').checked = currentSettings.autoCleanText;
  document.getElementById('showNotifications').checked = currentSettings.showNotifications;
  
  // Privacy settings
  document.getElementById('historyLimit').value = currentSettings.historyLimit;
  document.getElementById('autoClearMinutes').value = currentSettings.autoClearMinutes;
  document.getElementById('syncEnabled').checked = currentSettings.syncEnabled;
  
  // Format settings
  document.getElementById('enableMarkdown').checked = currentSettings.enabledFormats.markdown;
  document.getElementById('enableHTML').checked = currentSettings.enabledFormats.html;
  document.getElementById('enableJSON').checked = currentSettings.enabledFormats.json;
  
  // AI settings
  document.getElementById('openaiApiKey').value = currentSettings.openaiApiKey;
  document.getElementById('aiModel').value = currentSettings.aiModel;
  document.getElementById('aiContextMenu').checked = currentSettings.aiContextMenu;
}

// Setup event listeners
function setupEventListeners() {
  // Basic settings
  document.getElementById('alwaysPlainText').addEventListener('change', saveSettings);
  document.getElementById('autoCleanText').addEventListener('change', saveSettings);
  document.getElementById('showNotifications').addEventListener('change', saveSettings);
  
  // Privacy settings
  document.getElementById('historyLimit').addEventListener('change', saveSettings);
  document.getElementById('autoClearMinutes').addEventListener('change', saveSettings);
  document.getElementById('syncEnabled').addEventListener('change', saveSettings);
  
  // Format settings
  document.getElementById('enableMarkdown').addEventListener('change', saveSettings);
  document.getElementById('enableHTML').addEventListener('change', saveSettings);
  document.getElementById('enableJSON').addEventListener('change', saveSettings);
  
  // AI settings
  document.getElementById('openaiApiKey').addEventListener('input', debounce(saveSettings, 1000));
  document.getElementById('aiModel').addEventListener('change', saveSettings);
  document.getElementById('aiContextMenu').addEventListener('change', saveSettings);
  
  // API key visibility toggle
  document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
  
  // Export buttons
  document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
  document.getElementById('exportCSV').addEventListener('click', () => exportData('csv'));
  document.getElementById('exportMarkdown').addEventListener('click', () => exportData('markdown'));
  
  // Import button
  document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImport);
  
  // Clear all data
  document.getElementById('clearAllData').addEventListener('click', confirmClearAllData);
  
  // Pro upgrade
  document.getElementById('upgradeForAI').addEventListener('click', handleUpgrade);
  
  // Modal controls
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('confirmCancel').addEventListener('click', closeModal);
  document.getElementById('confirmOk').addEventListener('click', handleConfirmAction);
  
  // Footer links
  document.getElementById('showChangelog').addEventListener('click', showChangelog);
  document.getElementById('showPrivacy').addEventListener('click', showPrivacy);
  document.getElementById('showSupport').addEventListener('click', showSupport);
}

// Save settings
async function saveSettings() {
  try {
    const newSettings = {
      alwaysPlainText: document.getElementById('alwaysPlainText').checked,
      autoCleanText: document.getElementById('autoCleanText').checked,
      showNotifications: document.getElementById('showNotifications').checked,
      historyLimit: parseInt(document.getElementById('historyLimit').value),
      autoClearMinutes: parseInt(document.getElementById('autoClearMinutes').value),
      syncEnabled: document.getElementById('syncEnabled').checked,
      enabledFormats: {
        markdown: document.getElementById('enableMarkdown').checked,
        html: document.getElementById('enableHTML').checked,
        json: document.getElementById('enableJSON').checked
      },
      openaiApiKey: document.getElementById('openaiApiKey').value.trim(),
      aiModel: document.getElementById('aiModel').value,
      aiContextMenu: document.getElementById('aiContextMenu').checked
    };
    
    // Merge with current settings
    currentSettings = { ...currentSettings, ...newSettings };
    
    // Save to storage
    await chrome.storage.local.set(currentSettings);
    
    showToast('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

// Check and update pro status
async function checkProStatus() {
  const isPro = currentSettings.isPro;
  
  if (isPro) {
    document.getElementById('aiProStatus').classList.add('hidden');
    document.getElementById('aiSettings').classList.remove('hidden');
    
    // Enable pro options
    document.getElementById('historyLimit').disabled = false;
    document.getElementById('syncEnabled').disabled = false;
  } else {
    document.getElementById('aiProStatus').classList.remove('hidden');
    document.getElementById('aiSettings').classList.add('hidden');
    
    // Limit free options
    const historySelect = document.getElementById('historyLimit');
    historySelect.value = '5';
    for (let option of historySelect.options) {
      if (parseInt(option.value) > 5) {
        option.disabled = true;
      }
    }
    
    document.getElementById('syncEnabled').disabled = true;
    document.getElementById('syncEnabled').checked = false;
  }
}

// Handle pro upgrade
function handleUpgrade() {
  showConfirmModal(
    'Upgrade to Pro',
    'This is a demo. In a real app, this would redirect to a payment page. Continue to enable Pro features?',
    async () => {
      await chrome.storage.local.set({ isPro: true });
      currentSettings.isPro = true;
      await checkProStatus();
      showToast('Welcome to Pro! All features unlocked.', 'success');
    }
  );
}

// API key visibility toggle
function toggleApiKeyVisibility() {
  const input = document.getElementById('openaiApiKey');
  const button = document.getElementById('toggleApiKey');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

// Data management
async function exportData(format) {
  try {
    const result = await chrome.storage.local.get(['copyHistory', 'snippets']);
    const data = {
      history: result.copyHistory || [],
      snippets: result.snippets || [],
      settings: currentSettings,
      exportDate: new Date().toISOString(),
      version: '4.0.0'
    };
    
    const filename = `clip-export-${new Date().toISOString().split('T')[0]}.${format}`;
    
    let content = '';
    let mimeType = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        const history = data.history;
        if (history.length > 0) {
          const headers = ['timestamp', 'format', 'text', 'url'].join(',');
          const rows = history.map(item => [
            new Date(item.timestamp).toISOString(),
            item.format,
            `"${item.text.replace(/"/g, '""')}"`,
            item.url || ''
          ].join(',')).join('\n');
          content = headers + '\n' + rows;
        }
        mimeType = 'text/csv';
        break;
      case 'markdown':
        content = `# clip Export\n\n`;
        content += `Export Date: ${new Date().toLocaleDateString()}\n\n`;
        content += `## Copy History\n\n`;
        data.history.forEach((item, index) => {
          content += `### ${index + 1}. ${item.format} - ${new Date(item.timestamp).toLocaleDateString()}\n\n`;
          content += `${item.text}\n\n`;
          if (item.url) content += `Source: ${item.url}\n\n`;
          content += `---\n\n`;
        });
        if (data.snippets.length > 0) {
          content += `## Snippets\n\n`;
          data.snippets.forEach((snippet, index) => {
            content += `### ${index + 1}. ${snippet.title}\n\n`;
            content += `${snippet.text}\n\n`;
            content += `---\n\n`;
          });
        }
        mimeType = 'text/markdown';
        break;
    }
    
    downloadFile(content, filename, mimeType);
    showToast(`Data exported as ${format.toUpperCase()}`, 'success');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast('Error exporting data', 'error');
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.history && !data.snippets) {
      throw new Error('Invalid import file format');
    }
    
    showConfirmModal(
      'Import Data',
      'This will replace your current history and snippets. Continue?',
      async () => {
        const importData = {};
        if (data.history) importData.copyHistory = data.history;
        if (data.snippets) importData.snippets = data.snippets;
        
        await chrome.storage.local.set(importData);
        showToast('Data imported successfully', 'success');
      }
    );
    
  } catch (error) {
    console.error('Error importing data:', error);
    showToast('Error importing data. Please check the file format.', 'error');
  }
  
  event.target.value = '';
}

function confirmClearAllData() {
  showConfirmModal(
    'Clear All Data',
    'This will permanently delete all your history, snippets, and reset settings to defaults. This action cannot be undone.',
    async () => {
      try {
        await chrome.storage.local.clear();
        showToast('All data cleared successfully', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Error clearing data', 'error');
      }
    }
  );
}

// Modal management
let confirmCallback = null;

function showConfirmModal(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.remove('hidden');
  confirmCallback = callback;
}

function closeModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmCallback = null;
}

function handleConfirmAction() {
  if (confirmCallback) {
    confirmCallback();
    confirmCallback = null;
  }
  closeModal();
}

// Footer link handlers
function showChangelog() {
  showToast('Changelog: v4.0.0 - Added AI features, improved UI, cross-device sync', 'info');
}

function showPrivacy() {
  showToast('Privacy: All data stored locally. AI features use OpenAI API.', 'info');
}

function showSupport() {
  showToast('Support: For help, contact support@clip-extension.com', 'info');
}

// Toast notifications
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.isPro) {
    checkProStatus();
  }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveSettings();
  }
});

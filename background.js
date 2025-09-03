// Background script for substrate-copy extension

// Text transformation functions
function toPlainText(input) {
  if (!input) return '';
  
  // Create a temporary DOM element to strip HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = input;
  
  // Get plain text and clean up whitespace
  return tempDiv.textContent || tempDiv.innerText || input.replace(/<[^>]*>/g, '');
}

function toMarkdown(input) {
  if (!input) return '';
  
  let markdown = input;
  
  // Convert HTML links to markdown
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, '[$2]($1)');
  
  // Convert bold tags
  markdown = markdown.replace(/<(strong|b)>/gi, '**').replace(/<\/(strong|b)>/gi, '**');
  
  // Convert italic tags
  markdown = markdown.replace(/<(em|i)>/gi, '*').replace(/<\/(em|i)>/gi, '*');
  
  // Convert headers
  markdown = markdown.replace(/<h([1-6])[^>]*>([^<]*)<\/h[1-6]>/gi, (match, level, text) => {
    return '#'.repeat(parseInt(level)) + ' ' + text;
  });
  
  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1\n\n');
  
  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  
  return markdown;
}

function toHTML(input) {
  if (!input) return '';
  
  // If input already contains HTML tags, return as is
  if (/<[^>]*>/.test(input)) {
    return input;
  }
  
  // Convert plain text to basic HTML
  let html = input;
  
  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags
  html = `<p>${html}</p>`;
  
  return html;
}

// Storage management
async function saveToHistory(text, format) {
  try {
    const result = await chrome.storage.local.get(['copyHistory']);
    let history = result.copyHistory || [];
    
    // Add new item to beginning of array
    const newItem = {
      text: text.substring(0, 100), // Truncate for display
      format: format,
      timestamp: Date.now()
    };
    
    history.unshift(newItem);
    
    // Keep only last 5 items
    history = history.slice(0, 5);
    
    await chrome.storage.local.set({ copyHistory: history });
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

// Copy text to clipboard
async function copyToClipboard(text, format) {
  try {
    await navigator.clipboard.writeText(text);
    await saveToHistory(text, format);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
          title: 'clip',
    message: `✅ copied as ${format}`
    });
  } catch (error) {
    console.error('Error copying to clipboard:', error);
  }
}

// Get selected text from active tab
async function getSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return window.getSelection().toString();
      }
    });
    
    return results[0]?.result || '';
  } catch (error) {
    console.error('Error getting selected text:', error);
    return '';
  }
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  // Remove any existing context menus
  chrome.contextMenus.removeAll();
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'copy-plain-text',
    title: 'Copy as Plain Text',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'copy-markdown',
    title: 'Copy as Markdown',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'copy-html',
    title: 'Copy as HTML',
    contexts: ['selection']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText) return;
  
  // Check if "always copy as plain text" is enabled
  const result = await chrome.storage.local.get(['alwaysPlainText']);
  const alwaysPlainText = result.alwaysPlainText || false;
  
  if (alwaysPlainText) {
    const plainText = toPlainText(info.selectionText);
    await copyToClipboard(plainText, 'plain text (auto)');
    return;
  }
  
  let transformedText = '';
  let format = '';
  
  switch (info.menuItemId) {
    case 'copy-plain-text':
      transformedText = toPlainText(info.selectionText);
      format = 'plain text';
      break;
    case 'copy-markdown':
      transformedText = toMarkdown(info.selectionText);
      format = 'markdown';
      break;
    case 'copy-html':
      transformedText = toHTML(info.selectionText);
      format = 'HTML';
      break;
  }
  
  if (transformedText) {
    await copyToClipboard(transformedText, format);
  }
});

// Keyboard shortcuts handler
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'copy-plain':
      const selectedText = await getSelectedText();
      if (selectedText) {
        const plainText = toPlainText(selectedText);
        await copyToClipboard(plainText, 'plain text');
      }
      break;
    case 'clear-clipboard':
      await copyToClipboard('', 'cleared');
      break;
  }
});

// This functionality is now integrated into the main context menu handler above

// Add notification permission
chrome.runtime.onInstalled.addListener(() => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'clip',
    message: '🚀 Extension installed and ready!'
  });
});

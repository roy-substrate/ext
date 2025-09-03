// Background script for clip extension

console.log('🚀 Clip extension background script loaded');

// Text transformation functions
function toPlainText(input) {
  if (!input) return '';
  
  // Remove HTML tags and clean whitespace
  let text = input.replace(/<[^>]*>/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
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
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  markdown = markdown.replace(/\s+/g, ' ').trim();
  
  return markdown;
}

function toHTML(input) {
  if (!input) return '';
  
  // If already HTML, return as is
  if (/<[^>]*>/.test(input)) {
    return input;
  }
  
  // Convert plain text to HTML
  let html = input;
  html = html.replace(/\n/g, '<br>');
  html = `<p>${html}</p>`;
  
  return html;
}

function toJSON(input) {
  if (!input) return '{}';
  
  try {
    // Try to parse existing JSON
    JSON.parse(input);
    return input;
  } catch {
    // Convert to simple JSON object
    return JSON.stringify({ text: input.trim() }, null, 2);
  }
}

// Copy to clipboard function
async function copyToClipboard(text, format) {
  try {
    console.log(`📋 Copying text as ${format}:`, text.substring(0, 50) + '...');
    
    await navigator.clipboard.writeText(text);
    
    // Save to history
    await saveToHistory(text, format);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'clip',
      message: `✅ Copied as ${format}`
    });
    
    console.log('✅ Successfully copied to clipboard');
  } catch (error) {
    console.error('❌ Error copying to clipboard:', error);
    
    // Fallback notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'clip',
      message: '❌ Copy failed'
    });
  }
}

// Save to history
async function saveToHistory(text, format) {
  try {
    const result = await chrome.storage.local.get(['copyHistory']);
    let history = result.copyHistory || [];
    
    const newItem = {
      id: Date.now().toString(),
      text: text.substring(0, 200), // Truncate for storage
      fullText: text,
      format: format,
      timestamp: Date.now()
    };
    
    history.unshift(newItem);
    history = history.slice(0, 5); // Keep only last 5
    
    await chrome.storage.local.set({ copyHistory: history });
    console.log('💾 Saved to history:', format);
  } catch (error) {
    console.error('❌ Error saving to history:', error);
  }
}

// Get selected text from active tab
async function getSelectedText() {
  try {
    console.log('🔍 Getting selected text...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('📄 Active tab:', tab.url);
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const selection = window.getSelection();
        const text = selection.toString();
        console.log('Selected text length:', text.length);
        return text;
      }
    });
    
    const selectedText = results[0]?.result || '';
    console.log('📝 Selected text:', selectedText.substring(0, 50) + '...');
    
    return selectedText;
  } catch (error) {
    console.error('❌ Error getting selected text:', error);
    return '';
  }
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Setting up context menus...');
  
  chrome.contextMenus.removeAll(() => {
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
    
    chrome.contextMenus.create({
      id: 'copy-json',
      title: 'Copy as JSON',
      contexts: ['selection']
    });
    
    console.log('✅ Context menus created');
  });
  
  // Show welcome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'clip',
    message: '🚀 Extension ready! Right-click selected text to copy.'
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('🖱️ Context menu clicked:', info.menuItemId);
  
  if (!info.selectionText) {
    console.log('⚠️ No text selected');
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
    case 'copy-json':
      transformedText = toJSON(info.selectionText);
      format = 'JSON';
      break;
  }
  
  if (transformedText) {
    await copyToClipboard(transformedText, format);
  }
});

// Keyboard shortcuts handler
chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Keyboard command:', command);
  
  switch (command) {
    case 'copy-plain':
      const selectedText = await getSelectedText();
      if (selectedText) {
        const plainText = toPlainText(selectedText);
        await copyToClipboard(plainText, 'plain text');
      } else {
        console.log('⚠️ No text selected for keyboard shortcut');
      }
      break;
      
    case 'clear-clipboard':
      try {
        await navigator.clipboard.writeText('');
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'clip',
          message: '🗑️ Clipboard cleared'
        });
        console.log('🗑️ Clipboard cleared');
      } catch (error) {
        console.error('❌ Error clearing clipboard:', error);
      }
      break;
  }
});

console.log('✅ Clip extension background script initialized');
// Utility functions for clip extension

// Clean text by removing unwanted characters
function cleanText(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove emojis (optional - can be toggled)
  // cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Clean up URLs (make them more readable)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  });
  
  return cleaned.trim();
}

// Clean HTML while preserving structure
function cleanHTML(html) {
  if (!html) return '';
  
  // Remove script and style tags completely
  html = html.replace(/<(script|style)[^>]*>.*?<\/\1>/gis, '');
  
  // Remove comments
  html = html.replace(/<!--.*?-->/gs, '');
  
  // Remove data attributes and event handlers
  html = html.replace(/\s(data-[^=]*="[^"]*"|on[^=]*="[^"]*")/g, '');
  
  // Clean up whitespace
  html = html.replace(/\s+/g, ' ');
  
  return html.trim();
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return new Date(timestamp).toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
}

// Escape HTML for safe display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Truncate text with ellipsis
function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function for search
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

// Export data as different formats
function exportData(data, format, filename) {
  let content = '';
  let mimeType = '';
  
  switch (format) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      break;
    case 'csv':
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => 
          Object.values(item).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        ).join('\n');
        content = headers + '\n' + rows;
      }
      mimeType = 'text/csv';
      break;
    case 'markdown':
      if (Array.isArray(data)) {
        content = data.map(item => {
          return `## ${item.format || 'Text'} - ${formatTimestamp(item.timestamp)}\n\n${item.text}\n\n---\n`;
        }).join('\n');
      }
      mimeType = 'text/markdown';
      break;
  }
  
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

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if running in development mode
function isDevelopment() {
  return !('update_url' in chrome.runtime.getManifest());
}

// Log with timestamp (development only)
function devLog(...args) {
  if (isDevelopment()) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
}

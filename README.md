# clip

**copy without the junk. one click, everywhere.**

A Chrome extension that lets you copy text without formatting, with support for multiple output formats and convenient keyboard shortcuts.

## Features

- 🎯 **Context Menu Integration**: Right-click any selected text to copy as plain text, markdown, or HTML
- ⌨️ **Keyboard Shortcuts**: 
  - `Alt+Shift+C` - Copy selected text as plain text
  - `Alt+Shift+X` - Clear clipboard
- 🔄 **Auto Plain Text Mode**: Toggle to always copy as plain text regardless of format
- 📝 **Copy History**: View your last 5 copied items
- 🎨 **Clean UI**: Simple, modern popup interface
- 📋 **Multiple Formats**: Support for plain text, markdown, and HTML output

## Installation & Testing

### Load Unpacked Extension

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or go to Chrome menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `clip` folder (the one containing `manifest.json`)
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "clip" and click the pin icon to keep it visible

### Testing the Extension

#### Context Menu Testing
1. **Go to any webpage** with text content
2. **Select some text** by clicking and dragging
3. **Right-click** on the selected text
4. You should see three new options:
   - "Copy as Plain Text"
   - "Copy as Markdown" 
   - "Copy as HTML"
5. **Click any option** - you should see a notification confirming the copy

#### Keyboard Shortcuts Testing
1. **Select text** on any webpage
2. **Press `Alt+Shift+C`** - should copy as plain text with notification
3. **Press `Alt+Shift+X`** - should clear clipboard with notification

#### Popup Interface Testing
1. **Click the extension icon** in the toolbar
2. **Toggle "Always copy as plain text"** - this should save your preference
3. **Click "Clear Clipboard"** - should clear clipboard and history
4. **View copy history** - should show your recent copies with timestamps
5. **Click the 📋 button** next to any history item to copy it again

#### Advanced Testing
1. **Test with formatted text** (bold, italic, links) to see format conversion
2. **Test the "always plain text" toggle** - when enabled, all context menu options should copy as plain text
3. **Test history persistence** - close and reopen the popup to ensure history is saved
4. **Test on different websites** to ensure compatibility

### Troubleshooting

If the extension doesn't work:

1. **Check the Console**
   - Go to `chrome://extensions/`
   - Click "Inspect views: background page" under the extension
   - Look for any error messages in the console

2. **Reload the Extension**
   - Click the refresh icon next to the extension in `chrome://extensions/`

3. **Check Permissions**
   - Ensure the extension has the required permissions
   - Try refreshing the webpage you're testing on

4. **Test Step by Step**
   - Test each feature individually to isolate any issues
   - Check if notifications appear (they confirm the extension is working)

## Files Structure

```
clip/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (context menus, shortcuts, clipboard)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and storage
├── styles.css            # Popup styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Development Notes

- Uses Manifest V3 (latest Chrome extension format)
- Service worker handles background operations
- Local storage for settings and history
- Modern ES6+ JavaScript
- Responsive CSS design
- Cross-platform keyboard shortcuts

## Permissions Used

- `contextMenus` - Add right-click menu options
- `clipboardWrite` - Write to system clipboard
- `storage` - Save settings and history locally
- `scripting` - Get selected text from web pages
- `notifications` - Show copy confirmations

# CITC Demo

This demo showcases the Client Input Telemetry Collection SDK in action.

## Quick Start

From the project root, run:

```bash
npm run demo
```

Then open your browser to: **http://localhost:3000/demo/**

## What It Does

The demo tracks user interactions on two input fields:
- ✅ **Keystroke events** - Individual key presses (text redacted for privacy)
- ✅ **Focus events** - When inputs gain/lose focus
- ✅ **Caret events** - Cursor position changes
- ✅ **Selection events** - Text selection within inputs
- ✅ **Clipboard events** - Copy/paste actions (content redacted)

## Try These Actions

1. **Type** in the input fields → See keystroke events
2. **Tab** between inputs → See focus/blur events
3. **Click** inside an input → See caret position
4. **Select** text with mouse → See selection events
5. **Copy/Paste** text → See clipboard events
6. **Switch tabs** → Events auto-flush (check console)
7. **Wait 3 seconds** → Automatic batch flush

## Configuration

The demo uses these settings:

```javascript
{
  fields: { mode: 'attribute', attribute: 'data-citc' },
  queue: { batchSize: 5, flushInterval: 3000 },
  privacy: { redactText: true, redactClipboard: true },
  debug: true  // Logs events to console
}
```

## Privacy Features

🔒 **All sensitive data is redacted by default:**
- Keystroke content → Shows only key metadata
- Clipboard content → Shows only length, not actual text
- Text selections → Shows only position, not content

## Console Output

Open DevTools (F12) to see:
- Event capture in real-time
- Batch flushing every 3 seconds
- Queue statistics
- Privacy filtering in action

## Files

- `index.html` - Demo page with input fields
- `demo.js` - CITC initialization and configuration
- `README.md` - This file

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev  # Uses automatic port selection
```

**Module import errors?**
```bash
npm run build  # Rebuild TypeScript
```

**No console output?**
- Open DevTools (F12)
- Ensure you're viewing demo via http:// (not file://)
- Check that dist/ folder exists with compiled files

console.log('%c[CITC Demo] Script loaded', 'color: #00bcd4; font-weight: bold');

import { CITC } from '../dist/index.js';

console.log('%c[CITC Demo] Import successful', 'color: #4caf50; font-weight: bold');

// Event counter for visual feedback
let eventCount = 0;

const telemetry = CITC({
    fields: {
        mode: 'attribute',
        attribute: 'data-citc',
        capture: {
            focus: true,
            keystroke: true,
            caret: true,
            selection: true,
            clipboard: true,
        },
    },
    privacy: {
        redactText: true,
        redactClipboard: true,
    },
    queue: {
        batchSize: 5,              // Send after 5 events
        flushInterval: 3000,       // Or after 3 seconds
        maxQueueSize: 1000,        // Drop oldest after 1000 events
    },
    lifecycle: {
        enabled: true,
        autoFlushIntervalMs: 3000,        // Flush every 3 seconds
        flushOnVisibilityChange: true,    // Flush when tab hidden
        flushOnBeforeUnload: true,        // Flush before page closes
        flushOnFormSubmit: false,         // Optional: flush on form submit
    },
    debug: true,
});

telemetry.start();

console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0');
console.log('%c CITC Demo Started', 'color: #ff9800; font-size: 16px; font-weight: bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0');
console.log('%c Try these actions:', 'color: #2196f3; font-weight: bold');
console.log('  - Type in the input fields');
console.log('  - Focus/blur the inputs');
console.log('  - Select text');
console.log('  - Move cursor position');
console.log('  - Copy/paste text');
console.log('%c  Queue Config:', 'color: #2196f3; font-weight: bold');
console.log('  - Batch size: 5 events');
console.log('  - Flush interval: 3 seconds');
console.log('  - Max queue: 1000 events');
console.log('%c Privacy: Text redaction enabled', 'color: #4caf50; font-weight: bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0');
console.log('');

// Monitor events
window.addEventListener('beforeunload', () => {
    console.log(`%c Session Summary: ${eventCount} events captured`, 'color: #ff5722; font-weight: bold');
});

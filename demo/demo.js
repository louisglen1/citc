import { CITC } from '../dist/index.js';

// ── State ────────────────────────────────────────────────────────────────────

const counts = { focus: 0, blur: 0, keystroke: 0, caret: 0, selection: 0, clipboard: 0 };
let totalCount = 0;
let instance = null;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const eventLog   = document.getElementById('event-log');
const emptyMsg   = document.getElementById('empty-msg');
const clearBtn   = document.getElementById('clear-btn');
const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const totalEl    = document.getElementById('total-count');

const capCheckboxes = {
    focus:     document.getElementById('cap-focus'),
    keystroke: document.getElementById('cap-keystroke'),
    caret:     document.getElementById('cap-caret'),
    selection: document.getElementById('cap-selection'),
    clipboard: document.getElementById('cap-clipboard'),
};

const privCheckboxes = {
    redactText:      document.getElementById('priv-text'),
    redactClipboard: document.getElementById('priv-clipboard'),
};

// ── Event type colours (mirror CSS vars) ─────────────────────────────────────

const TYPE_COLOR = {
    focus:     '#3b82f6',
    blur:      '#94a3b8',
    keystroke: '#22c55e',
    caret:     '#a855f7',
    selection: '#f97316',
    clipboard: '#0ea5e9',
};

// ── DOMTransport ─────────────────────────────────────────────────────────────

class DOMTransport {
    async send(events) {
        for (const event of events) {
            addEventToLog(event);
        }
    }
}

// ── Log rendering ─────────────────────────────────────────────────────────────

function formatTime(ts) {
    const d = new Date(ts);
    const h  = String(d.getHours()).padStart(2, '0');
    const m  = String(d.getMinutes()).padStart(2, '0');
    const s  = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
}

function dataPreview(event) {
    const d = event.data;
    const t = event.type;

    if (t === 'keystroke') {
        const key = d.key !== null ? JSON.stringify(d.key) : '•';
        const mods = ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']
            .filter(k => d[k])
            .map(k => k.replace('Key', ''))
            .join('+');
        return mods ? `${mods}+${key}` : key;
    }
    if (t === 'focus' || t === 'blur') {
        return d.focused !== undefined ? (d.focused ? 'focused' : 'blurred') : '';
    }
    if (t === 'caret') {
        const start = d.start ?? '?';
        const end   = d.end   ?? '?';
        return start === end ? `pos ${start}` : `sel ${start}–${end}`;
    }
    if (t === 'selection') {
        const text = d.text !== null ? JSON.stringify(String(d.text).slice(0, 20)) : '•';
        return `${text} (${d.start}–${d.end})`;
    }
    if (t === 'clipboard') {
        const action  = d.action ?? '';
        const content = d.content !== null ? JSON.stringify(String(d.content).slice(0, 20)) : '•';
        return `${action} ${content}`;
    }
    return JSON.stringify(d).slice(0, 40);
}

function addEventToLog(event) {
    const type = event.type;

    // Update counts
    if (counts[type] !== undefined) counts[type]++;
    totalCount++;

    const countEl = document.getElementById(`cnt-${type}`);
    if (countEl) countEl.textContent = counts[type];
    totalEl.textContent = `${totalCount} total`;

    // Hide empty message
    emptyMsg.style.display = 'none';

    // Build log row
    const row = document.createElement('div');
    row.className = 'log-entry';

    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatTime(event.timestamp);

    const badge = document.createElement('span');
    badge.className = 'log-badge';
    badge.textContent = type;
    badge.style.background = TYPE_COLOR[type] ?? '#64748b';

    const field = document.createElement('span');
    field.className = 'log-field';
    field.textContent = event.fieldId;

    const data = document.createElement('span');
    data.className = 'log-data';
    data.textContent = dataPreview(event);

    row.append(time, badge, field, data);
    eventLog.appendChild(row);

    // Auto-scroll to bottom
    eventLog.scrollTop = eventLog.scrollHeight;
}

// ── Config reading ────────────────────────────────────────────────────────────

function readConfig() {
    return {
        capture: {
            focus:     capCheckboxes.focus.checked,
            keystroke: capCheckboxes.keystroke.checked,
            caret:     capCheckboxes.caret.checked,
            selection: capCheckboxes.selection.checked,
            clipboard: capCheckboxes.clipboard.checked,
        },
        privacy: {
            redactText:      privCheckboxes.redactText.checked,
            redactClipboard: privCheckboxes.redactClipboard.checked,
        },
    };
}

// ── CITC lifecycle ────────────────────────────────────────────────────────────

function startCITC() {
    if (instance) {
        instance.stop();
        instance = null;
    }

    const { capture, privacy } = readConfig();

    instance = CITC({
        fields: {
            mode: 'attribute',
            attribute: 'data-citc',
            capture,
        },
        privacy,
        transport: new DOMTransport(),
        queue: {
            batchSize: 1,
            flushInterval: 0,
        },
    });

    instance.start();
    statusDot.classList.add('running');
    statusText.textContent = 'Running';
}

// ── Clear ─────────────────────────────────────────────────────────────────────

clearBtn.addEventListener('click', () => {
    // Remove all log rows (keep emptyMsg)
    for (const child of Array.from(eventLog.children)) {
        if (child !== emptyMsg) child.remove();
    }
    emptyMsg.style.display = '';

    // Reset counts
    for (const key of Object.keys(counts)) counts[key] = 0;
    totalCount = 0;
    for (const key of Object.keys(counts)) {
        const el = document.getElementById(`cnt-${key}`);
        if (el) el.textContent = '0';
    }
    totalEl.textContent = '0 total';
});

// ── Checkbox change → restart ─────────────────────────────────────────────────

let restartTimer = null;

function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(startCITC, 100);
}

for (const cb of Object.values(capCheckboxes)) {
    cb.addEventListener('change', scheduleRestart);
}
for (const cb of Object.values(privCheckboxes)) {
    cb.addEventListener('change', scheduleRestart);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

startCITC();

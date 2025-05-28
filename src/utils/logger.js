// logger.js
const errorLog = [];

// Log levels: 0 = none, 1 = error only, 2 = warning+error, 3 = info+warning+error, 4 = all
let LOG_LEVEL = 3; // Default to info level

// Map log types to numeric levels
const LOG_LEVEL_MAP = {
    "critical": 1,
    "error": 1,
    "warning": 2,
    "info": 3,
    "debug": 4
};

/**
 * Set the current log level
 * @param {number} level - 0 = none, 1 = error only, 2 = warning+error, 3 = info+warning+error, 4 = all
 */
export function setLogLevel(level) {
    LOG_LEVEL = level;
}

/**
 * Get the current log level
 * @returns {number} - Current log level
 */
export function getLogLevel() {
    return LOG_LEVEL;
}

/** Turn one value into a display‑friendly string */
function formatValue(v) {
    // Primitives and Dates → plain text
    if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v instanceof Date
    ) {
        return String(v);
    }

    // Errors keep their stack if available
    if (v instanceof Error) {
        return v.stack || v.message;
    }

    // Everything else → pretty JSON
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return String(v); // circular refs, Symbols, etc.
    }
}

/**
 * Core logger
 * @param {"info"|"warning"|"error"|"critical"|"debug"} [type="info"]
 * @param  {...any} parts   values just like console.log accepts
 */
export function logMessage(type = "info", ...parts) {
    const formatted = parts.map(formatValue).join(" ");

    // Persist full detail
    errorLog.push({
        type,
        parts,          // raw values as‑passed
        message: formatted, // human‑readable single line
        timestamp: formatTimestamp(),
    });

    // Only echo to console if the log level is appropriate
    const typeLevel = LOG_LEVEL_MAP[type] || 3; // Default to info level if type is unknown
    if (LOG_LEVEL >= typeLevel) {
        const fn = console[type] ?? console.log;
        fn(`[${errorLog.at(-1).timestamp}]`, ...parts);
    }
}

/* Convenience wrappers */
export const logError    = (...args) => logMessage("error",    ...args);
export const logWarning  = (...args) => logMessage("warning",  ...args);
export const logInfo     = (...args) => logMessage("info",     ...args);
export const logCritical = (...args) => logMessage("critical", ...args);

export const getErrorLog   = () => [...errorLog];
export const clearErrorLog = () => { errorLog.length = 0; };

/* MM‑DD HH:MM:SS */
function formatTimestamp(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

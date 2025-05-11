// logger.js
const errorLog = [];

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

    // (Optional) echo to console for live debugging
    const fn = console[type] ?? console.log;
    fn(`[${errorLog.at(-1).timestamp}]`, ...parts);
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

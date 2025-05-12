import {logInfo} from "./logger";

export function mergeNotes(serverNotes, localNotes) {
    const mergedMap = new Map();

    logInfo(`Note Merge: ${serverNotes.length} server notes and ${localNotes.length} local notes.`);
    [...serverNotes, ...localNotes].forEach(note => {
        if (!note.id) return;
        const existing = mergedMap.get(note.id);
        if (!existing || (note.updatedAt > existing.updatedAt)) {
            mergedMap.set(note.id, note);
        }
    });
    logInfo(`Merge complete - ${mergedMap.size}`);
    return Array.from(mergedMap.values());
}

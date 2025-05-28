export function reconcile(localNotes, serverNotes) {
    const mergedMap = new Map();
    const pushUpstream = [];

    // Index both arrays by id for O(1) lookups
    const serverById = Object.fromEntries(serverNotes.map(n => [n.id, n]));
    const localById  = Object.fromEntries(localNotes .map(n => [n.id, n]));

    // 1️⃣ Walk through union of ids
    const allIds = new Set([...Object.keys(serverById), ...Object.keys(localById)]);
    allIds.forEach(id => {
        const local  = localById[id];
        const remote = serverById[id];

        if (!remote) {
            // New locally — needs upload
            mergedMap.set(id, local);
            pushUpstream.push(local);
        } else if (!local) {
            // New on server
            mergedMap.set(id, remote);
        } else {
            // Exists in both → compare stamps
            if (local.updatedAt > remote.updatedAt) {
                mergedMap.set(id, local);
                pushUpstream.push(local);        // ours is newer
            } else if (remote.updatedAt > local.updatedAt) {
                mergedMap.set(id, remote);       // theirs is newer
            } else {
                // Equal stamp — tie‑break preferring non‑deleted, else local
                if (remote.deleted && !local.deleted) mergedMap.set(id, local);
                else mergedMap.set(id, remote);
            }
        }
    });

    return {
        merged: [...mergedMap.values()],
        pushUpstream,                       // array may be empty
    };
}

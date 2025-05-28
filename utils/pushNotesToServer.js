import {logInfo} from "./logger";

export async function pushNotesToServer(serverUrl, notesToPush) {
    if (!notesToPush.length) return;

    logInfo("Pushing notes to server: ", serverUrl, notesToPush.length);

    const response = await fetch(`${serverUrl}/notes`, {   // adjust path as needed
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notesToPush),
    });

    if (!response.ok) {
        throw new Error(`Upstream push failed: ${response.status}`);
    }
}

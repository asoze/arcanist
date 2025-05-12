export async function pushNotesToServer(serverUrl, notesToPush) {
    if (!notesToPush.length) return;

    const response = await fetch(`${serverUrl}/bulk`, {   // adjust path as needed
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notesToPush),
    });

    if (!response.ok) {
        throw new Error(`Upstream push failed: ${response.status}`);
    }
}

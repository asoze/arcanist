export async function fetchNotesFromServer(serverUrl) {
    const NOTES_ENDPOINT = (serverUrl?.endsWith("/notes") ? serverUrl : null)
        || "https://home.andrewrsweeney.com/notes";

    console.log("Fetching notes from:", NOTES_ENDPOINT);
    const response = await fetch(NOTES_ENDPOINT, {
        method: "GET",
        headers: { "Accept": "application/json" },
        mode: "cors",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`);
    }

    return await response.json();
}

/**
 * Local notes carry three sync fields on top of the server shape:
 *   version: server version, or null if the server has never seen the note
 *   dirty:   has local changes the server doesn't have yet
 *   rev:     local edit counter, used to tell whether a note changed while
 *            a push for it was in flight
 *
 * Conflicts are last-write-wins in the order the server receives writes, so
 * a dirty local note always beats incoming server copies until it is pushed.
 */

export function fromServer(note) {
  return { ...note, dirty: false, rev: 0 };
}

/** Folds the server's response to a push back into the local list. */
export function applyPushResult(notes, sent, saved) {
  return notes.flatMap((note) => {
    if (note.id !== sent.id) return [note];
    if (note.rev !== sent.rev) {
      return [{ ...note, version: saved?.version ?? note.version }];
    }
    if (sent.deleted) return [];
    return [fromServer(saved)];
  });
}

/** Applies a `GET /notes?since=` response. */
export function applyChanges(notes, { notes: incoming, reset }) {
  const byId = new Map(notes.map((note) => [note.id, note]));

  if (reset) {
    const next = new Map();
    for (const remote of incoming) {
      if (!remote.deleted) next.set(remote.id, fromServer(remote));
    }
    for (const local of notes) {
      if (local.dirty || local.version === null) next.set(local.id, local);
    }
    return [...next.values()];
  }

  for (const remote of incoming) {
    const local = byId.get(remote.id);
    if (local?.dirty) continue;
    if (remote.deleted) byId.delete(remote.id);
    else byId.set(remote.id, fromServer(remote));
  }
  return [...byId.values()];
}

export function pendingPushes(notes) {
  return notes.filter((note) => note.dirty);
}

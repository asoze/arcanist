import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { applyChanges, applyPushResult, pendingPushes } from '../src/sync/merge.js';

const note = (id, extra = {}) => ({
  id,
  title: id,
  html: '',
  tags: [],
  shared: false,
  deleted: false,
  version: 1,
  dirty: false,
  rev: 0,
  ...extra,
});

describe('applyPushResult', () => {
  it('adopts the server copy when nothing changed during the push', () => {
    const local = note('a', { title: 'mine', dirty: true, rev: 2 });
    const result = applyPushResult([local], local, { ...note('a'), title: 'mine', version: 7 });
    assert.deepEqual(result, [{ ...note('a'), title: 'mine', version: 7 }]);
  });

  it('keeps newer local edits dirty but records the version', () => {
    const sent = note('a', { title: 'v1', dirty: true, rev: 1 });
    const local = { ...sent, title: 'v2', rev: 2 };
    const [result] = applyPushResult([local], sent, { ...sent, version: 9 });
    assert.equal(result.title, 'v2');
    assert.equal(result.dirty, true);
    assert.equal(result.version, 9);
  });

  it('drops a note once its deletion is pushed', () => {
    const sent = note('a', { deleted: true, dirty: true, rev: 1 });
    assert.deepEqual(applyPushResult([sent, note('b')], sent, null), [note('b')]);
  });
});

describe('applyChanges', () => {
  it('upserts and removes incoming changes', () => {
    const result = applyChanges([note('a'), note('b')], {
      reset: false,
      notes: [note('a', { title: 'remote', version: 5 }), note('b', { deleted: true, version: 6 }), note('c')],
    });
    assert.deepEqual(result.map((n) => [n.id, n.title]), [['a', 'remote'], ['c', 'c']]);
  });

  it('never overwrites dirty local notes', () => {
    const local = note('a', { title: 'local', dirty: true, rev: 1 });
    const result = applyChanges([local], { reset: false, notes: [note('a', { title: 'remote' })] });
    assert.deepEqual(result, [local]);
  });

  it('on reset keeps only server notes plus unpushed local work', () => {
    const result = applyChanges(
      [note('stale'), note('dirty', { dirty: true }), note('new', { version: null })],
      { reset: true, notes: [note('remote'), note('gone', { deleted: true })] }
    );
    assert.deepEqual(result.map((n) => n.id).sort(), ['dirty', 'new', 'remote']);
  });
});

describe('pendingPushes', () => {
  it('returns dirty notes only', () => {
    assert.deepEqual(pendingPushes([note('a'), note('b', { dirty: true })]).map((n) => n.id), ['b']);
  });
});

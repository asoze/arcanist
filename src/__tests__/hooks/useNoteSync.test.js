// src/__tests__/hooks/useNoteSync.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { useNoteSync } from '../../hooks/useNoteSync';
import { NotesAPI } from '../../services/api';
import { reconcile } from 'arcanist-common';
import { logError } from '../../utils/logger';

jest.mock('../../services/api', () => ({
  NotesAPI: {
    fetchNotes: jest.fn(),
    pushNotes: jest.fn(),
    isConnected: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('arcanist-common', () => ({
  reconcile: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logError: jest.fn(),
}));

describe('useNoteSync', () => {
  const localNotes = [
    { id: '1', title: 'Local Note 1', updatedAt: 100 },
    { id: '2', title: 'Local Note 2', updatedAt: 200 },
  ];
  const remoteNotes = [
    { id: '1', title: 'Remote Note 1', updatedAt: 150 },
    { id: '3', title: 'Remote Note 3', updatedAt: 300 },
  ];
  const mergedNotes = [
    { id: '1', title: 'Remote Note 1', updatedAt: 150 },
    { id: '2', title: 'Local Note 2', updatedAt: 200 },
    { id: '3', title: 'Remote Note 3', updatedAt: 300 },
  ];
  const pushUpstream = [
    { id: '2', title: 'Local Note 2', updatedAt: 200 },
  ];

  const serverUrl = 'https://example.com';
  const setNotes = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset so a prior test's mockRejectedValue does not leak
    NotesAPI.fetchNotes.mockReset();
    NotesAPI.pushNotes.mockReset();
    NotesAPI.isConnected.mockReset();
    NotesAPI.isConnected.mockResolvedValue(true);
    NotesAPI.fetchNotes.mockResolvedValue(remoteNotes);
    NotesAPI.pushNotes.mockResolvedValue();
    reconcile.mockReturnValue({ merged: mergedNotes, pushUpstream });
  });

  const flushPostSync = async () => {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2_000));
    });
  };

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useNoteSync([], setNotes, serverUrl));

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncError).toBe(null);
    expect(result.current.lastSyncedAt).toBe(0);
    expect(typeof result.current.syncNotes).toBe('function');
    expect(typeof result.current.debouncedSync).toBe('function');
    expect(result.current.skipEffectRef.current).toBe(false);
  });

  it('should sync notes when syncNotes is called with force=true', async () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));

    await act(async () => {
      await Promise.resolve();
    });
    await flushPostSync();
    NotesAPI.fetchNotes.mockClear();
    NotesAPI.pushNotes.mockClear();
    reconcile.mockReturnValue({ merged: mergedNotes, pushUpstream });
    setNotes.mockClear();

    await act(async () => {
      await result.current.syncNotes(true);
    });
    await flushPostSync();

    expect(NotesAPI.fetchNotes).toHaveBeenCalledWith(serverUrl);
    expect(reconcile).toHaveBeenCalledWith(localNotes, remoteNotes);
    expect(NotesAPI.pushNotes).toHaveBeenCalledWith(serverUrl, pushUpstream);
    expect(setNotes).toHaveBeenCalledWith(mergedNotes);

    expect(result.current.syncError).toBe(null);
    expect(result.current.lastSyncedAt).toBeGreaterThan(0);
    await waitFor(() => expect(result.current.isSyncing).toBe(false), { timeout: 5000 });
  });

  it('should not sync if the interval has not passed', async () => {
    // Empty local notes: no useEffect re-sync when isSyncing flips (notes.length is 0)
    reconcile.mockReturnValue({ merged: remoteNotes, pushUpstream: [] });
    const { result } = renderHook(() => useNoteSync([], setNotes, serverUrl));

    await act(async () => {
      await result.current.syncNotes(true);
    });
    await flushPostSync();
    expect(result.current.lastSyncedAt).toBeGreaterThan(0);

    NotesAPI.fetchNotes.mockClear();
    NotesAPI.pushNotes.mockClear();
    setNotes.mockClear();

    await act(async () => {
      await result.current.syncNotes(false);
    });
    await flushPostSync();

    expect(NotesAPI.fetchNotes).not.toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Network error';
    NotesAPI.fetchNotes.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useNoteSync([], setNotes, serverUrl));

    await act(async () => {
      await result.current.syncNotes(true);
    });
    await flushPostSync();

    await waitFor(() => expect(result.current.syncError).toBe(errorMessage), { timeout: 5000 });
    await waitFor(() => expect(result.current.isSyncing).toBe(false), { timeout: 5000 });
    expect(logError).toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it(
    'should debounce sync calls',
    async () => {
      const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));

      await act(async () => {
        await Promise.resolve();
      });
      await flushPostSync();
      NotesAPI.fetchNotes.mockClear();

      act(() => {
        result.current.debouncedSync(localNotes);
        result.current.debouncedSync(localNotes);
        result.current.debouncedSync(localNotes);
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 1_100));
      });
      await flushPostSync();

      expect(NotesAPI.fetchNotes).toHaveBeenCalledTimes(2);
    },
    20_000
  );

  it('should not sync if serverUrl is not provided', async () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, null));

    await act(async () => {
      await result.current.syncNotes(true);
    });
    await flushPostSync();

    expect(NotesAPI.fetchNotes).not.toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('should not push to server if there are no changes', async () => {
    reconcile.mockReturnValue({ merged: mergedNotes, pushUpstream: [] });
    const { result } = renderHook(() => useNoteSync([], setNotes, serverUrl));

    await act(async () => {
      await result.current.syncNotes(true);
    });
    await flushPostSync();

    expect(NotesAPI.fetchNotes).toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).toHaveBeenCalledWith(mergedNotes);
  });
});

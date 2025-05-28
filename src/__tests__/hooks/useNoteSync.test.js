// src/__tests__/hooks/useNoteSync.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useNoteSync } from '../../hooks/useNoteSync';
import { NotesAPI } from '../../services/api';
import { reconcile } from '../../utils/reconcile';
import { logInfo, logError } from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/api', () => ({
  NotesAPI: {
    fetchNotes: jest.fn(),
    pushNotes: jest.fn(),
  },
}));

jest.mock('../../utils/reconcile', () => ({
  reconcile: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

describe('useNoteSync', () => {
  // Sample data
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
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock implementations
    NotesAPI.fetchNotes.mockResolvedValue(remoteNotes);
    NotesAPI.pushNotes.mockResolvedValue();
    reconcile.mockReturnValue({ merged: mergedNotes, pushUpstream });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));
    
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
      await result.current.syncNotes(true);
    });
    
    // Verify API calls
    expect(NotesAPI.fetchNotes).toHaveBeenCalledWith(serverUrl);
    expect(reconcile).toHaveBeenCalledWith(localNotes, remoteNotes);
    expect(NotesAPI.pushNotes).toHaveBeenCalledWith(serverUrl, pushUpstream);
    expect(setNotes).toHaveBeenCalledWith(mergedNotes);
    
    // Verify state updates
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncError).toBe(null);
    expect(result.current.lastSyncedAt).toBeGreaterThan(0);
    expect(logInfo).toHaveBeenCalled();
  });

  it('should not sync if the interval has not passed', async () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));
    
    // First sync
    await act(async () => {
      await result.current.syncNotes(true);
    });
    
    // Reset mocks
    NotesAPI.fetchNotes.mockClear();
    NotesAPI.pushNotes.mockClear();
    setNotes.mockClear();
    
    // Second sync without force
    await act(async () => {
      await result.current.syncNotes(false);
    });
    
    // Verify no API calls were made
    expect(NotesAPI.fetchNotes).not.toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Mock API error
    const errorMessage = 'Network error';
    NotesAPI.fetchNotes.mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));
    
    await act(async () => {
      await result.current.syncNotes(true);
    });
    
    // Verify error handling
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncError).toBe(errorMessage);
    expect(logError).toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('should debounce sync calls', async () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));
    
    // Call debouncedSync multiple times
    act(() => {
      result.current.debouncedSync(localNotes);
      result.current.debouncedSync(localNotes);
      result.current.debouncedSync(localNotes);
    });
    
    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Verify API was called only once
    expect(NotesAPI.fetchNotes).toHaveBeenCalledTimes(1);
  });

  it('should not sync if serverUrl is not provided', async () => {
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, null));
    
    await act(async () => {
      await result.current.syncNotes(true);
    });
    
    // Verify no API calls were made
    expect(NotesAPI.fetchNotes).not.toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('should not push to server if there are no changes', async () => {
    // Mock no changes to push
    reconcile.mockReturnValueOnce({ merged: mergedNotes, pushUpstream: [] });
    
    const { result } = renderHook(() => useNoteSync(localNotes, setNotes, serverUrl));
    
    await act(async () => {
      await result.current.syncNotes(true);
    });
    
    // Verify fetch was called but push was not
    expect(NotesAPI.fetchNotes).toHaveBeenCalled();
    expect(NotesAPI.pushNotes).not.toHaveBeenCalled();
    expect(setNotes).toHaveBeenCalledWith(mergedNotes);
  });
});

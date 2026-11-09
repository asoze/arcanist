// src/__tests__/services/api.test.js
import { NotesAPI } from '../../services/api';
import { logError } from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

describe('NotesAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('@react-native-community/netinfo').fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  describe('fetchNotes', () => {
    it('should fetch notes from the default server URL when no URL is provided', async () => {
      const mockNotes = [{ id: '1', title: 'Test Note' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockNotes),
      });

      const result = await NotesAPI.fetchNotes();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://home.andrewrsweeney.com/notes',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(result).toEqual(mockNotes);
    });

    it('should fetch notes from the provided server URL', async () => {
      const mockNotes = [{ id: '1', title: 'Test Note' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockNotes),
      });

      const customUrl = 'https://custom-server.com/notes';

      const result = await NotesAPI.fetchNotes(customUrl);

      expect(global.fetch).toHaveBeenCalledWith(
        customUrl,
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(result).toEqual(mockNotes);
    });

    it('should handle fetch errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(NotesAPI.fetchNotes()).rejects.toThrow();
      expect(logError).toHaveBeenCalled();
    });

    it('should handle non-ok responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(NotesAPI.fetchNotes()).rejects.toThrow();
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('pushNotes', () => {
    it('should push notes to the server', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const serverUrl = 'https://example.com';
      const notesToPush = [{ id: '1', title: 'Test Note' }];

      await NotesAPI.pushNotes(serverUrl, notesToPush);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/notes',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notesToPush),
        })
      );
    });

    it('should not make a request if there are no notes to push', async () => {
      const serverUrl = 'https://example.com';
      const notesToPush = [];

      await NotesAPI.pushNotes(serverUrl, notesToPush);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle non-ok responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const serverUrl = 'https://example.com';
      const notesToPush = [{ id: '1', title: 'Test Note' }];

      await expect(NotesAPI.pushNotes(serverUrl, notesToPush)).rejects.toThrow();
      expect(logError).toHaveBeenCalled();
    });
  });
});

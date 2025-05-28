// src/__tests__/services/api.test.js
import { NotesAPI } from '../../services/api';
import { logInfo, logError } from '../../utils/logger';

// Mock the logger functions
jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

describe('NotesAPI', () => {
  // Reset mocks before each test
  beforeEach(() => {
    fetch.mockReset();
    logInfo.mockReset();
    logError.mockReset();
  });

  describe('fetchNotes', () => {
    it('should fetch notes from the default server URL when no URL is provided', async () => {
      // Mock successful fetch response
      const mockNotes = [{ id: '1', title: 'Test Note' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockNotes),
      });

      // Call the function
      const result = await NotesAPI.fetchNotes();

      // Verify fetch was called with the default URL
      expect(fetch).toHaveBeenCalledWith(
        'https://home.andrewrsweeney.com/notes',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })
      );

      // Verify the result
      expect(result).toEqual(mockNotes);
      expect(logInfo).toHaveBeenCalled();
    });

    it('should fetch notes from the provided server URL', async () => {
      // Mock successful fetch response
      const mockNotes = [{ id: '1', title: 'Test Note' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockNotes),
      });

      const customUrl = 'https://custom-server.com/notes';

      // Call the function
      const result = await NotesAPI.fetchNotes(customUrl);

      // Verify fetch was called with the custom URL
      expect(fetch).toHaveBeenCalledWith(
        customUrl,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })
      );

      // Verify the result
      expect(result).toEqual(mockNotes);
    });

    it('should handle fetch errors', async () => {
      // Mock failed fetch response
      const errorMessage = 'Network error';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      // Call the function and expect it to throw
      await expect(NotesAPI.fetchNotes()).rejects.toThrow();

      // Verify error was logged
      expect(logError).toHaveBeenCalled();
    });

    it('should handle non-ok responses', async () => {
      // Mock non-ok fetch response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Call the function and expect it to throw
      await expect(NotesAPI.fetchNotes()).rejects.toThrow('Failed to fetch notes: 404');

      // Verify error was logged
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('pushNotes', () => {
    it('should push notes to the server', async () => {
      // Mock successful fetch response
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      const serverUrl = 'https://example.com';
      const notesToPush = [{ id: '1', title: 'Test Note' }];

      // Call the function
      await NotesAPI.pushNotes(serverUrl, notesToPush);

      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        `${serverUrl}/notes`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notesToPush),
        })
      );

      // Verify log was called
      expect(logInfo).toHaveBeenCalled();
    });

    it('should not make a request if there are no notes to push', async () => {
      const serverUrl = 'https://example.com';
      const notesToPush = [];

      // Call the function
      await NotesAPI.pushNotes(serverUrl, notesToPush);

      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle non-ok responses', async () => {
      // Mock non-ok fetch response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const serverUrl = 'https://example.com';
      const notesToPush = [{ id: '1', title: 'Test Note' }];

      // Call the function and expect it to throw
      await expect(NotesAPI.pushNotes(serverUrl, notesToPush)).rejects.toThrow('Upstream push failed: 500');

      // Verify error was logged
      expect(logError).toHaveBeenCalled();
    });
  });
});

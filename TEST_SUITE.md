# Arcanist Test Suite Documentation

This document provides an overview of the test suite implemented for the Arcanist note-taking application, with a particular focus on testing server integration and data synchronization.

## Test Suite Structure

The test suite is organized by component type in the `src/__tests__` directory:

```
src/__tests__/
  ├── services/       # Tests for API services
  ├── hooks/          # Tests for custom React hooks
  ├── components/     # Tests for UI components
  ├── screens/        # Tests for screen components
  └── utils/          # Tests for utility functions
```

## Server Integration Testing

### API Service Tests

The `api.test.js` file tests the `NotesAPI` service, which is responsible for all communication with the server:

1. **Fetch Notes Tests**:
   - Tests fetching notes from the default server URL
   - Tests fetching notes from a custom server URL
   - Tests error handling for network failures
   - Tests error handling for non-200 responses

2. **Push Notes Tests**:
   - Tests pushing notes to the server
   - Tests that empty arrays don't trigger network requests
   - Tests error handling for failed push operations

### Data Synchronization Tests

The `useNoteSync.test.js` file tests the synchronization hook that manages the bidirectional sync between local and server data:

1. **Sync Initialization**:
   - Tests that the hook initializes with the correct state
   - Tests that it doesn't sync if no server URL is provided

2. **Sync Operations**:
   - Tests that forced sync operations trigger API calls
   - Tests that sync operations respect the cooldown period
   - Tests that sync operations correctly update local state
   - Tests that sync operations correctly push local changes to the server

3. **Error Handling**:
   - Tests that API errors are properly caught and reported
   - Tests that the app continues to function after sync errors

### Data Reconciliation Tests

The `reconcile.test.js` file tests the algorithm that merges local and remote data:

1. **Merge Logic**:
   - Tests basic merging of local and remote notes
   - Tests timestamp-based conflict resolution
   - Tests handling of new local notes
   - Tests handling of new remote notes

2. **Deletion Handling**:
   - Tests that deleted notes are properly tracked
   - Tests that deletion status is preserved during merges
   - Tests that non-deleted notes are preferred when timestamps are equal

## UI Testing for Server Integration

### Component Tests

The `NoteList.test.js` file tests the component that displays notes fetched from the server:

1. **Rendering Tests**:
   - Tests that notes are correctly rendered
   - Tests that shared notes (username="All") are properly identified
   - Tests that notes are sorted by timestamp

2. **Interaction Tests**:
   - Tests that clicking on a note triggers the view action
   - Tests that clicking on delete triggers the delete action
   - Tests that clicking on a tag filters the notes

### Screen Tests

The `NoteApp.test.js` file tests the main screen component that integrates all the other components:

1. **State Management Tests**:
   - Tests that the app correctly displays notes from the context
   - Tests that the app shows the appropriate UI based on the current state (viewing, editing, etc.)

2. **User Interaction Tests**:
   - Tests that user actions like viewing, editing, and deleting notes work correctly
   - Tests that tag filtering works correctly

## Running the Tests

The test suite can be run using the following commands:

```bash
# Run all tests
./run-tests.sh

# Run all tests with coverage report
./run-tests.sh --all

# Run tests in watch mode
./run-tests.sh --watch

# Run specific test categories
./run-tests.sh --api
./run-tests.sh --hooks
./run-tests.sh --components
./run-tests.sh --utils
```

## Test Coverage

The test suite aims to provide comprehensive coverage of the server integration and data synchronization features:

1. **API Layer**: 100% coverage of the API service functions
2. **Sync Logic**: 100% coverage of the synchronization hook
3. **Data Reconciliation**: 100% coverage of the reconcile utility
4. **UI Components**: Coverage of the key rendering and interaction paths

## Mocking Strategy

To isolate tests and ensure they run quickly and reliably, the test suite uses the following mocking strategy:

1. **Network Requests**: All `fetch` calls are mocked to return predictable responses
2. **AsyncStorage**: The React Native AsyncStorage is mocked to simulate local storage
3. **Context Providers**: Context providers are mocked to provide controlled test data
4. **Components**: Child components are mocked when testing parent components

## Continuous Integration

The test suite is designed to be run as part of a CI/CD pipeline. The `package.json` includes the necessary scripts:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Conclusion

The test suite provides comprehensive coverage of the server integration and data synchronization features of the Arcanist app. By testing each layer of the application—from the API service to the UI components—we ensure that the app correctly fetches data from the server, reconciles it with local data, and displays it to the user.

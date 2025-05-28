# Arcanist - Note Taking App

A React Native note-taking application with synchronization capabilities.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
  ├── components/       # Reusable UI components
  │   ├── common/       # Generic UI components
  │   ├── providers/    # Context providers
  │   └── settings/     # Settings-related components
  ├── screens/          # Full screen components
  ├── hooks/            # Custom React hooks
  ├── services/         # API and business logic
  ├── store/            # State management
  ├── utils/            # Helper functions
  ├── styles/           # Global styles and themes
  └── __tests__/        # Test files organized by type
```

## Key Features

- Create and edit notes and lists
- Tag-based organization
- Dark/light theme support
- Server synchronization
- Offline support
- Network diagnostics

## Architecture Highlights

### State Management

The app uses React Context API with useReducer for state management:

- `NotesContext`: Manages notes data and operations
- `SettingsContext`: Manages app settings and theme

### Custom Hooks

- `useTheme`: Theme management
- `useModal`: Modal visibility management
- `useNoteSync`: Note synchronization with server
- `usePersistedNotes`: Local storage persistence

### Reusable Components

- `Button`: Styled button with variants
- `TextInput`: Enhanced text input with labels and error handling
- `Modal`: Consistent modal component
- `TagList`: Reusable tag display component

### API Layer

The `services/api.js` module encapsulates all network operations, providing a clean interface for data fetching and synchronization.

## Development

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Testing

The project includes a comprehensive test suite that covers key functionality:

```
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

#### Test Structure

Tests are organized by type in the `src/__tests__` directory:

- `services/`: Tests for API and service functions
- `hooks/`: Tests for custom React hooks
- `components/`: Tests for UI components
- `screens/`: Tests for screen components
- `utils/`: Tests for utility functions

#### Testing Focus

The test suite focuses on:

1. **API Integration**: Testing the fetch and sync operations with the server
2. **Data Reconciliation**: Ensuring proper merging of local and remote data
3. **Component Rendering**: Verifying UI components render correctly
4. **State Management**: Testing context providers and state updates
5. **User Interactions**: Simulating user actions and verifying results

## Improvements Made

1. **Organized Project Structure**: Implemented a clear directory structure with separation of concerns
2. **State Management**: Replaced scattered useState with Context API and useReducer
3. **Custom Hooks**: Created reusable hooks for common functionality
4. **Component Refactoring**: Broke down large components into smaller, focused ones
5. **Consistent Styling**: Implemented a theme system with consistent styling
6. **Error Handling**: Improved error handling throughout the app
7. **Code Reuse**: Eliminated code duplication with reusable components
8. **Performance Optimizations**: Added useCallback and memoization where appropriate
9. **Documentation**: Added JSDoc comments and improved code readability
10. **Test Suite**: Added comprehensive tests for critical functionality

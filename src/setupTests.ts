import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn().mockImplementation(() => 'test-uuid'),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress console.error in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: ReactDOM.hydrate is no longer supported') ||
       args[0].includes('Warning: ReactDOM.unmountComponentAtNode is no longer supported') ||
       args[0].includes('Warning: ReactDOM.renderSubtreeIntoContainer is no longer supported'))
    ) {
      return;
    }
    // Only log errors that are not expected test errors
    if (!args[0]?.toString().includes('Failed to load')) {
      originalError.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock fetch for asset loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<svg>Test SVG</svg>'),
  })
) as jest.Mock;

// Helper function to wait for state updates
export const waitForStateUpdate = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

// Helper function to wait for multiple state updates
export const waitForMultipleStateUpdates = async (count: number = 1) => {
  for (let i = 0; i < count; i++) {
    await waitForStateUpdate();
  }
}; 
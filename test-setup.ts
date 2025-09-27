// Test setup for Bun native test runner
// This file is loaded before all tests

// Mock DOM environment for React component tests
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set global variables
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock fetch for API tests
global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
  // Default mock response
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Console setup for cleaner test output
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out React warnings in tests
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

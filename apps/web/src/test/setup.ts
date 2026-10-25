import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Server-only modules must not load in the browser-like test environment.
vi.mock('server-only', () => ({}));

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider, useTheme } from './theme-provider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('starts on system, switches to dark on demand and remembers it', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('system');

    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => result.current.setTheme('light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

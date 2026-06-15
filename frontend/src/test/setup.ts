import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
	cleanup();
});

// jsdom does not implement scrollIntoView; stub it so components that scroll
// (e.g. chat threads) can render in tests.
if (!Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = vi.fn();
}

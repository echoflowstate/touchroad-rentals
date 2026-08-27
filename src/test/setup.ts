import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia; the app queries it for reduced motion.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// jsdom lacks scrollTo; several views call it on navigation.
window.scrollTo = (() => {}) as typeof window.scrollTo

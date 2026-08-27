import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia. The app queries it for reduced motion and
// for the breakpoint that decides between the date popover and the date sheet,
// so the stub answers width queries against window.innerWidth rather than
// returning false for everything. A test that wants the phone layout sets
// window.innerWidth before rendering.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => {
    const evaluate = () => {
      const min = /\(min-width:\s*(\d+)px\)/.exec(query)
      if (min) return window.innerWidth >= Number(min[1])
      const max = /\(max-width:\s*(\d+)px\)/.exec(query)
      if (max) return window.innerWidth <= Number(max[1])
      return false
    }
    return {
      get matches() {
        return evaluate()
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof window.matchMedia
}

// jsdom lacks scrollTo; several views call it on navigation.
window.scrollTo = (() => {}) as typeof window.scrollTo

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Latin only: the product is American English with a fixed city list, so the
// cyrillic, greek, and vietnamese faces would ship as dead weight.
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/outfit/latin-800.css'
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './index.css'
import App from './App'
import { AppDataProvider } from './state/AppState'
import { siteConfig } from './site.config'

if (siteConfig.noindex) {
  const meta = document.createElement('meta')
  meta.name = 'robots'
  meta.content = 'noindex, nofollow'
  document.head.appendChild(meta)
}

document.title = siteConfig.metaTitle

// Keep the head in step with the config rather than letting index.html drift from it.
const describedBy: [string, string][] = [
  ['meta[name="description"]', 'content'],
  ['meta[property="og:description"]', 'content'],
  ['meta[name="twitter:description"]', 'content'],
]
for (const [selector, attribute] of describedBy) {
  document.querySelector(selector)?.setAttribute(attribute, siteConfig.metaDescription)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </BrowserRouter>
  </StrictMode>,
)

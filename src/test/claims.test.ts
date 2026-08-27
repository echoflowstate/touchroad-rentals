// @ts-ignore - no Node type package is installed in this preview, and the audit
// only needs these two calls to walk the shipped files.
import { readdirSync, readFileSync } from 'node:fs'
import { SAMPLE_FLEET } from '../data/fleet'
import { CITIES } from '../site.config'

declare const process: { cwd(): string }

/**
 * The claims audit, run as a test. It walks what actually ships and fails with
 * the file and line of anything the product is not allowed to say.
 */

const ROOT = process.cwd()
const SCAN_DIRS = ['src', 'public', 'scripts']
const SCAN_FILES = ['index.html', 'netlify.toml']
const SKIP_DIRS = ['node_modules', 'dist', '.git']
const BINARY_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp4',
  '.pdf',
  '.zip',
]

/** This file. It is scanned too, so its own words are assembled at runtime. */
const SELF = 'src/test/claims.test.ts'

interface ScannedFile {
  path: string
  lines: string[]
}

function isBinary(path: string): boolean {
  const lower = path.toLowerCase()
  return BINARY_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

function readOne(relativePath: string): ScannedFile {
  const text: string = readFileSync(`${ROOT}/${relativePath}`, 'utf8')
  return { path: relativePath, lines: text.split('\n') }
}

function walk(relativeDir: string, out: ScannedFile[]): void {
  const entries = readdirSync(`${ROOT}/${relativeDir}`, { withFileTypes: true })
  for (const entry of entries) {
    const child = `${relativeDir}/${entry.name}`
    if (entry.isDirectory()) {
      if (SKIP_DIRS.indexOf(entry.name) !== -1) continue
      walk(child, out)
    } else if (entry.isFile() && !isBinary(child)) {
      out.push(readOne(child))
    }
  }
}

function collect(): ScannedFile[] {
  const out: ScannedFile[] = []
  for (const dir of SCAN_DIRS) walk(dir, out)
  for (const file of SCAN_FILES) out.push(readOne(file))
  return out
}

const FILES = collect()
/** Everything but this file, for the checks whose patterns live here literally. */
const OTHERS = FILES.filter((file) => file.path !== SELF)

function hits(files: ScannedFile[], match: (line: string) => string | null): string[] {
  const found: string[] = []
  for (const file of files) {
    file.lines.forEach((line, index) => {
      const label = match(line)
      if (label !== null) found.push(`${file.path}:${index + 1}: ${label} in ${line.trim()}`)
    })
  }
  return found
}

/**
 * Assembled from halves so the audit never writes the words it bans. The
 * shipped copy rules list every one of these.
 */
const BANNED_WORDS: string[] = [
  ['insur', 'ance'],
  ['insur', 'ed'],
  ['insur', 'e'],
  ['cover', 'age'],
  ['cover', 'ed'],
  ['protec', 'tion'],
  ['protec', 't'],
  ['veri', 'fied'],
  ['veri', 'fy'],
  ['veri', 'fication'],
  ['background ', 'check'],
  ['guaran', 'tee'],
  ['guaran', 'teed'],
  ['vet', 'ted'],
  ['scree', 'ned'],
  ['trus', 'ted'],
  ['certi', 'fied'],
  ['licen', 'sed'],
  ['peace of ', 'mind'],
].map((parts) => parts.join(''))

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)

// Assembled from fragments so the audit's own source carries none of the literals.
const STORE_TOKENS = [
  ['apps.apple', '.com'],
  ['play.google', '.com'],
  ['itunes.', 'apple'],
].map((parts) => parts.join(''))
const STORE_LINK = /(href|src|action)\s*=\s*["'][^"']*(app ?store|google ?play)/i
const EMAIL_SHAPED = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const PHONE_SHAPED = /\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}/

describe('the scan itself', () => {
  it('reaches the files that ship', () => {
    const paths = FILES.map((file) => file.path)
    expect(paths).toContain('src/site.config.ts')
    expect(paths).toContain('src/data/fleet.ts')
    expect(paths).toContain('src/App.tsx')
    expect(paths).toContain('src/index.css')
    expect(paths).toContain('index.html')
    expect(paths).toContain('netlify.toml')
    expect(paths).toContain('public/robots.txt')
    expect(paths).toContain(SELF)
    expect(paths.length).toBeGreaterThanOrEqual(30)
    expect(paths.filter((path) => isBinary(path))).toEqual([])
  })

  it('reads real lines, not empty files', () => {
    const config = FILES.find((file) => file.path === 'src/site.config.ts')
    expect(config).toBeDefined()
    expect(config ? config.lines.length : 0).toBeGreaterThan(20)
    expect(FILES.every((file) => file.lines.length > 0)).toBe(true)
    const totalLines = FILES.reduce((sum, file) => sum + file.lines.length, 0)
    expect(totalLines).toBeGreaterThan(2000)
  })
})

describe('claim language', () => {
  it('says none of the words this product is not allowed to say', () => {
    expect(BANNED_WORDS.length).toBe(19)
    const found = hits(FILES, (line) => {
      const lower = line.toLowerCase()
      const word = BANNED_WORDS.find((candidate) => lower.indexOf(candidate) !== -1)
      return word ? `banned word "${word}"` : null
    })
    expect(found).toEqual([])
  })
})

describe('dashes', () => {
  it('uses no em dash anywhere', () => {
    expect(hits(FILES, (line) => (line.indexOf(EM_DASH) !== -1 ? 'em dash' : null))).toEqual([])
  })

  it('uses no en dash anywhere', () => {
    expect(hits(FILES, (line) => (line.indexOf(EN_DASH) !== -1 ? 'en dash' : null))).toEqual([])
  })
})

describe('app store references', () => {
  it('links to no store', () => {
    const found = hits(OTHERS, (line) => {
      const lower = line.toLowerCase()
      const token = STORE_TOKENS.find((candidate) => lower.indexOf(candidate) !== -1)
      return token ? `store link "${token}"` : null
    })
    expect(found).toEqual([])
  })

  it('hangs no store name off an href', () => {
    expect(hits(OTHERS, (line) => (STORE_LINK.test(line) ? 'store href' : null))).toEqual([])
  })
})

describe('contact details', () => {
  it('publishes no email address', () => {
    expect(hits(OTHERS, (line) => (EMAIL_SHAPED.test(line) ? 'email shaped' : null))).toEqual([])
  })

  it('publishes no phone number', () => {
    expect(hits(OTHERS, (line) => (PHONE_SHAPED.test(line) ? 'phone shaped' : null))).toEqual([])
  })
})

describe('the city list', () => {
  it('is the thirteen Emerald Coast stops, in order', () => {
    expect([...CITIES]).toEqual([
      'Pensacola',
      'Gulf Breeze',
      'Niceville',
      'Crestview',
      'Mary Esther',
      'Fort Walton',
      'Shalimar',
      'Valparaiso',
      'Destin',
      'Freeport',
      'Sandestin',
      'Santa Rosa',
      'Panama City',
    ])
    expect(CITIES).toHaveLength(13)
  })
})

describe('the sample fleet', () => {
  const inClass = (name: string) =>
    SAMPLE_FLEET.filter((listing) => listing.vehicleClass === name)

  it('is twelve sample records', () => {
    expect(SAMPLE_FLEET).toHaveLength(12)
    for (const listing of SAMPLE_FLEET) {
      expect(listing.source).toBe('sample')
    }
  })

  it('holds four gas sedans between $25 and $32', () => {
    const sedans = inClass('Car').filter((listing) => listing.fuel === 'Gas')
    expect(sedans).toHaveLength(4)
    for (const listing of sedans) {
      expect(listing.pricePerDay).toBeGreaterThanOrEqual(25)
      expect(listing.pricePerDay).toBeLessThanOrEqual(32)
    }
  })

  it('holds one hybrid car at $34', () => {
    const hybrids = SAMPLE_FLEET.filter((listing) => listing.fuel === 'Hybrid')
    expect(hybrids).toHaveLength(1)
    expect(hybrids[0].vehicleClass).toBe('Car')
    expect(hybrids[0].pricePerDay).toBe(34)
  })

  it('holds two SUVs between $38 and $45', () => {
    const suvs = inClass('SUV')
    expect(suvs).toHaveLength(2)
    expect(suvs.map((listing) => listing.pricePerDay).sort((a, b) => a - b)).toEqual([38, 45])
  })

  it('holds one truck at $45, one van at $40, and one convertible at $55', () => {
    expect(inClass('Truck').map((listing) => listing.pricePerDay)).toEqual([45])
    expect(inClass('Van').map((listing) => listing.pricePerDay)).toEqual([40])
    expect(inClass('Convertible').map((listing) => listing.pricePerDay)).toEqual([55])
  })

  it('holds two golf carts between $20 and $25', () => {
    const carts = inClass('Golf cart')
    expect(carts).toHaveLength(2)
    expect(carts.map((listing) => listing.pricePerDay).sort((a, b) => a - b)).toEqual([20, 25])
  })

  it('gives every listing a line and a host first name', () => {
    for (const listing of SAMPLE_FLEET) {
      expect(listing.blurb.trim().length).toBeGreaterThan(0)
      expect(listing.hostName.trim().length).toBeGreaterThan(0)
      expect(listing.hostName.indexOf(' ')).toBe(-1)
      expect(CITIES.indexOf(listing.city)).toBeGreaterThanOrEqual(0)
    }
  })
})

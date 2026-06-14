# LOC MARC Relators

A small TypeScript wrapper around the U.S. Library of Congress (LOC) MAchine-Readable Cataloging (MARC) Relator database. Because there are hundreds of possible relationships, this small API wrapper can be used to either (1) retrieve the entire dataset or (2) accept a three-letter code and return the corresponding MARC relator, if it exists.

For those projects needing an "offline" mode, the current LOC MARC dataset is included and can be used without an internet connection.

## Requirements

- Node.js 20 or later.

## Installation

```sh
npm install loc-marc-relators
```

## Usage

Each returned relator has the following shape:

```ts
interface MarcRelator {
  code: string;  // three-letter MARC code, e.g. "aut"
  label: string; // human-readable name, e.g. "author"
  uri: string;   // fully-qualified LOC URI
}
```

### Sync API (bundled data, no network required)

The sync functions use a dataset bundled with the package. This is the recommended API for most use cases. It works offline, in build tools, and requires no `await`.

```ts
import { getAllRelators, getRelatorByCode } from 'loc-marc-relators';

// Get all 300+ relators
const relators = getAllRelators();
// [{ code: 'abr', label: 'abridger', uri: '...' }, ...]

// Look up a single relator by code (case-insensitive)
const author = getRelatorByCode('aut');
// { code: 'aut', label: 'author', uri: 'http://id.loc.gov/vocabulary/relators/aut' }

const missing = getRelatorByCode('xyz');
// null
```

The bundled dataset is refreshed automatically each month via a GitHub Actions workflow that opens a pull request if the upstream vocabulary changes.

### Async API (live data from the Library of Congress)

Use these functions when you need the absolute latest data directly from `id.loc.gov`.

```ts
import { fetchRelators, fetchRelatorByCode } from 'loc-marc-relators';

// Fetch the full vocabulary
const relators = await fetchRelators();

// Fetch a single relator by code
const author = await fetchRelatorByCode('aut');
// { code: 'aut', label: 'author', uri: '...' }

const missing = await fetchRelatorByCode('xyz');
// null
```

## API Reference

| Function | Returns | Description |
|---|---|---|
| `getAllRelators()` | `MarcRelator[]` | All relators from the bundled dataset, sorted by code |
| `getRelatorByCode(code)` | `MarcRelator \| null` | Single relator from the bundle; case-insensitive; `null` if not found |
| `fetchRelators()` | `Promise<MarcRelator[]>` | All relators fetched live from `id.loc.gov` |
| `fetchRelatorByCode(code)` | `Promise<MarcRelator \| null>` | Single relator fetched live; `null` if not found |

## Updating the bundled data manually

```sh
npm run update-data
```

This fetches the latest vocabulary from the Library of Congress and overwrites `src/data/relators.ts`. Commit the result to publish an updated bundle.

## License

MIT © Dan Cox

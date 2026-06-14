/**
 * Fetches the latest MARC relators vocabulary from the Library of Congress
 * and writes the result to src/data/relators.ts as a typed TypeScript module.
 *
 * Usage: npx tsx scripts/update-data.ts
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';

const SOURCE_URL = 'https://id.loc.gov/vocabulary/relators.json';
const OUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../src/data/relators.ts'
);

interface LocRelatorEntry {
  '@id': string;
  'http://www.loc.gov/mads/rdf/v1#code'?: [{ '@value': string }];
  'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'?: [{ '@value': string }];
}

interface MarcRelator {
  code: string;
  label: string;
  uri: string;
}

function get(url: string, redirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json', 'User-Agent': 'loc-marc-relators/update-data (https://github.com/videlais/loc-marc-relators)' } }, (res: IncomingMessage) => {
        if (
          res.statusCode !== undefined &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (redirects === 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          resolve(get(res.headers.location, redirects - 1));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main(): Promise<void> {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const raw = await get(SOURCE_URL);
  const entries: LocRelatorEntry[] = JSON.parse(raw);

  const relators: MarcRelator[] = entries
    .filter((e) => e['http://www.loc.gov/mads/rdf/v1#code'] !== undefined)
    .map((e) => ({
      code: e['http://www.loc.gov/mads/rdf/v1#code']![0]['@value'],
      label:
        e['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']?.[0]['@value'] ??
        '',
      uri: e['@id'],
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const updatedAt = new Date().toISOString().slice(0, 10);
  const lines = [
    '// AUTO-GENERATED — do not edit by hand.',
    `// Last updated: ${updatedAt}`,
    `// Source: ${SOURCE_URL}`,
    "import type { MarcRelator } from '../types/MarcRelator.js';",
    '',
    'const relators: MarcRelator[] = ' +
      JSON.stringify(relators, null, 2) +
      ';',
    '',
    'export default relators;',
    '',
  ];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
  console.log(`Wrote ${relators.length} relators to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

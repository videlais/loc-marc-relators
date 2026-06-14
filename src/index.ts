import https from 'node:https';
import type { IncomingMessage } from 'node:http';
import type { MarcRelator } from './types/MarcRelator.ts';
import bundledRelators from './data/relators.js';

export type { MarcRelator };

// ---------------------------------------------------------------------------
// Sync API — uses the bundled offline dataset
// ---------------------------------------------------------------------------

/**
 * Returns all MARC relators from the bundled dataset.
 */
export function getAllRelators(): MarcRelator[] {
  return bundledRelators;
}

/**
 * Looks up a MARC relator by its three-letter code from the bundled dataset.
 * Returns `null` if the code is not found.
 */
export function getRelatorByCode(code: string): MarcRelator | null {
  return bundledRelators.find((r) => r.code === code.toLowerCase()) ?? null;
}

const BASE_URL = 'https://id.loc.gov/vocabulary/relators';

function get(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res: IncomingMessage) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Fetch all MARC relators from the Library of Congress.
 */
export async function fetchRelators(): Promise<MarcRelator[]> {
  const raw = await get(`${BASE_URL}.json`);
  const entries: LocRelatorEntry[] = JSON.parse(raw);

  return entries
    .filter((entry) =>
      entry['http://www.loc.gov/mads/rdf/v1#code'] !== undefined
    )
    .map((entry) => ({
      code: entry['http://www.loc.gov/mads/rdf/v1#code']![0]['@value'],
      label:
        entry['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']?.[0]['@value'] ?? '',
      uri: entry['@id'],
    }));
}

/**
 * Fetch a single MARC relator by its three-letter code.
 */
export async function fetchRelatorByCode(
  code: string
): Promise<MarcRelator | null> {
  const raw = await get(`${BASE_URL}/${code.toLowerCase()}.json`);
  const entries: LocRelatorEntry[] = JSON.parse(raw);

  const entry = entries.find(
    (e) => e['http://www.loc.gov/mads/rdf/v1#code']?.[0]['@value'] === code
  );

  if (!entry) {
    return null;
  }

  return {
    code: entry['http://www.loc.gov/mads/rdf/v1#code']![0]['@value'],
    label:
      entry['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']?.[0]['@value'] ??
      '',
    uri: entry['@id'],
  };
}

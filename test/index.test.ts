import { describe, it, mock, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import https from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { fetchRelators, fetchRelatorByCode, getAllRelators, getRelatorByCode } from '../src/index.js';

// Minimal fixture representing the LoC JSON-LD response shape for one relator.
const RELATOR_FIXTURE = JSON.stringify([
  {
    '@id': 'http://id.loc.gov/vocabulary/relators/aut',
    'http://www.loc.gov/mads/rdf/v1#code': [{ '@value': 'aut' }],
    'http://www.loc.gov/mads/rdf/v1#authoritativeLabel': [{ '@value': 'Author' }],
  },
]);

/** Wraps a string body in a minimal IncomingMessage-shaped readable stream. */
function makeResponse(body: string): IncomingMessage {
  const stream = new Readable({ read() {} }) as IncomingMessage;
  stream.push(body);
  stream.push(null);
  return stream;
}

/** Returns a fake ClientRequest that satisfies the `.on('error', ...)` call. */
function fakeRequest(): ClientRequest {
  return { on: () => fakeRequest() } as unknown as ClientRequest;
}

describe('loc-marc-relators', () => {
  let originalGet: typeof https.get;

  before(() => {
    originalGet = https.get;
  });

  after(() => {
    (https as { get: typeof https.get }).get = originalGet;
  });

  beforeEach(() => {
    // Reset to original between tests so mocks don't bleed across.
    (https as { get: typeof https.get }).get = originalGet;
  });

  describe('fetchRelators()', () => {
    it('returns an array of MarcRelator objects', async () => {
      (https as { get: typeof https.get }).get = mock.fn(
        (_url: unknown, cb: (res: IncomingMessage) => void): ClientRequest => {
          cb(makeResponse(RELATOR_FIXTURE));
          return fakeRequest();
        }
      ) as typeof https.get;

      const relators = await fetchRelators();

      assert.ok(Array.isArray(relators));
      assert.equal(relators.length, 1);
      assert.equal(relators[0].code, 'aut');
      assert.equal(relators[0].label, 'Author');
      assert.ok(relators[0].uri.includes('aut'));
    });
  });

  describe('fetchRelatorByCode()', () => {
    it('returns a single relator matching the given code', async () => {
      (https as { get: typeof https.get }).get = mock.fn(
        (_url: unknown, cb: (res: IncomingMessage) => void): ClientRequest => {
          cb(makeResponse(RELATOR_FIXTURE));
          return fakeRequest();
        }
      ) as typeof https.get;

      const relator = await fetchRelatorByCode('aut');

      assert.ok(relator !== null);
      assert.equal(relator!.code, 'aut');
      assert.equal(relator!.label, 'Author');
    });

    it('returns null when the code is not found in the response', async () => {
      (https as { get: typeof https.get }).get = mock.fn(
        (_url: unknown, cb: (res: IncomingMessage) => void): ClientRequest => {
          cb(makeResponse('[]'));
          return fakeRequest();
        }
      ) as typeof https.get;

      const relator = await fetchRelatorByCode('xyz');

      assert.equal(relator, null);
    });
  });

  describe('getAllRelators()', () => {
    it('returns a non-empty array of MarcRelator objects', () => {
      const relators = getAllRelators();
      assert.ok(Array.isArray(relators));
      assert.ok(relators.length > 0);
      assert.ok(typeof relators[0].code === 'string');
      assert.ok(typeof relators[0].label === 'string');
      assert.ok(typeof relators[0].uri === 'string');
    });

    it('contains the well-known "aut" (Author) relator', () => {
      const relators = getAllRelators();
      const aut = relators.find((r) => r.code === 'aut');
      assert.ok(aut !== undefined);
      assert.equal(aut!.label, 'author');
    });
  });

  describe('getRelatorByCode()', () => {
    it('returns the correct relator for a known code', () => {
      const relator = getRelatorByCode('aut');
      assert.ok(relator !== null);
      assert.equal(relator!.code, 'aut');
      assert.equal(relator!.label, 'author');
    });

    it('is case-insensitive', () => {
      const relator = getRelatorByCode('AUT');
      assert.ok(relator !== null);
      assert.equal(relator!.code, 'aut');
    });

    it('returns null for an unknown code', () => {
      const relator = getRelatorByCode('xyz');
      assert.equal(relator, null);
    });
  });
});

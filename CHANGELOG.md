# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

## [1.0.1] - 2026-07-01

### Fixed

- Hardened `scripts/update-data.ts` to validate HTTP status and response `content-type` before parsing JSON.
- Added clearer error messages (including response previews) for upstream fetch failures.
- Added a JSON parse guard in the data update script for actionable parse errors.

## [1.0.0] - 2026-06-13

### Added

- Initial public release of `loc-marc-relators`.
- Synchronous offline API using bundled MARC relator data:
  - `getAllRelators()`
  - `getRelatorByCode(code)`
- Asynchronous live API that fetches from Library of Congress:
  - `fetchRelators()`
  - `fetchRelatorByCode(code)`
- TypeScript type exports for `MarcRelator`.
- Data update script (`npm run update-data`) to refresh bundled relators.
- Tests covering core sync and async APIs.

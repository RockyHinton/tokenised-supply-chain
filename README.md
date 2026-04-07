# SupplyChain Ledger Prototype

A clean, modular V1 web application that simulates how supply-chain provenance events would be prepared for submission to the Hedera Consensus Service (HCS), without connecting to Hedera yet.

## What The Prototype Does

- Creates and tracks supply-chain assets or batches through a fixed lifecycle.
- Records lifecycle events such as `batch_created`, `certificate_attached`, `shipped`, `received`, and `inspected`.
- Validates lifecycle transitions centrally before state changes are persisted.
- Transforms app events into an HCS-style event payload with the exact target shape defined for this prototype.
- Submits those payloads to a mock ledger adapter that behaves like a future Hedera integration point.
- Stores assets, events, documents, and mock ledger records locally in a JSON-backed repository.
- Renders event history as a transparent audit timeline.

## Architecture Overview

The app is structured as a foundation for a real product rather than a one-off demo.

### App layer

- `app/`
- App Router pages render dashboard, assets, event recording, document registry, and a mock ledger explorer.
- API routes expose asset, event, document, and ledger operations.

### Service layer

- `lib/services/`
- Coordinates business workflows such as asset creation, event recording, payload preparation, and document creation.
- Keeps business rules out of UI components and route handlers.

### Validation layer

- `lib/validation/`
- Shared Zod schemas validate inbound API payloads.
- Lifecycle transitions are enforced centrally in `lifecycleRules.ts`.

### Ledger layer

- `lib/ledger/ledgerAdapter.ts`
- `lib/ledger/mockLedgerAdapter.ts`
- The adapter contract isolates ledger submission from the rest of the app so a real Hedera implementation can replace the mock adapter later with minimal refactoring.

### Payload builder

- `lib/events/buildEventPayload.ts`
- Converts internal asset, event, and document context into the exact HCS-style payload shape required for the prototype.

### Repository and persistence layer

- `lib/repositories/`
- `lib/db/`
- Repositories isolate local persistence access.
- V1 uses a JSON store at `data/store.json`, seeded automatically on first read.
- This keeps migration to a real database straightforward because business logic does not depend on file-system details.

## Mock Ledger Flow

1. A user creates an asset or records an event.
2. The relevant service validates the request and lifecycle transition.
3. The event context is transformed into an HCS-style payload.
4. The payload is submitted through the ledger adapter interface.
5. The mock adapter returns a simulated HCS submission result:
   - mock topic ID
   - incrementing sequence number
   - consensus timestamp
   - deterministic message hash
   - exact submitted payload
6. The asset, event, optional document, and mock ledger record are persisted locally.
7. The UI renders the resulting audit history and ledger traceability.

## Local Persistence

- Store file: `data/store.json`
- Seed file: `lib/db/seed.ts`
- Predictable IDs are generated for:
  - `asset_000001`
  - `evt_000001`
  - `doc_000001`
  - `mlr_000001`
- Mock ledger sequence numbers increment independently from record IDs.

## API Surface

### Assets

- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/[assetId]`

### Events

- `GET /api/events`
- `POST /api/events`
- `GET /api/events/[eventId]`

### Ledger

- `POST /api/ledger/prepare`
- `POST /api/ledger/submit`
- `GET /api/ledger/records`
- `GET /api/ledger/records/[ledgerRecordId]`

### Documents

- `GET /api/documents`
- `POST /api/documents`

## Running Locally

### Requirements

- Node.js `20.11+`
- npm `10+` recommended

### Install

If your shell defaults to an older Node version, switch to a modern version before installing. In this environment, Node 22 is available at:

```bash
export PATH=/Users/rockyhinton/.nvm/versions/node/v22.20.0/bin:$PATH
```

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Future Hedera Integration Points

The main swap point for real network support is the ledger adapter layer.

### Replace or extend

- `lib/ledger/mockLedgerAdapter.ts`

### Likely future additions

- Real Hedera SDK submission to HCS
- Topic configuration and environment variables
- Mirror node retrieval and reconciliation
- Ledger receipt verification and retry logic
- HTS tokenisation flows
- Document upload and object storage
- Authentication and role-based actor controls
- Barcode or QR-assisted asset/event input

## Notes

- No real Hedera calls are made in V1.
- No API keys, operator IDs, or private keys are required.
- The UI is intentionally minimal and extensible.
- Seeded demo data makes the prototype usable immediately after first run.

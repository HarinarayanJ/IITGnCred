
# IITGNCred

IITGnCred is a proof-of-concept decentralized identity and credential platform combining Ethereum smart contracts, IPFS, and a Node/React full-stack server and frontend.

**Status:** Development

**Contents:**
- Smart contracts (Truffle) in the [Blockchain](Blockchain) folder
- Server and tests in the [Server](Server) folder
- React frontend in the [src](src) folder
- Utilities in the [Utils](Utils) and [src/utils](src/utils) folders

## Key Features
- DID and identity registry smart contract
- Admin / Issuer / Holder / Verifier flows implemented in backend and frontend
- IPFS integration for storing artifacts
- Chatbot with voice recognition for assistance

## Prerequisites
- Node.js (>=16 recommended)
- npm
- Ganache (for local Ethereum test node)
- IPFS (optional — tests may require IPFS)
- Truffle (for migrations)

## Quickstart (local development)

1. Start Ganache (local Ethereum):

```bash
ganache
```

2. (Optional) Start IPFS daemon offline (if testing IPFS flows):

```bash
cd D:\kubo_v0.39.0_windows-amd64\kubo
.\ipfs.exe daemon --offline
```

3. Deploy smart contracts (from project root):

```bash
cd Blockchain
truffle migrate --reset
```

4. Start the backend server (Server folder):

```bash
cd Server
npm run dev
```

5. Start the frontend (from project root):

```bash
npm install
npm start
```

Alternatively use the included VS Code tasks (see `.vscode/tasks.json`) — run the "5. Launch Full Stack" task to run the sequence.

## Running Tests
- Server tests are in [Server/Test](Server/Test). Run from the `Server` folder:

```bash
cd Server
npm test
# or use jest on a single test
npx jest ./Test/7_CredentialIssue.test.js
```

## Folder Overview
- [Blockchain](Blockchain): Truffle config, contracts, and migrations.
- [Server](Server): Node backend, tests in `Test/`, utilities in `Utils/`.
- [src](src): React frontend, main components in `src/components`.
- [public](public): Frontend static assets and `index.html`.

## Notable files
- Contract build artifact: [Blockchain/build/contracts/IdentityRegistry.json](Blockchain/build/contracts/IdentityRegistry.json)
- Server entry: [Server/Server.js](Server/Server.js)
- Frontend entry: [src/index.js](src/index.js)

## Development Notes
- If a test fails related to IPFS, ensure an IPFS daemon is running (or mock/adjust tests).
- Tests and server rely on the contracts being migrated to the local Ganache network.
- If ports conflict, adjust `Server` or frontend port settings.

- **Tests:** Server unit tests have been run locally and are currently passing (Server/Test) — Feb 7, 2026.

---



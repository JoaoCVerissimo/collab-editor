# Collab Editor

A real-time collaborative document editor, similar to Google Docs. Multiple users can edit the same document simultaneously with live cursors, comments, version history, and offline support.

Built with CRDTs (Conflict-free Replicated Data Types) for conflict-free real-time synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                         │
│                                                             │
│  ┌──────────────┐   WebSocket    ┌───────────────────────┐  │
│  │   Next.js    │◄──────────────►│  Collaboration Server │  │
│  │   Frontend   │   (Yjs sync)   │  (y-websocket)        │  │
│  │   :3000      │                │  :1234                │  │
│  │              │   REST/HTTP    ├───────────────────────┤  │
│  │              │◄──────────────►│  Backend API          │  │
│  │              │                │  (Express + TS)       │  │
│  └──────────────┘                │  :4000                │  │
│                                  └──────────┬────────────┘  │
│                                             │ SQL           │
│                                  ┌──────────▼────────────┐  │
│                                  │     PostgreSQL :5432   │  │
│                                  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### System Components

| Component | Port | Description |
|-----------|------|-------------|
| **Frontend** | 3000 | Next.js app with Tiptap collaborative editor |
| **Backend API** | 4000 | Express REST API for documents, comments, versions, auth |
| **Collaboration Server** | 1234 | y-websocket server for real-time CRDT synchronization |
| **PostgreSQL** | 5432 | Persistent storage for documents, users, comments, versions |

### Data Flows

- **Editing**: User types → Tiptap updates local Y.Doc → y-websocket sends delta → Collaboration Server broadcasts to all clients → CRDTs guarantee convergence
- **Persistence**: Collaboration Server serializes Y.Doc state → stores in PostgreSQL
- **Metadata**: Document CRUD, comments, versions, auth → REST API
- **Awareness**: Cursor positions, user names/colors → Yjs awareness protocol over WebSocket

## How CRDTs Work (Yjs / YATA Algorithm)

**CRDTs** (Conflict-free Replicated Data Types) are data structures designed so that replicas can be modified independently and concurrently, always converging to the same state when synced — no central authority needed.

### Yjs Implementation

Yjs uses the **YATA** (Yet Another Transformation Approach) algorithm:

1. **Y.Doc** contains named shared types (`Y.Text`, `Y.XmlFragment`, `Y.Array`, `Y.Map`)
2. **Unique operation IDs**: Every operation gets `(clientID, clock)` — globally unique, total ordering
3. **Insert resolution**: Each insert carries left and right "origin" references. When two inserts target the same position, the one with the smaller `clientID` goes first. This is deterministic — all clients converge regardless of operation arrival order
4. **Commutativity + Idempotency**: Operations produce the same result in any order, and duplicates are no-ops
5. **Tombstoning**: Deleted items are marked (not removed), so late-arriving inserts can still reference them
6. **Offline sync**: Edits accumulate locally in Y.Doc + IndexedDB. On reconnect, state vectors enable efficient diff exchange

### Why No Conflicts

The math guarantees convergence. Two users typing at the same position get a deterministic ordering. Two users editing different parts merge trivially. No "conflict resolution dialog" is ever needed. Offline edits queue locally and merge seamlessly on reconnect via state vector diffing.

## Features

- **Real-time collaborative editing** — Multiple users edit simultaneously with instant sync
- **Collaborative cursors** — See other users' cursor positions and selections with name labels
- **Comments** — Add comments to documents with threading and resolution
- **Version history** — Save snapshots and restore previous versions
- **Offline editing** — Edit without internet; changes sync automatically on reconnect (via IndexedDB)
- **Conflict resolution** — Automatic via CRDTs — no manual merge needed, ever

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Editor | Tiptap (ProseMirror) with collaborative extensions |
| CRDT | Yjs with y-websocket, y-indexeddb, y-prosemirror |
| Backend API | Express, TypeScript, Zod validation |
| Database | PostgreSQL 16, Knex.js query builder |
| Auth | JWT (bcryptjs for password hashing) |
| Infrastructure | Docker Compose |
| CI/CD | GitHub Actions |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and start everything
make docker-up

# Services:
#   Frontend:      http://localhost:3000
#   Backend API:   http://localhost:4000
#   Collab Server: ws://localhost:1234
#   PostgreSQL:    localhost:5432
```

### Option 2: Local Development

Prerequisites: Node.js 20+, PostgreSQL 16+

```bash
# 1. Install dependencies
make install

# 2. Create the database
createdb collab_editor

# 3. Run migrations
make migrate

# 4. Start all services
make dev
```

### Testing It

1. Open http://localhost:3000
2. Register a new account
3. Create a document
4. Open the same document URL in another browser/incognito tab
5. Log in with a different account (or the same one)
6. Type in both tabs — edits sync in real-time with colored cursors!

## Project Structure

```
collab-editor/
├── package.json                     # npm workspaces root
├── tsconfig.base.json               # Shared TypeScript config
├── docker-compose.yml               # All services
├── Makefile                         # Common commands
├── .github/workflows/ci.yml        # GitHub Actions CI
├── packages/
│   ├── shared/                      # Shared types and constants
│   ├── database/                    # Knex migrations
│   ├── backend/                     # Express REST API
│   ├── collaboration/               # y-websocket CRDT server
│   └── frontend/                    # Next.js app
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List user's documents |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/:id` | Get document |
| PATCH | `/api/documents/:id` | Update title |
| DELETE | `/api/documents/:id` | Delete (owner only) |
| POST | `/api/documents/:id/share` | Share with user |
| GET | `/api/documents/:id/collaborators` | List collaborators |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/:id/comments` | List comments |
| POST | `/api/documents/:id/comments` | Add comment |
| PATCH | `/api/comments/:id` | Update/resolve |
| DELETE | `/api/comments/:id` | Delete comment |

### Versions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/:id/versions` | List versions |
| POST | `/api/documents/:id/versions` | Save snapshot |
| POST | `/api/documents/:id/versions/:vid/restore` | Restore version |

## Database Schema

- **users** — id, email, display_name, password_hash, avatar_url
- **documents** — id, title, owner_id, yjs_state (BYTEA), timestamps
- **document_versions** — id, document_id, yjs_snapshot, content_text, version_num, label
- **comments** — id, document_id, author_id, anchor (JSONB), content, parent_id, resolved
- **collaborators** — id, document_id, user_id, permission (view/comment/edit/admin)

## Available Commands

```bash
make install        # Install dependencies
make dev            # Start all dev servers
make build          # Build all packages
make test           # Run tests
make lint           # Lint all packages
make typecheck      # Type check all packages
make migrate        # Run database migrations
make docker-up      # Build and start with Docker Compose
make docker-down    # Stop Docker services
make docker-clean   # Stop and remove volumes
make clean          # Remove build artifacts
```

## License

MIT

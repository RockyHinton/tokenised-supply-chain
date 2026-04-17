# PROJECT: Tokenised Supply Chain System

## Purpose
This system models a tokenised supply chain where assets move through a lifecycle and events are recorded to create an immutable, auditable history.

The system is designed to simulate how real-world supply chains can be verified using a distributed ledger (Hedera-style event logging).

---

## Core Concepts

### Asset
A tracked entity that moves through a lifecycle:
Created → Certified → Shipped → Received → Inspected

### Event
An immutable record representing a state change or action taken on an asset.

Events:
- must never be modified after creation
- represent the source of truth for system state
- may optionally be anchored to a ledger

### Ledger
A verification layer (not the source of business logic).

- Used to anchor event hashes / proofs
- Not required for core system functionality
- Must not be tightly coupled to business logic

### Chain of Custody
Represents ownership/control transitions across entities:
Supplier → Logistics → Warehouse → Manufacturer

Must always be:
- traceable
- complete
- sequentially valid

---

## Architecture

### High-Level Structure

- Frontend: Next.js (App Router)
- Backend: Service + Repository pattern
- Data: Local JSON (temporary persistence layer)
- Ledger: Abstracted via adapter pattern

---

### Layers

#### 1. UI Layer
- Responsible for presentation only
- Must not contain business logic
- Communicates through services

---

#### 2. Service Layer (Business Logic)
- Orchestrates workflows
- Validates rules and transitions
- Creates and processes events
- Enforces lifecycle constraints

This is the most important layer.

---

#### 3. Repository Layer (Data Access)
- Handles persistence
- Abstracts storage mechanism
- No business logic allowed

---

#### 4. Ledger Adapter
- Handles interaction with external ledger
- Must be replaceable (mock vs real)
- Only used for verification / anchoring

---

## Rules (STRICT)

- Do NOT break separation between service and repository layers
- Do NOT introduce business logic into UI components
- Do NOT mutate events after creation
- Do NOT tightly couple ledger logic to core workflows
- Always validate data before processing
- Maintain deterministic behaviour across all flows

---

## Event System Constraints

- Events are append-only
- Each event must:
  - reference an asset
  - define a clear transition
  - include timestamp + actor + location (if applicable)
- Invalid lifecycle transitions must be rejected
- Missing steps should be detectable (risk flags)

---

## Lifecycle Integrity

The system must ensure:

- No skipping required stages
- No duplicate or conflicting transitions
- Clear progression through lifecycle stages
- Ability to audit full asset history at any time

---

## Priorities

1. Auditability (MOST IMPORTANT)
2. Deterministic system behaviour
3. Clear and maintainable architecture
4. Replaceable infrastructure (ledger, storage)
5. Scalability of event processing

---

## Performance Guidance

- Do not scan unnecessary files
- Focus only on relevant modules when analyzing
- Prefer targeted reasoning over full-repo analysis
- Avoid expensive operations unless explicitly required

---

## When Making Changes

Claude must:

1. Explain the plan before implementing
2. Make changes in small, controlled steps
3. Avoid large, sweeping modifications
4. Preserve existing architecture unless explicitly told to refactor
5. Highlight trade-offs when proposing changes

---

## When Analyzing

Claude should:

- Start with high-level structure
- Then zoom into relevant subsystems
- Avoid reading every file unless necessary
- Clearly separate facts vs assumptions

---

## Design Philosophy

This system models a **real-world distributed coordination problem**.

The ledger is:
- a **shared trust layer**
- not the system itself

The goal is to demonstrate:
- how coordination works WITHOUT a central authority
- how verification can be layered on top of existing logic

---

## Future Direction

- Integration with real ledger (Hedera HCS)
- Multi-party coordination simulation
- Tokenisation of assets / ownership
- Risk detection and audit tooling

---

## Constraints for Claude

- Only operate within this project directory
- Do not access parent directories
- Do not modify system-level files
- Do not introduce unnecessary dependencies

---

## Output Expectations

Responses should be:

- structured
- concise but insightful
- focused on system-level understanding
- aligned with real-world distributed systems thinking
# Project Overview
Tokenised supply chain system using event-based architecture and ledger verification.

# Architecture
- Next.js frontend
- Service layer (business logic)
- Repository layer (data access)
- Ledger abstraction for event recording

# Rules
- Do not break service/repository separation
- All data must be validated
- Events are immutable
- Maintain clear chain-of-custody flow

# Constraints
- Only operate within this project directory
- Do not scan unnecessary files
- Focus on relevant parts of the system when prompted

# Priorities
- Auditability
- Deterministic behaviour
- Clean architecture
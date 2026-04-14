<p align="center">
  <img src="docs/assets/banner.svg" alt="Pulse banner" width="100%"/>
</p>

<h1 align="center">Pulse</h1>

<p align="center">
  API monitoring platform — real-time uptime tracking with configurable assertions
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

---

## Overview

Pulse executes periodic HTTP checks against registered endpoints, evaluates configurable assertions per monitor, persists the result history, and sends alerts when a service changes state. The dashboard reflects all monitor states in real time via WebSockets.

## Documentation

| Document | Description |
|----------|-------------|
| [PLX-OVW-001](docs/core/PLX-OVW-001-overview.md) | Project overview and stack |
| [PLX-ARCH-002](docs/technical/PLX-ARCH-002-architecture.md) | System architecture and modules |
| [PLX-DATA-003](docs/technical/PLX-DATA-003-data-model.md) | Data model and MongoDB schemas |
| [PLX-API-004](docs/api/PLX-API-004-reference.md) | API reference |
| [PLX-UC-005](docs/core/PLX-UC-005-use-cases.md) | User-facing use cases |
| [PLX-ADR-006](docs/core/PLX-ADR-006-decisions.md) | Architecture decision records |

## Stack

**Backend** — NestJS / TypeScript / MongoDB (Mongoose) / BullMQ + Redis / WebSockets

**Frontend** — React 18 / Vite / TypeScript / Tailwind CSS / Zustand

## Author

[github.com/Loksz](https://github.com/Loksz)

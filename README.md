# Sales Force Automation System

CRM for property sales.

## Documentation

All project documentation is located in [`docs/`](docs/README.md) and organized by category:

| Category | Path | Contents |
| --- | --- | --- |
| System Specifications & Design | [`docs/01-requirements/`](docs/01-requirements/) | BRD, FSD, ERD |
| API Design | [`docs/02-api/`](docs/02-api/) | API design for each module |
| Infrastructure & Operations | [`docs/03-infrastructure/`](docs/03-infrastructure/) | CI/CD, database backup, deployment |

See [docs/README.md](docs/README.md) for the full index.

## Repository Structure

```
sales-force/
├── docs/                       # Project documentation
├── sales-force-be/             # Backend (NestJS)
├── sales-force-fe-react/       # Frontend (React + Vite)
├── docker/                     # Nginx configuration & DB init
├── scripts/                    # Utility scripts
├── docker-compose*.yml         # Docker Compose configuration
└── Makefile                    # Command shortcuts
```

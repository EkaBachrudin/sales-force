# Sales Force Automation System

CRM untuk sales properti.

## Dokumentasi

Seluruh dokumentasi proyek berada di [`docs/`](docs/README.md) dan dikelompokkan berdasarkan kategori:

| Kategori | Path | Isi |
| --- | --- | --- |
| Spesifikasi & Desain Sistem | [`docs/01-requirements/`](docs/01-requirements/) | BRD, FSD, ERD |
| API Design | [`docs/02-api/`](docs/02-api/) | Desain API tiap modul |
| Infrastruktur & Operasional | [`docs/03-infrastructure/`](docs/03-infrastructure/) | CI/CD, backup database, deployment |

Lihat [docs/README.md](docs/README.md) untuk index lengkap.

## Struktur Repo

```
sales-force/
├── docs/                       # Dokumentasi proyek
├── sales-force-be/             # Backend (NestJS)
├── sales-force-fe-react/       # Frontend (React + Vite)
├── docker/                     # Konfigurasi nginx & init DB
├── scripts/                    # Script utilitas
├── docker-compose*.yml         # Konfigurasi Docker Compose
└── Makefile                    # Command shortcuts
```

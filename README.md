# AquaLedger360

Product and inventory management: Django REST API + PostgreSQL (React frontend in a later step).

## Project structure

```text
AquaLedger360/
├── docker-compose.yml          # PostgreSQL
├── backend/
│   ├── config/                 # Django settings, URLs, pagination
│   └── apps/
│       ├── accounts/           # User, JWT, customers
│       ├── catalog/            # Categories, products, images
│       └── orders/             # Cart, checkout, stock, reports
└── frontend/                   # Vite + React storefront
```

## Quick start (SQLite, no Docker)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API docs: http://127.0.0.1:8000/api/docs/

### Demo accounts (after `seed_demo`)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@aqualedger360.test` | `OwnerPass123!` |
| Customer | `customer@aqualedger360.test` | `CustomerPass123!` |

`seed_demo` runs in order: **owner → customer → categories → products → product photos**. It is safe to run again; records are matched by email, category slug, and product SKU.

```powershell
# AquaLedger catalog: fish, plants, medicine, liquids (18 SKUs)
python manage.py seed_demo --skip-owner --skip-customer --refresh-images
```

Each SKU has a **unique illustration** (species, plant, medicine pack, or liquid bottle).

```powershell
# Catalog only (you already have an owner)
python manage.py seed_demo --skip-owner

# Only categories and products
python manage.py seed_demo --skip-owner --skip-customer
```

`create_owner` is still available if you only need an admin user without sample catalog data.

## PostgreSQL (recommended)

```powershell
cd ..
docker compose up -d
cd backend
# In .env set DB_ENGINE=postgres
python manage.py migrate
```

## Frontend (Step 3 — customer storefront)

Run the API and the Vite dev server in **two terminals**:

```powershell
# Terminal 1 — API
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver

# Terminal 2 — React
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/

| Page | Path |
|------|------|
| Catalog (search, category, stock, sort) | `/` |
| Product detail | `/products/:id` |
| Sign in / Register | `/login`, `/register` |
| Cart & checkout | `/cart`, `/checkout` |
| Order history | `/orders`, `/orders/:id` |

Vite proxies `/api` and `/media` to `http://127.0.0.1:8000`. JWT tokens are stored in `localStorage` and refreshed automatically.

## Owner admin console (Step 4)

Sign in as **owner** → redirected to http://localhost:5173/admin

| Area | Features |
|------|----------|
| **Overview** | Revenue, stock alerts, order status chart, recent orders |
| **Products** | Search, pagination, create/edit, stock highlights, image upload, show/hide |
| **Categories** | Create, edit, activate/deactivate |
| **Orders** | Filter by status, search, workflow buttons (stock restored on cancel) |
| **Customers** | Searchable directory |

Storefront extras: category quick filters, cart badge, toast notifications.

## Step 5 — Exports, print, production Docker

### CSV exports (owner, JWT)

| Endpoint | File |
|----------|------|
| `GET /api/reports/export/orders/?status=pending` | Orders |
| `GET /api/reports/export/products/` | Product catalog |
| `GET /api/reports/export/inventory/` | Stock alerts |
| `GET /api/reports/export/customers/` | Customers |

Use **Export CSV** in the admin header (or on the Orders page with the current status filter).

### Print

- Admin order detail → **Print invoice** (packing slip layout)
- Customer order detail → **Print receipt**

### Full stack with Docker

```powershell
cd AquaLedger360
copy .env.production.example .env
# Edit DJANGO_SECRET_KEY and POSTGRES_PASSWORD

docker compose --profile full up --build
```

| Service | URL |
|---------|-----|
| Web (React + nginx) | http://localhost:8080 |
| API | http://localhost:8000 |
| API health | http://localhost:8000/api/health/ |

Database only (dev): `docker compose up db`

On first start, `SEED_DEMO_ON_START=true` runs `seed_demo` inside the API container.

## Tests

```powershell
cd backend
pytest
```

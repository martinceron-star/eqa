# OC Dashboard SaaS MVP

Herramienta SaaS mínima para operar el dashboard ejecutivo del Organismo de Certificación.

## Funcionalidades MVP

- Multi-tenant vía header `X-Tenant-ID`.
- Seguridad básica con bearer token y roles (`admin`, `manager`, `viewer`).
- CRUD inicial de KPIs (alta y listado).
- Evaluación automática de alertas según semáforo.
- Endpoint de forecast simple para proyección operativa.
- Interfaz web básica para operación diaria.

## Endpoints principales

- `GET /health`
- `GET /api/v1/kpis`
- `POST /api/v1/kpis`
- `GET /api/v1/alerts`
- `POST /api/v1/alerts/evaluate`
- `GET /api/v1/forecast/kpi_current_value_avg?horizon_days=30`

## Ejecutar local

```bash
cd saas_oc_dashboard
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abrir: `http://127.0.0.1:8000/`

## Tokens de demo

- `admin-token`
- `manager-token`
- `viewer-token`

> Para pruebas rápidas, la UI usa `admin-token`.

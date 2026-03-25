from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
HEADERS = {"Authorization": "Bearer admin-token", "X-Tenant-ID": "demo"}


def test_health() -> None:
    r = client.get('/health')
    assert r.status_code == 200


def test_create_and_list_kpi() -> None:
    payload = {
        "area": "Comercial",
        "name": "Pipeline Activo",
        "formula": "monto_total",
        "frequency": "semanal",
        "target": 100.0,
        "threshold_green": 100.0,
        "threshold_yellow": 80.0,
        "current_value": 90.0,
        "owner": "Gerente",
        "source": "CRM",
        "recommended_action": "impulsar oportunidades",
    }
    c = client.post('/api/v1/kpis', json=payload, headers=HEADERS)
    assert c.status_code == 200

    l = client.get('/api/v1/kpis', headers=HEADERS)
    assert l.status_code == 200
    assert len(l.json()) >= 1

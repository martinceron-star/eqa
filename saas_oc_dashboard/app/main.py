from datetime import datetime, UTC
from pathlib import Path
from statistics import mean

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .db import get_conn, init_db
from .schemas import AlertOut, ForecastOut, KPICreate, KPIOut
from .security import get_user, require_write_role, UserContext

app = FastAPI(title="OC Dashboard SaaS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def home() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "oc-dashboard-saas"}


@app.get("/api/v1/kpis", response_model=list[KPIOut])
def list_kpis(
    area: str | None = None,
    tenant_id: str = Header(default="demo", alias="X-Tenant-ID"),
    _: UserContext = Depends(get_user),
) -> list[KPIOut]:
    query = "SELECT * FROM kpis WHERE tenant_id = ?"
    args: list[str] = [tenant_id]
    if area:
        query += " AND area = ?"
        args.append(area)

    with get_conn() as conn:
        rows = conn.execute(query, args).fetchall()

    return [KPIOut(**dict(row)) for row in rows]


@app.post("/api/v1/kpis", response_model=KPIOut)
def create_kpi(
    payload: KPICreate,
    tenant_id: str = Header(default="demo", alias="X-Tenant-ID"),
    user: UserContext = Depends(get_user),
) -> KPIOut:
    require_write_role(user.role)
    now = datetime.now(UTC).isoformat()

    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO kpis (
                tenant_id, area, name, formula, frequency, target,
                threshold_green, threshold_yellow, current_value,
                owner, source, recommended_action, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tenant_id,
                payload.area,
                payload.name,
                payload.formula,
                payload.frequency,
                payload.target,
                payload.threshold_green,
                payload.threshold_yellow,
                payload.current_value,
                payload.owner,
                payload.source,
                payload.recommended_action,
                now,
            ),
        )
        kpi_id = cur.lastrowid
        conn.execute(
            "INSERT INTO audit_log (tenant_id, actor, action, detail, created_at) VALUES (?, ?, ?, ?, ?)",
            (tenant_id, user.user, "kpi.create", f"kpi_id={kpi_id}", now),
        )
        row = conn.execute("SELECT * FROM kpis WHERE id = ?", (kpi_id,)).fetchone()

    return KPIOut(**dict(row))


def _severity(current_value: float, green: float, yellow: float) -> str:
    if current_value >= green:
        return "green"
    if current_value >= yellow:
        return "yellow"
    return "red"


@app.post("/api/v1/alerts/evaluate", response_model=list[AlertOut])
def evaluate_alerts(
    tenant_id: str = Header(default="demo", alias="X-Tenant-ID"),
    user: UserContext = Depends(get_user),
) -> list[AlertOut]:
    require_write_role(user.role)
    created: list[AlertOut] = []
    now = datetime.now(UTC).isoformat()

    with get_conn() as conn:
        kpis = conn.execute("SELECT * FROM kpis WHERE tenant_id = ?", (tenant_id,)).fetchall()
        for kpi in kpis:
            sev = _severity(kpi["current_value"], kpi["threshold_green"], kpi["threshold_yellow"])
            if sev == "green":
                continue
            message = f"{kpi['name']} en {sev}: ejecutar acción de {kpi['recommended_action']}"
            cur = conn.execute(
                "INSERT INTO alerts (tenant_id, kpi_id, severity, message, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)",
                (tenant_id, kpi["id"], sev, message, now),
            )
            alert_id = cur.lastrowid
            conn.execute(
                "INSERT INTO audit_log (tenant_id, actor, action, detail, created_at) VALUES (?, ?, ?, ?, ?)",
                (tenant_id, user.user, "alert.create", f"alert_id={alert_id}", now),
            )
            row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
            created.append(AlertOut(**dict(row)))

    return created


@app.get("/api/v1/alerts", response_model=list[AlertOut])
def list_alerts(
    status: str = "open",
    tenant_id: str = Header(default="demo", alias="X-Tenant-ID"),
    _: UserContext = Depends(get_user),
) -> list[AlertOut]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts WHERE tenant_id = ? AND status = ? ORDER BY id DESC",
            (tenant_id, status),
        ).fetchall()
    return [AlertOut(**dict(r)) for r in rows]


@app.get("/api/v1/forecast/{metric}", response_model=ForecastOut)
def forecast_metric(
    metric: str,
    horizon_days: int = 30,
    tenant_id: str = Header(default="demo", alias="X-Tenant-ID"),
    _: UserContext = Depends(get_user),
) -> ForecastOut:
    if metric != "kpi_current_value_avg":
        raise HTTPException(status_code=400, detail="Metric not supported in MVP")

    with get_conn() as conn:
        rows = conn.execute(
            "SELECT current_value FROM kpis WHERE tenant_id = ? ORDER BY id DESC LIMIT 30",
            (tenant_id,),
        ).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No data to forecast")

    values = [r["current_value"] for r in rows]
    predicted = mean(values)
    spread = (max(values) - min(values)) * 0.2 if len(values) > 1 else 0.0

    return ForecastOut(
        metric=metric,
        horizon_days=horizon_days,
        predicted_value=round(predicted, 2),
        confidence_low=round(predicted - spread, 2),
        confidence_high=round(predicted + spread, 2),
    )

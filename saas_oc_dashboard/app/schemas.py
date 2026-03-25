from datetime import datetime
from pydantic import BaseModel, Field


class KPIBase(BaseModel):
    area: str
    name: str
    formula: str
    frequency: str
    target: float
    threshold_green: float
    threshold_yellow: float
    current_value: float
    owner: str
    source: str
    recommended_action: str


class KPICreate(KPIBase):
    pass


class KPIOut(KPIBase):
    id: int
    tenant_id: str
    created_at: datetime


class AlertOut(BaseModel):
    id: int
    tenant_id: str
    kpi_id: int
    severity: str
    message: str
    status: str
    created_at: datetime


class ForecastOut(BaseModel):
    metric: str
    horizon_days: int = Field(default=30)
    predicted_value: float
    confidence_low: float
    confidence_high: float

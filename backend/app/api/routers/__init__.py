"""API routers."""

from app.api.routers import alerts, imports, inventory, movements, purchases, suppliers

__all__ = ["inventory", "suppliers", "movements", "alerts", "purchases", "imports"]

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database.connection import get_pool
import os

PLATFORM_DOMAIN = os.getenv("PLATFORM_DOMAIN", "eventsphere.app")


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Resolves tenant from subdomain or header.
    Sets request.state.tenant_id and request.state.tenant.
    """

    async def dispatch(self, request: Request, call_next):

        # Allow CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Public endpoints — no tenant needed
        if (
            request.url.path.startswith("/docs")
            or request.url.path.startswith("/openapi.json")
            or request.url.path.startswith("/redoc")
            or request.url.path == "/api/health"
            or request.url.path == "/api/auth/register-tenant"
            or request.url.path.startswith("/api/test")
            or request.url.path.startswith("/api/public")
        ):
            request.state.tenant_id = None
            request.state.tenant = None
            return await call_next(request)

        tenant_slug = self._extract_slug(request)

        if not tenant_slug:
            return JSONResponse(
                {"error": "Tenant not found"},
                status_code=404
            )

        pool = get_pool()

        tenant = await pool.fetchrow(
            """
            SELECT id, slug, name, plan, is_active
            FROM tenants
            WHERE slug = $1
            """,
            tenant_slug
        )

        if not tenant:
            return JSONResponse(
                {"error": f"Organization '{tenant_slug}' not found"},
                status_code=404
            )

        if not tenant["is_active"]:
            return JSONResponse(
                {"error": "This organization account is suspended"},
                status_code=403
            )

        request.state.tenant_id = str(tenant["id"])
        request.state.tenant = dict(tenant)

        return await call_next(request)

    def _extract_slug(self, request: Request) -> str | None:
        host = request.headers.get("host", "")

        # Dev mode: pass slug via header
        dev_slug = request.headers.get("X-Tenant-Slug")
        if dev_slug:
            return dev_slug

        # Production: parse from subdomain
        if host.endswith(f".{PLATFORM_DOMAIN}"):
            slug = host[: -(len(PLATFORM_DOMAIN) + 1)]
            return slug if slug else None

        return None
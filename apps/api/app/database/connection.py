import asyncpg
from typing import Optional
import os

_pool: Optional[asyncpg.Pool] = None

async def connect_db():
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            dsn=os.getenv("DATABASE_URL"),
            min_size=2,
            max_size=10,
            command_timeout=30
        )
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise

async def disconnect_db():
    global _pool
    if _pool:
        await _pool.close()
        print("✓ Database disconnected")

def get_pool() -> asyncpg.Pool:
    if not _pool:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _pool

class TenantDB:
    """
    Context manager that sets app.current_tenant_id for RLS queries.
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._conn = None

    async def __aenter__(self):
        self._conn = await get_pool().acquire()
        await self._conn.execute(
            "SELECT set_config('app.current_tenant_id', $1, true)",
            self.tenant_id
        )
        return self._conn

    async def __aexit__(self, *args):
        if self._conn:
            await get_pool().release(self._conn)

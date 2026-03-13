from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from mcp.server import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager

from .auth import ApiKeyMiddleware
from .backend_client import backend
from .resources import register_resources
from .tools import register_tools


mcp_server = Server("homelable")
register_resources(mcp_server)
register_tools(mcp_server)

session_manager = StreamableHTTPSessionManager(
    app=mcp_server,
    json_response=False,
    stateless=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await backend.start()
    async with session_manager.run():
        yield
    await backend.stop()


app = FastAPI(title="Homelable MCP", lifespan=lifespan)
app.add_middleware(ApiKeyMiddleware)


@app.api_route("/mcp", methods=["GET", "POST", "DELETE"])
async def mcp_endpoint(request: Request):
    await session_manager.handle_request(request.scope, request.receive, request._send)


@app.get("/health")
async def health():
    return {"status": "ok"}

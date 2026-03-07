import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Active WebSocket connections
_connections: list[WebSocket] = []


@router.websocket("/ws/status")
async def ws_status(websocket: WebSocket) -> None:
    await websocket.accept()
    _connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        _connections.remove(websocket)


async def broadcast_status(node_id: str, status: str, checked_at: str, response_time_ms: int | None = None) -> None:
    payload = json.dumps({
        "node_id": node_id,
        "status": status,
        "checked_at": checked_at,
        "response_time_ms": response_time_ms,
    })
    for conn in list(_connections):
        try:
            await conn.send_text(payload)
        except Exception:
            _connections.remove(conn)

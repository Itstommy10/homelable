from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import CanvasState, Edge, Node
from app.schemas.canvas import CanvasSaveRequest, CanvasStateResponse

router = APIRouter()


@router.get("", response_model=CanvasStateResponse)
async def load_canvas(db: AsyncSession = Depends(get_db), _: str = Depends(get_current_user)):
    nodes = (await db.execute(select(Node))).scalars().all()
    edges = (await db.execute(select(Edge))).scalars().all()
    state = await db.get(CanvasState, 1)
    viewport = state.viewport if state else {"x": 0, "y": 0, "zoom": 1}
    return CanvasStateResponse(nodes=list(nodes), edges=list(edges), viewport=viewport)


@router.post("/save")
async def save_canvas(body: CanvasSaveRequest, db: AsyncSession = Depends(get_db), _: str = Depends(get_current_user)):
    incoming_node_ids = {n.id for n in body.nodes}
    incoming_edge_ids = {e.id for e in body.edges}

    # Delete nodes removed from canvas
    existing_nodes = (await db.execute(select(Node))).scalars().all()
    for node in existing_nodes:
        if node.id not in incoming_node_ids:
            await db.delete(node)

    # Delete edges removed from canvas
    existing_edges = (await db.execute(select(Edge))).scalars().all()
    for edge in existing_edges:
        if edge.id not in incoming_edge_ids:
            await db.delete(edge)

    await db.flush()

    # Upsert nodes
    for node_data in body.nodes:
        node = await db.get(Node, node_data.id)
        if node:
            for field, value in node_data.model_dump().items():
                setattr(node, field, value)
        else:
            db.add(Node(**node_data.model_dump()))

    # Upsert edges
    for edge_data in body.edges:
        edge = await db.get(Edge, edge_data.id)
        if edge:
            for field, value in edge_data.model_dump().items():
                setattr(edge, field, value)
        else:
            db.add(Edge(**edge_data.model_dump()))

    # Upsert viewport
    state = await db.get(CanvasState, 1)
    if state:
        state.viewport = body.viewport
        state.saved_at = datetime.now(UTC)
    else:
        db.add(CanvasState(id=1, viewport=body.viewport))

    await db.commit()
    return {"saved": True}

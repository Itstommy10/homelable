"""
Integration tests — run against a live Docker stack.

Skipped unless INTEGRATION_BASE_URL is set (done automatically in docker-ci.yml).

Usage (local):
    INTEGRATION_BASE_URL=http://localhost:8000 \
    INTEGRATION_USERNAME=admin \
    INTEGRATION_PASSWORD=your-password \
    pytest backend/tests/test_integration.py -v
"""

import os

import httpx
import pytest

BASE_URL = os.environ.get("INTEGRATION_BASE_URL", "")
USERNAME = os.environ.get("INTEGRATION_USERNAME", "admin")
PASSWORD = os.environ.get("INTEGRATION_PASSWORD", "")

pytestmark = pytest.mark.skipif(
    not BASE_URL,
    reason="INTEGRATION_BASE_URL not set — skipping live-stack tests",
)


@pytest.fixture(scope="module")
def token() -> str:
    res = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=10,
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Health ────────────────────────────────────────────────────────────────────

def test_health_endpoint():
    res = httpx.get(f"{BASE_URL}/api/v1/health", timeout=10)
    assert res.status_code == 200


# ── Auth ──────────────────────────────────────────────────────────────────────

def test_login_returns_token():
    res = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=10,
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_bad_credentials():
    res = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": USERNAME, "password": "wrong-password"},
        timeout=10,
    )
    assert res.status_code == 401


def test_protected_route_without_token():
    res = httpx.get(f"{BASE_URL}/api/v1/canvas", timeout=10)
    assert res.status_code == 401


# ── Canvas round-trip ─────────────────────────────────────────────────────────

def test_canvas_load_returns_valid_structure(auth):
    res = httpx.get(f"{BASE_URL}/api/v1/canvas", headers=auth, timeout=10)
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["edges"], list)


def test_canvas_save_and_reload(auth):
    payload = {
        "nodes": [
            {
                "id": "integ-node-1",
                "type": "server",
                "position": {"x": 100, "y": 200},
                "data": {
                    "label": "CI Server",
                    "type": "server",
                    "status": "unknown",
                    "services": [],
                },
                "width": 240,
                "height": 100,
            }
        ],
        "edges": [],
        "viewport": {"x": 0, "y": 0, "zoom": 1},
    }
    save_res = httpx.post(
        f"{BASE_URL}/api/v1/canvas/save",
        json=payload,
        headers=auth,
        timeout=10,
    )
    assert save_res.status_code == 200

    load_res = httpx.get(f"{BASE_URL}/api/v1/canvas", headers=auth, timeout=10)
    assert load_res.status_code == 200
    nodes = load_res.json()["nodes"]
    assert len(nodes) == 1

    node = nodes[0]
    assert node["label"] == "CI Server"
    assert node["type"] == "server"
    assert node["x"] == pytest.approx(100)
    assert node["y"] == pytest.approx(200)


def test_canvas_save_preserves_node_dimensions(auth):
    """Width/height survive a save→reload cycle through the real DB."""
    payload = {
        "nodes": [
            {
                "id": "resized-node",
                "type": "router",
                "position": {"x": 50, "y": 50},
                "data": {
                    "label": "Big Router",
                    "type": "router",
                    "status": "unknown",
                    "services": [],
                },
                "width": 320,
                "height": 150,
            }
        ],
        "edges": [],
        "viewport": {"x": 0, "y": 0, "zoom": 1},
    }
    httpx.post(f"{BASE_URL}/api/v1/canvas/save", json=payload, headers=auth, timeout=10)

    nodes = httpx.get(f"{BASE_URL}/api/v1/canvas", headers=auth, timeout=10).json()["nodes"]
    node = next((n for n in nodes if n["id"] == "resized-node"), None)
    assert node is not None
    assert node["width"] == pytest.approx(320)
    assert node["height"] == pytest.approx(150)


def test_canvas_save_with_edge(auth):
    payload = {
        "nodes": [
            {
                "id": "n-src",
                "type": "router",
                "position": {"x": 0, "y": 0},
                "data": {"label": "Router", "type": "router", "status": "unknown", "services": []},
            },
            {
                "id": "n-dst",
                "type": "server",
                "position": {"x": 200, "y": 0},
                "data": {"label": "Server", "type": "server", "status": "unknown", "services": []},
            },
        ],
        "edges": [
            {
                "id": "e-eth",
                "source": "n-src",
                "target": "n-dst",
                "type": "ethernet",
                "data": {"type": "ethernet"},
            }
        ],
        "viewport": {"x": 0, "y": 0, "zoom": 1},
    }
    save_res = httpx.post(
        f"{BASE_URL}/api/v1/canvas/save", json=payload, headers=auth, timeout=10
    )
    assert save_res.status_code == 200

    data = httpx.get(f"{BASE_URL}/api/v1/canvas", headers=auth, timeout=10).json()
    assert len(data["edges"]) == 1
    edge = data["edges"][0]
    assert edge["source_id"] == "n-src"
    assert edge["target_id"] == "n-dst"
    assert edge["type"] == "ethernet"

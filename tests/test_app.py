import importlib

import pytest
from fastapi.testclient import TestClient


def reload_app_module():
    # Reload module to reset in-memory state between tests
    import src.app as app_module

    importlib.reload(app_module)
    return app_module


def test_get_activities():
    app_module = reload_app_module()
    client = TestClient(app_module.app)

    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic smoke checks
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"].get("participants"), list)


def test_signup_and_unregister_flow():
    app_module = reload_app_module()
    client = TestClient(app_module.app)

    email = "pytest_user@example.com"
    # Sign up
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json().get("message")

    # Verify participant present
    resp = client.get("/activities")
    participants = resp.json()["Chess Club"]["participants"]
    assert email in participants

    # Unregister
    resp = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify removed
    resp = client.get("/activities")
    participants = resp.json()["Chess Club"]["participants"]
    assert email not in participants


def test_signup_existing_returns_400():
    app_module = reload_app_module()
    client = TestClient(app_module.app)

    email = "existing@example.com"
    # First signup
    resp = client.post(f"/activities/Tennis%20Club/signup?email={email}")
    assert resp.status_code == 200

    # Second signup should fail with 400
    resp = client.post(f"/activities/Tennis%20Club/signup?email={email}")
    assert resp.status_code == 400


def test_unregister_nonexistent_returns_400():
    app_module = reload_app_module()
    client = TestClient(app_module.app)

    email = "notregistered@example.com"
    resp = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert resp.status_code == 400


def test_activity_not_found_returns_404():
    app_module = reload_app_module()
    client = TestClient(app_module.app)

    resp = client.get("/activities/Nonexistent")
    # There is no explicit endpoint for single activity GET, expect 404
    assert resp.status_code == 404 or resp.status_code == 405

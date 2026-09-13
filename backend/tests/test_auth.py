from tests.conftest import AUTH


def test_requires_token(client):
    assert client.get("/api/foods").status_code == 401
    assert client.get("/api/foods", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/api/foods", headers=AUTH).status_code == 200


def test_health_is_public(client):
    assert client.get("/api/health").status_code == 200


def test_token_with_trailing_newline_in_secret(client, monkeypatch):
    from app import auth
    monkeypatch.setattr(auth.settings, "app_token", "test-token\n")
    assert client.get("/api/foods", headers=AUTH).status_code == 200

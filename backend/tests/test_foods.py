from tests.conftest import AUTH


def test_create_and_search(client, roti):
    assert roti["source"] == "custom"
    assert roti["servings"][0]["label"] == "1 small roti"
    r = client.get("/api/foods", params={"q": "whole roti"}, headers=AUTH)
    assert [f["name"] for f in r.json()] == ["Roti (whole wheat)"]
    assert client.get("/api/foods", params={"q": "paneer"}, headers=AUTH).json() == []


def test_update_and_soft_delete(client, roti):
    body = {**{k: roti[k] for k in ("name", "serving_label", "serving_grams", "kcal", "protein_g", "carbs_g", "fat_g", "fiber_g")}, "kcal": 310, "servings": []}
    r = client.put(f"/api/foods/{roti['id']}", json=body, headers=AUTH)
    assert r.status_code == 200 and r.json()["kcal"] == 310 and r.json()["servings"] == []
    assert client.delete(f"/api/foods/{roti['id']}", headers=AUTH).status_code == 204
    assert client.get(f"/api/foods/{roti['id']}", headers=AUTH).status_code == 404
    assert client.get("/api/foods", headers=AUTH).json() == []


def test_validation(client):
    r = client.post("/api/foods", json={"name": "", "kcal": -1}, headers=AUTH)
    assert r.status_code == 422

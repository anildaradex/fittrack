from tests.conftest import AUTH

DAY = "2026-09-13"


def test_empty_day_without_goal(client):
    d = client.get(f"/api/diary/{DAY}", headers=AUTH).json()
    assert [m["meal"] for m in d["meals"]] == ["breakfast", "lunch", "dinner", "snack"]
    assert d["totals"]["kcal"] == 0 and d["goal"] is None and d["remaining_kcal"] is None


def test_log_scales_per_100g_and_totals(client, roti):
    client.put("/api/goals/current", json={"kcal": 1800, "protein_g": 120, "carbs_g": 100, "fat_g": 80, "net_carb_mode": True}, headers=AUTH)
    # 2 rotis × 40 g = 80 g → 240 kcal, 8 P, 44 C, 4 F, 6.4 fiber
    r = client.post("/api/diary/entries", json={"date": DAY, "meal": "lunch", "food_id": roti["id"], "quantity": 2, "unit_label": "1 roti", "grams": 80}, headers=AUTH)
    assert r.status_code == 201, r.text
    e = r.json()
    assert e["macros"] == {"kcal": 240, "protein_g": 8, "carbs_g": 44, "fat_g": 4, "fiber_g": 6.4}

    d = client.get(f"/api/diary/{DAY}", headers=AUTH).json()
    lunch = next(m for m in d["meals"] if m["meal"] == "lunch")
    assert len(lunch["entries"]) == 1 and lunch["totals"]["kcal"] == 240
    assert d["totals"]["kcal"] == 240
    assert d["goal"]["kcal"] == 1800 and d["goal"]["net_carb_mode"] is True
    assert d["remaining_kcal"] == 1560
    assert d["net_carbs_g"] == 37.6

    # recent foods reflects the log
    assert [f["id"] for f in client.get("/api/foods/recent", headers=AUTH).json()] == [roti["id"]]

    # edit: move to dinner, 1 roti
    r = client.patch(f"/api/diary/entries/{e['id']}", json={"meal": "dinner", "quantity": 1, "grams": 40}, headers=AUTH)
    assert r.status_code == 200 and r.json()["macros"]["kcal"] == 120
    d = client.get(f"/api/diary/{DAY}", headers=AUTH).json()
    assert next(m for m in d["meals"] if m["meal"] == "dinner")["totals"]["kcal"] == 120

    assert client.delete(f"/api/diary/entries/{e['id']}", headers=AUTH).status_code == 204
    assert client.get(f"/api/diary/{DAY}", headers=AUTH).json()["totals"]["kcal"] == 0


def test_bad_meal_and_missing_food(client, roti):
    r = client.post("/api/diary/entries", json={"date": DAY, "meal": "brunch", "food_id": roti["id"], "grams": 10}, headers=AUTH)
    assert r.status_code == 422
    r = client.post("/api/diary/entries", json={"date": DAY, "meal": "snack", "food_id": 9999, "grams": 10}, headers=AUTH)
    assert r.status_code == 404


def test_goal_history_latest_wins(client):
    client.put("/api/goals/current", json={"kcal": 2000, "protein_g": 150, "carbs_g": 200, "fat_g": 65}, headers=AUTH)
    client.put("/api/goals/current", json={"kcal": 1700, "protein_g": 140, "carbs_g": 60, "fat_g": 110, "net_carb_mode": True}, headers=AUTH)
    g = client.get("/api/goals/current", headers=AUTH).json()
    assert g["kcal"] == 1700 and g["net_carb_mode"] is True

import os
import tempfile

# Must happen before `app` is imported: settings are read at import time.
_tmp = tempfile.mkdtemp()
os.environ["FITTRACK_DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["FITTRACK_APP_TOKEN"] = "test-token"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

AUTH = {"Authorization": "Bearer test-token"}


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def roti(client):
    r = client.post(
        "/api/foods",
        json={
            "name": "Roti (whole wheat)", "serving_label": "1 roti", "serving_grams": 40,
            "kcal": 300, "protein_g": 10, "carbs_g": 55, "fat_g": 5, "fiber_g": 8,
            "servings": [{"label": "1 small roti", "grams": 30}],
        },
        headers=AUTH,
    )
    assert r.status_code == 201, r.text
    return r.json()

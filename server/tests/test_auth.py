import unittest
import json
import os
import tempfile
from server.app import create_app
from server.storage.db import get_db_connection

class TestAuthAndProjects(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_auth_status_endpoint(self):
        resp = self.client.get("/api/v1/auth/status")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("isFirstRun", data)

    def test_project_crud_lifecycle(self):
        # 1. Create
        create_payload = {
            "displayName": "Test Pinterest Sandbox",
            "template": "strict",
            "allowedDomains": ["pinterest.com", "*.pinimg.com"]
        }
        res = self.client.post("/api/v1/projects", data=json.dumps(create_payload), content_type="application/json")
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        proj_id = data["project"]["project"]["id"]

        # 2. List
        list_res = self.client.get("/api/v1/projects")
        self.assertEqual(list_res.status_code, 200)
        list_data = json.loads(list_res.data)
        self.assertTrue(any(p["project"]["id"] == proj_id for p in list_data["projects"]))

        # 3. Get Details
        get_res = self.client.get(f"/api/v1/projects/{proj_id}")
        self.assertEqual(get_res.status_code, 200)

        # 4. Delete
        del_res = self.client.delete(f"/api/v1/projects/{proj_id}")
        self.assertEqual(del_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()

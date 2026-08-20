import unittest
import json
from server.app import create_app

class TestFilesystemSecurity(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        # Create test project
        self.client.post("/api/v1/projects", data=json.dumps({"displayName": "Security Test Proj"}), content_type="application/json")

    def test_path_traversal_blocked(self):
        # Attempt to read parent/root files
        resp = self.client.get("/api/v1/projects/security-test-proj/files/content?path=../../etc/passwd")
        self.assertIn(resp.status_code, [403, 404])

        resp2 = self.client.get("/api/v1/projects/security-test-proj/files?path=..\\..\\Windows")
        self.assertIn(resp2.status_code, [403, 404])

    def test_file_write_and_read(self):
        write_res = self.client.post(
            "/api/v1/projects/security-test-proj/files/content",
            data=json.dumps({"path": "config/settings.json", "content": '{"test": true}'}),
            content_type="application/json"
        )
        self.assertEqual(write_res.status_code, 200)

        read_res = self.client.get("/api/v1/projects/security-test-proj/files/content?path=config/settings.json")
        self.assertEqual(read_res.status_code, 200)
        self.assertIn('"test": true', read_res.data.decode("utf-8"))

if __name__ == "__main__":
    unittest.main()

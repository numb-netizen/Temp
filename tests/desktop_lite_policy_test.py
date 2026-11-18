import pathlib
import sys
import unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'desktop-lite' / 'linux'))
from policy import classify

class PolicyTests(unittest.TestCase):
    def test_internal(self):
        for url in ['http://127.0.0.1:19829/index.html', 'http://127.0.0.1:19829/tracker.html#x']:
            self.assertEqual(classify(url), 'internal')
    def test_external(self):
        for url in ['https://youtube.com/', 'http://example.org', 'mailto:a@example.org', 'tel:+880123']:
            self.assertEqual(classify(url), 'external')
    def test_deny(self):
        for url in ['file:///etc/passwd', 'javascript:alert(1)', 'http://u:p@127.0.0.1:19829/', 'http://127.0.0.1:bad/', 'data:text/html,hi']:
            self.assertEqual(classify(url), 'deny')
    def test_wrong_origin(self):
        for url in ['http://127.0.0.1:19828/', 'http://localhost:19829/', 'https://127.0.0.1:19829/']:
            self.assertNotEqual(classify(url), 'internal')

if __name__ == '__main__': unittest.main()

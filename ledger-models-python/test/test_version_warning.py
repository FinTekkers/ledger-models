import unittest
import warnings
from unittest.mock import patch
import fintekkers

class TestVersionWarning(unittest.TestCase):
    def setUp(self):
        # Clear any existing warnings
        warnings.resetwarnings()
        # Create a list to capture warnings
        self.warnings_list = []
        warnings.showwarning = lambda *args, **kwargs: self.warnings_list.append(args)

    def test_warning_shows_for_version_0_0_0(self):
        """Test that warning is shown when version is 0.0.0"""
        with patch('importlib.metadata.version', return_value='0.0.0'):
            # Reload the module to trigger the warning
            import importlib
            importlib.reload(fintekkers)
            
            self.assertEqual(len(self.warnings_list), 1)
            warning_message = str(self.warnings_list[0][0])
            self.assertIn("locally built version", warning_message)
            self.assertIn("experimental features", warning_message)

    def test_no_warning_for_other_versions(self):
        """Test that no warning is shown for other versions"""
        with patch('importlib.metadata.version', return_value='1.0.0'):
            # Reload the module to trigger the warning check
            import importlib
            importlib.reload(fintekkers)
            
            self.assertEqual(len(self.warnings_list), 0)

    def test_no_warning_on_version_check_failure(self):
        """Test that no warning is shown when version check fails"""
        with patch('importlib.metadata.version', side_effect=Exception("Version check failed")):
            # Reload the module to trigger the warning check
            import importlib
            importlib.reload(fintekkers)
            
            self.assertEqual(len(self.warnings_list), 0)

if __name__ == '__main__':
    unittest.main() 
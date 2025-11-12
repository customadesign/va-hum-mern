import re

# Read the Settings.js file
with open('Settings.js', 'r') as f:
    content = f.read()

# Add the api import after the useAuth import
content = re.sub(
    r"(import { useAuth } from '../contexts/AuthContext';)",
    r"\1\nimport api from '../services/api';",
    content
)

# Remove the getCookie function definition
content = re.sub(
    r"const getCookie = \(name\) => \{[^}]*\};",
    "",
    content,
    flags=re.DOTALL
)

# Fix fetchConfig function
content = re.sub(
    r"const fetchConfig = async \(\) => \{[^}]*\n  \};",
    """const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/configs');
      
      if (response.data.config) {
        setConfig(response.data.config);
        setOriginalConfig(response.data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleSave function
content = re.sub(
    r"const handleSave = async \(\) => \{[^}]*\n  \};",
    """const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await api.put('/admin/configs', config);
      
      if (response.data.config) {
        setConfig(response.data.config);
        setOriginalConfig(response.data.config);
        setSaveSuccess(true);
        setModifiedFields(new Set());
        
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleTestEmail function
content = re.sub(
    r"const handleTestEmail = async \(\) => \{[^}]*\n  \};",
    """const handleTestEmail = async () => {
    if (!testEmail) {
      setEmailTestResult({ success: false, message: 'Please enter a test email address' });
      return;
    }
    
    setEmailTesting(true);
    setEmailTestResult(null);
    
    try {
      const response = await api.post('/admin/test-email', { to: testEmail });
      
      setEmailTestResult({
        success: true,
        message: response.data.message || 'Test email sent successfully!'
      });
    } catch (error) {
      setEmailTestResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send test email'
      });
    } finally {
      setEmailTesting(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleResetToDefaults function
content = re.sub(
    r"const handleResetToDefaults = async \(\) => \{[^}]*\n  \};",
    """const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/admin/configs/reset');
      
      if (response.data.config) {
        setConfig(response.data.config);
        setOriginalConfig(response.data.config);
        setSaveSuccess(true);
        setModifiedFields(new Set());
        
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error resetting configuration:', error);
      setError(error.response?.data?.message || 'Failed to reset configuration');
    } finally {
      setLoading(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleTestVAWebhook function
content = re.sub(
    r"const handleTestVAWebhook = async \(\) => \{[^}]*\n  \};",
    """const handleTestVAWebhook = async () => {
    setWebhookTesting(true);
    setWebhookTestResult(null);
    
    try {
      const response = await api.post('/admin/test-va-webhook', {
        url: config.va_webhook_url,
        secret: config.va_webhook_secret
      });
      
      setWebhookTestResult({
        success: true,
        message: response.data.message || 'Webhook test successful!'
      });
    } catch (error) {
      setWebhookTestResult({
        success: false,
        message: error.response?.data?.message || 'Webhook test failed'
      });
    } finally {
      setWebhookTesting(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleExportConfig function
content = re.sub(
    r"const handleExportConfig = async \(\) => \{[^}]*\n  \};",
    """const handleExportConfig = async () => {
    try {
      const response = await api.get('/admin/configs/export');
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting configuration:', error);
      setError(error.response?.data?.message || 'Failed to export configuration');
    }
  };""",
    content,
    flags=re.DOTALL
)

# Fix handleImportConfig function
content = re.sub(
    r"const handleImportConfig = async \(file\) => \{[^}]*\n  \};",
    """const handleImportConfig = async (file) => {
    const formData = new FormData();
    formData.append('config', file);
    
    try {
      setLoading(true);
      const response = await api.post('/admin/configs/import', formData);
      
      if (response.data.config) {
        setConfig(response.data.config);
        setOriginalConfig(response.data.config);
        setSaveSuccess(true);
        setModifiedFields(new Set());
        
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error importing configuration:', error);
      setError(error.response?.data?.message || 'Failed to import configuration');
    } finally {
      setLoading(false);
    }
  };""",
    content,
    flags=re.DOTALL
)

# Write the fixed content back
with open('Settings.js', 'w') as f:
    f.write(content)

print("Settings.js has been completely fixed!")
print("- Added api import")
print("- Removed getCookie function")
print("- Updated all API calls to use api service")

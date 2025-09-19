import re

# Read the Settings.js file
with open('Settings.js', 'r') as f:
    content = f.read()

# Fix the fetchConfig function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/configs`.*?\}\);",
    "const response = await api.get('/admin/configs');",
    content,
    flags=re.DOTALL
)

# Fix the handleSave function  
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/configs`.*?body: JSON\.stringify\(config\),\s*\}\);",
    "const response = await api.put('/admin/configs', config);",
    content,
    flags=re.DOTALL
)

# Fix the handleTestEmail function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/test-email`.*?body: JSON\.stringify\(\{ to: testEmail \}\),\s*\}\);",
    "const response = await api.post('/admin/test-email', { to: testEmail });",
    content,
    flags=re.DOTALL
)

# Fix the handleResetToDefaults function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/configs/reset`.*?\}\);",
    "const response = await api.post('/admin/configs/reset');",
    content,
    flags=re.DOTALL
)

# Fix the handleTestVAWebhook function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/test-va-webhook`.*?body: JSON\.stringify\(\{(.*?)\}\),\s*\}\);",
    r"const response = await api.post('/admin/test-va-webhook', {\1});",
    content,
    flags=re.DOTALL
)

# Fix the handleExportConfig function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/configs/export`.*?\}\);",
    "const response = await api.get('/admin/configs/export');",
    content,
    flags=re.DOTALL
)

# Fix the handleImportConfig function
content = re.sub(
    r"const response = await fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http://localhost:8000'\}/admin/configs/import`.*?body: formData,\s*\}\);",
    "const response = await api.post('/admin/configs/import', formData);",
    content,
    flags=re.DOTALL
)

# Remove getCookie function
content = re.sub(
    r"const getCookie = \(name\) => \{.*?\n\};",
    "",
    content,
    flags=re.DOTALL
)

# Remove all references to getCookie
content = re.sub(r"getCookie\('authToken'\)", "null", content)

# Write the fixed content back
with open('Settings.js', 'w') as f:
    f.write(content)

print("Settings.js has been fixed!")

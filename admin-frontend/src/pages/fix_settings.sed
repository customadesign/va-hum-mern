# Replace fetchConfig function to use api service
/const fetchConfig = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.get('\/admin\/configs');/
  /headers: {/d
  /Authorization:/d
  /},$/d
}

# Replace handleSave function to use api service
/const handleSave = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.put('\/admin\/configs', config);/
  /method: 'PUT',/d
  /headers: {/d
  /'Content-Type':/d
  /Authorization:/d
  /},$/d
  /body: JSON.stringify(config),/d
}

# Replace handleTestEmail function to use api service
/const handleTestEmail = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.post('\/admin\/test-email', { to: testEmail });/
  /method: 'POST',/d
  /headers: {/d
  /'Content-Type':/d
  /Authorization:/d
  /},$/d
  /body: JSON.stringify({ to: testEmail }),/d
}

# Replace handleResetToDefaults function to use api service
/const handleResetToDefaults = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.post('\/admin\/configs\/reset');/
  /method: 'POST',/d
  /headers: {/d
  /Authorization:/d
  /},$/d
}

# Replace handleTestVAWebhook function to use api service
/const handleTestVAWebhook = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.post('\/admin\/test-va-webhook', {/
  /method: 'POST',/d
  /headers: {/d
  /'Content-Type':/d
  /Authorization:/d
  /},$/d
  s/body: JSON.stringify({/  /
  s/}),$/});/
}

# Replace handleExportConfig function to use api service
/const handleExportConfig = async () => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.get('\/admin\/configs\/export');/
  /headers: {/d
  /Authorization:/d
  /},$/d
}

# Replace handleImportConfig function to use api service
/const handleImportConfig = async (file) => {/,/^  };$/ {
  s/const response = await fetch.*/const response = await api.post('\/admin\/configs\/import', formData);/
  /method: 'POST',/d
  /headers: {/d
  /Authorization:/d
  /},$/d
  /body: formData,/d
}

# Remove getCookie function completely
/const getCookie = (name) => {/,/^};$/d

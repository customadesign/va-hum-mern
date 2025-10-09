const fs = require('fs');

// Read the file
let content = fs.readFileSync('routes/admin.js', 'utf8');

// Find and replace the problematic section
// Original pattern around lines 1254-1275
const originalPattern = /(\s+for \(const \[key, value\] of Object\.entries\(configs\)\) \{\s+try \{\s+\/\/ Find existing config to get its metadata\s+const existingConfig = await SiteConfig\.findOne\(\{ key \}\);[\s\S]*?)(\s+if \(existingConfig\) \{)([\s\S]*?)(\/\/ Log the change for debugging\s+console\.log\(`Updating config \$\{key\}: \$\{existingConfig\.value\} -> \$\{value\}`\);)([\s\S]*?)(updates\.push\(\{[\s\S]*?oldValue: existingConfig\.value,[\s\S]*?\}\);)/gm;

// Replacement with the fix
const replacement = `$1$2
          // Store the old value BEFORE updating
          const oldValue = existingConfig.value;
$3$4$5updates.push({
            key,
            oldValue: oldValue,
            newValue: value
          });`;

// Apply the fix
content = content.replace(originalPattern, replacement);

// Write the fixed content back
fs.writeFileSync('routes/admin.js', content);

console.log('Fixed the oldValue bug in admin.js');

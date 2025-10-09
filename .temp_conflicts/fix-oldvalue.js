const fs = require('fs');

// Read the file
let content = fs.readFileSync('routes/admin.js', 'utf8');

// Split into lines
let lines = content.split('\n');

// Find the line that says "if (existingConfig) {" after line 1258
for (let i = 1258; i < lines.length && i < 1265; i++) {
  if (lines[i].includes('if (existingConfig) {')) {
    // Insert the new lines after this line
    lines.splice(i + 1, 0, 
      '          // Store the old value BEFORE updating',
      '          const oldValue = existingConfig.value;',
      ''
    );
    break;
  }
}

// Join back and save
content = lines.join('\n');
fs.writeFileSync('routes/admin.js', content);

console.log('Added oldValue declaration to admin.js');

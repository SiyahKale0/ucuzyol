ucuzyol\fix_arama.js
```

```javascript
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/screens/AramaEkrani.js');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the problematic header lines
content = content.replace(/^.*ucuzyol[\\\/]src[\\\/]screens[\\\/]AramaEkrani\.js\s*\n\s*```\s*javascript\s*\n/s, '');

// Also remove any trailing markdown if present
content = content.replace(/\n```\s*$/s, '');

// Write the fixed content
fs.writeFileSync(filePath, content);
console.log('AramaEkrani.js fixed successfully!');

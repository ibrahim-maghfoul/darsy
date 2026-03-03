const fs = require('fs');
const content = fs.readFileSync('eslint_err.json', 'utf16le');
const data = JSON.parse(content);
data[0].messages.forEach(m => {
    console.log(`Line ${m.line}:${m.column} | Rule: ${m.ruleId} | ${m.message}`);
});

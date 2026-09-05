const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = {
    "'PENDING_FINANCE_APPROVAL'": "'PENDING_APPROVAL'",
    '"PENDING_FINANCE_APPROVAL"': '"PENDING_APPROVAL"',
    "'PENDING_DISCOUNT_APPROVAL'": "'PENDING_APPROVAL'",
    '"PENDING_DISCOUNT_APPROVAL"': '"PENDING_APPROVAL"',
    "'IN_NEGOTIATION'": "'UNDER_NEGOTIATION'",
    '"IN_NEGOTIATION"': '"UNDER_NEGOTIATION"',
    "'RETURNED'": "'REVISION_REQUIRED'",
    '"RETURNED"': '"REVISION_REQUIRED"',
    "'FULFILLED'": "'FULFILLMENT'",
    '"FULFILLED"': '"FULFILLMENT"',
    "'UNPAID'": "'ISSUED'",
    '"UNPAID"': '"ISSUED"',
    "value=\"IN_NEGOTIATION\"": "value=\"UNDER_NEGOTIATION\"",
    "value=\"RETURNED\"": "value=\"REVISION_REQUIRED\"",
    "value=\"FULFILLED\"": "value=\"FULFILLMENT\""
};

walk(path.join(__dirname, 'src'), function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let original = fs.readFileSync(filePath, 'utf8');
    let modified = original;
    
    for (const [key, value] of Object.entries(replacements)) {
        modified = modified.split(key).join(value);
    }
    
    if (original !== modified) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log('Modified ' + filePath);
    }
});

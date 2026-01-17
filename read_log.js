const fs = require('fs');
try {
    let content = fs.readFileSync('builder_error.log', 'utf16le');
    if (content.length > 4000) {
        content = content.slice(-4000);
    }
    console.log(content);
} catch (e) {
    try {
        let content = fs.readFileSync('builder_error.log', 'utf8');
        if (content.length > 4000) {
            content = content.slice(-4000);
        }
        console.log(content);
    } catch (e2) {
        console.error(e2);
    }
}

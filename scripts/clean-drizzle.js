const fs = require('fs');
const path = require('path');

function removeDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log('Drizzle directory does not exist.');
    return;
  }

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Drizzle files cleaned successfully!');
}

removeDir(path.join(__dirname, '..', 'drizzle'));


const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const www = path.join(__dirname, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'icon.svg']) {
  if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(www, f));
}
for (const d of ['vendor', 'fonts']) {
  if (fs.existsSync(path.join(root, d))) fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
}
console.log('Web assets synced to', www);

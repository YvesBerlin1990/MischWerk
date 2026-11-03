// Zentrale Bestandsprüfung der tatsächlich geladenen Frontend-Dateien.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, 'app/www', file), 'utf8');
const scripts = [...read('js/start.js').matchAll(/^\s+\['\w+', '([^']+\.js)'(?:, '[^']+')?\]/gm)].map(match => 'js/' + match[1]);
const styles = [...read('index.html').match(/var styles = \[([\s\S]*?)\];/)[1].matchAll(/^\s+'(css\/[^']+\.css)'/gm)].map(match => match[1]);
assert.equal(scripts.length, 44, 'Frontend-Ladeplan unvollständig');
assert.equal(styles.length, 18, 'CSS-Ladeplan unvollständig');
const frontendFiles = ['index.html', 'js/start.js', 'js/ui/composition.js', ...scripts, ...styles, 'img/mischwerk-logo.png', 'img/mischwerk-radio.png', 'audio/werbung.mp3'];
assert.equal(frontendFiles.length, new Set(frontendFiles).size, 'Doppelte Frontend-Datei');
function frontendFilesForView(view, sharedViews = false) {
  const selectedScripts = [], selectedStyles = [];
  const document = { readyState: 'loading', addEventListener() {}, documentElement: { getAttribute: () => view, setAttribute() {} } };
  const Client = { pageData: { view, sharedViews }, includeJS: file => { if(file !== 'js/start.js'){selectedScripts.push(file);} }, includeCSS: file => selectedStyles.push(file) };
  vm.runInNewContext(read('index.html').match(/<script>([\s\S]*?)<\/script>/)[1], { Client, document, setTimeout() {} });
  vm.runInNewContext(read('js/start.js'), { Client, document, window: {} });
  return ['index.html', 'js/start.js', ...selectedScripts, ...selectedStyles, 'img/mischwerk-logo.png', ...(view === 'radio' ? ['img/mischwerk-radio.png', 'audio/werbung.mp3'] : [])];
}
module.exports = { frontendFiles, frontendFilesForView };

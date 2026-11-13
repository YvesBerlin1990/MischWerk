// Zentrale Bestandsprüfung der tatsächlich geladenen Frontend-Dateien.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, 'app/www', file), 'utf8');
const scripts = [...read('js/start.js').matchAll(/^\s+\['\w+', '([^']+\.js)'(?:, '[^']+')?\]/gm)].map(match => 'js/' + match[1]);
const styles = [...read('index.html').match(/var styles = \[([\s\S]*?)\];/)[1].matchAll(/^\s+'(css\/[^']+\.css)'/gm)].map(match => match[1]);
assert.equal(scripts.length, 45, 'Frontend-Ladeplan unvollständig');
assert.equal(styles.length, 18, 'CSS-Ladeplan unvollständig');
const vinylFonts = ['fonts/outfit-latin.woff2','fonts/fraunces-latin.woff2','fonts/outfit-OFL.txt','fonts/fraunces-OFL.txt'];
const tickerFonts = ['fonts/rajdhani-medium-latin.woff2','fonts/rajdhani-OFL.txt'];
const nicklistIcons = ['team','listener','moderator'].map(kind => 'img/nicklist/' + kind + '.png');
const welcomeImages = ['banner','lieblingschannel','mitmachen','channelinfo'].map(name => 'img/welcome/' + name + '.png');
const frontendFiles = ['index.html', 'js/start.js', 'js/ui/composition.js', ...scripts, ...styles, 'img/mischwerk-logo.png', 'img/mischwerk-radio.png', ...nicklistIcons, ...welcomeImages, 'fonts/inter-latin.woff2', 'fonts/OFL.txt', 'fonts/bcrypt-LICENSE.txt', ...vinylFonts, ...tickerFonts];
assert.equal(frontendFiles.length, new Set(frontendFiles).size, 'Doppelte Frontend-Datei');
function frontendFilesForView(view) {
  assert.ok(['radio','wishes','studio','team','schedule'].includes(view), 'Ansicht ist nicht verfügbar: ' + view);
  const selectedScripts = [], selectedStyles = [];
  const document = { readyState: 'loading', addEventListener() {}, documentElement: { getAttribute: () => view, setAttribute() {} } };
  const Client = { pageData: { view }, includeJS: file => { if(file !== 'js/start.js'){selectedScripts.push(file);} }, includeCSS: file => selectedStyles.push(file) };
  vm.runInNewContext(read('index.html').match(/<script>([\s\S]*?)<\/script>/)[1], { Client, document, setTimeout() {} });
  vm.runInNewContext(read('js/start.js'), { Client, document, window: {} });
  return ['index.html', 'js/start.js', ...selectedScripts, ...selectedStyles, ...vinylFonts, 'img/mischwerk-logo.png', ...(view === 'radio' ? ['img/mischwerk-radio.png', 'fonts/inter-latin.woff2', 'fonts/OFL.txt', ...tickerFonts] : [])];
}
const operatorFiles = ['relay-settings.html'];
module.exports = { frontendFiles, frontendFilesForView, operatorFiles };

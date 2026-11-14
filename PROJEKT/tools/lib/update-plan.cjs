// Der Dateibedarf steht im selben übertragenen Einstieg wie dessen Ladeplan.
const assert = require('node:assert/strict');
const path = require('node:path');
const marker = /\/\* update-files:start \*\/[\s\S]*?\/\* update-files:end \*\//g;
function renderUpdatePlan(source, files, release) {
  const directories = {};
  for (const file of files) {
    const parent = path.posix.dirname(file), directory = parent === '.' ? '' : parent;
    (directories[directory] ||= []).push(path.posix.basename(file));
  }
  const plan = { schema:1, version:release.version, buildNumber:release.buildNumber, directories };
  assert.equal([...source.matchAll(marker)].length, 1, 'Genau ein Dateiplan im Server-Ladeplan erforderlich');
  return source.replace(marker, '/* update-files:start */ ' + JSON.stringify(plan, null, 1) + ' /* update-files:end */');
}
function withoutUpdatePlan(source) {
  return source.replace(marker, '/* update-files:start */ null /* update-files:end */');
}
function readUpdatePlan(source) {
  const block = source.match(marker);
  assert.equal(block?.length, 1, 'Dateiplan fehlt oder ist mehrdeutig');
  return JSON.parse(block[0].replace(/^\/\* update-files:start \*\//, '').replace(/\/\* update-files:end \*\/$/, ''));
}
module.exports = { renderUpdatePlan, withoutUpdatePlan, readUpdatePlan };

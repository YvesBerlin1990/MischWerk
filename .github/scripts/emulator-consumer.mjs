// Gemeinsame Vorlage: Windows-K-UserAppEmulator/.github/scripts/emulator-consumer.mjs.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function git(args, options = {}) {
  const authorization = process.env.GH_TOKEN ? {
    GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64')}`,
  } : {};
  return execFileSync('git', args, { encoding: 'utf8', ...options,
    env: { ...process.env, ...authorization, ...options.env } }).trimEnd();
}

export function inspect({ branch, proposal, path, base }) {
  if (!/^codex\/emulator-update-[a-f0-9]{12}-[a-f0-9]{8}$/.test(branch || '') ||
      !/^[a-f0-9]{40}$/.test(proposal || '')) throw new Error('Ungültiger Aktualisierungszweig.');
  const parents = git(['rev-list', '--parents', '-n', '1', proposal]).split(' ');
  if (parents.length !== 2 || parents[1] !== base) throw new Error('Der geprüfte main-Stand wurde inzwischen geändert.');
  const changes = git(['diff-tree', '--no-commit-id', '--name-only', '-r', '-z', base, proposal]).split('\0').filter(Boolean);
  if (changes.length !== 1 || changes[0] !== path) throw new Error('Die Aktualisierung darf ausschließlich den Emulator-Verweis ändern.');
  const link = git(['ls-tree', proposal, '--', path]).match(/^160000 commit ([a-f0-9]{40})\t/);
  const oldLink = git(['ls-tree', base, '--', path]).match(/^160000 commit ([a-f0-9]{40})\t/);
  if (!link || !oldLink || branch !== `codex/emulator-update-${link[1].slice(0, 12)}-${base.slice(0, 8)}`) {
    throw new Error('Der Emulator-Verweis passt nicht zum Aktualisierungszweig.');
  }
  const blob = `${proposal}:.gitmodules`;
  const configured = git(['config', '--blob', blob, '--get-regexp', '^submodule\\..*\\.path$'])
    .split('\n').map(line => line.match(/^(\S+)\s+(.+)$/)).filter(match => match?.[2] === path);
  if (configured.length !== 1) throw new Error('Unerwartete Submodul-Konfiguration.');
  const key = configured[0][1].replace(/\.path$/, '');
  const url = git(['config', '--blob', blob, '--get', `${key}.url`]);
  const branchName = git(['config', '--blob', blob, '--get', `${key}.branch`]);
  if (!/^(?:https:\/\/github\.com\/|git@github\.com:)(?:PolaroidK|BerlinAlexK93)\/Windows-K-UserAppEmulator(?:\.git)?$/i.test(url) ||
      branchName !== 'emulator-submodule') throw new Error('Unerwartete Submodul-Konfiguration.');
  return { base_sha: base, proposal_sha: proposal, emulator_sha: link[1] };
}

async function cleanup() {
  const branch = process.env.UPDATE_BRANCH;
  if (!/^codex\/emulator-update-[a-f0-9]{12}-[a-f0-9]{8}$/.test(branch || '')) throw new Error('Ungültiger Aufräumzweig.');
  const endpoint = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git`;
  const headers = { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28' };
  const response = await fetch(`${endpoint}/ref/heads/${branch}`, { headers });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`Zweigprüfung fehlgeschlagen: ${response.status}`);
  if ((await response.json()).object.sha !== process.env.PROPOSAL_SHA) throw new Error('Der Aktualisierungszweig wurde inzwischen geändert.');
  const removed = await fetch(`${endpoint}/refs/heads/${branch}`, { method: 'DELETE', headers });
  if (!removed.ok) throw new Error(`Zweigbereinigung fehlgeschlagen: ${removed.status}`);
}

async function cli() {
  const command = process.argv[2];
  if (command === 'cleanup') return cleanup();
  git(['fetch', '--no-recurse-submodules', 'origin', 'refs/heads/main']);
  const base = git(['rev-parse', 'FETCH_HEAD']);
  const proposal = process.env.PROPOSAL_SHA;
  if (command === 'promote') git(['fetch', '--no-recurse-submodules', 'origin', proposal]);
  const result = inspect({ branch: process.env.UPDATE_BRANCH, proposal, path: process.env.EMULATOR_PATH, base });
  if (command === 'inspect') {
    for (const [name, value] of Object.entries(result)) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  } else if (command === 'promote') {
    if (result.base_sha !== process.env.TESTED_BASE || result.emulator_sha !== process.env.TESTED_EMULATOR ||
        process.env.VERIFICATION_RESULT !== 'success') throw new Error('Keine erfolgreiche Prüfung für diesen Stand.');
    // Ohne Force: gleichzeitige Änderungen an main führen zum Abbruch und zur erneuten Prüfung.
    git(['push', '--recurse-submodules=no', 'origin', `${proposal}:refs/heads/main`]);
  } else throw new Error('Unbekannter Aktualisierungsbefehl.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  cli().catch(error => { console.error(error.message); process.exitCode = 1; });
}

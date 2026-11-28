// Vollständige Nachweise: Server, Browser, private Verwaltung/Anbindung und Medien.
function manifestGroups(files, isBinary) {
  const studio = file => /^server\/android\//.test(file) || /^www\/js\/(?:team|operator)\//.test(file) || /^www\/css\/team\//.test(file);
  const media = file => file.startsWith('www/') && (isBinary(file) || file.startsWith('www/fonts/'));
  return {
    'manifest-server.json': files.filter(file => !file.startsWith('www/') && !studio(file)),
    'manifest-www.json': files.filter(file => file.startsWith('www/') && !media(file) && !studio(file)),
    'manifest-studio.json': files.filter(studio),
    'manifest-media.json': files.filter(media)
  };
}

function serializeManifest(name, content) {
  const indent = name === 'manifest-media.json' ? 1 : 2;
  return JSON.stringify(content, null, indent) + '\n';
}

module.exports = { manifestGroups, serializeManifest };

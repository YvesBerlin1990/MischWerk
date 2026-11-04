// Vollständige Dateinachweise nach Server, gemeinsamem Browsercode, Studio und Medien.
function manifestGroups(files, isBinary) {
  const studio = file => /^www\/js\/studio\//.test(file) || /^www\/css\/(?:studio(?:-queue)?|handover)\.css$/.test(file);
  return {
    'manifest-server.json': files.filter(file => !file.startsWith('www/')),
    'manifest-www.json': files.filter(file => file.startsWith('www/') && !isBinary(file) && !studio(file)),
    'manifest-studio.json': files.filter(studio),
    'manifest-media.json': files.filter(file => file.startsWith('www/') && isBinary(file))
  };
}
module.exports = { manifestGroups };

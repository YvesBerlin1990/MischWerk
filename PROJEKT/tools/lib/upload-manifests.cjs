// Vollständige Dateinachweise nach Server, gemeinsamem Browsercode, privaten Arbeitsflächen und Medien.
function manifestGroups(files, isBinary) {
  const studio = file => /^www\/js\/(?:studio|team)\//.test(file) || /^www\/css\/(?:studio(?:-queue)?|handover|team)\.css$/.test(file);
  return {
    'manifest-server.json': files.filter(file => !file.startsWith('www/')),
    'manifest-www.json': files.filter(file => file.startsWith('www/') && !isBinary(file) && !studio(file)),
    'manifest-studio.json': files.filter(studio),
    'manifest-media.json': files.filter(file => file.startsWith('www/') && isBinary(file))
  };
}
module.exports = { manifestGroups };

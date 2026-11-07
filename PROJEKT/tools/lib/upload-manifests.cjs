// Vollständige Nachweise: Server, Browser, private Android-Anbindung/Arbeitsflächen und Medien.
function manifestGroups(files, isBinary) {
  const studio = file => /^server\/android\//.test(file) || /^www\/js\/(?:studio|team|operator)\//.test(file) || file === 'www/relay-settings.html' || /^www\/css\/(?:studio|team)\//.test(file);
  const media = file => file.startsWith('www/') && (isBinary(file) || file.startsWith('www/fonts/'));
  return {
    'manifest-server.json': files.filter(file => !file.startsWith('www/') && !studio(file)),
    'manifest-www.json': files.filter(file => file.startsWith('www/') && !media(file) && !studio(file)),
    'manifest-studio.json': files.filter(studio),
    'manifest-media.json': files.filter(media)
  };
}
module.exports = { manifestGroups };

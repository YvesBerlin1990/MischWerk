/* Begrenzte private Fehleranzeige; ausschließlich bekannte Stufen und HTTP-Codes. */
MischWerkUI.define('teamConnectionDiagnosis', function (dependencies) {
  'use strict';
  var reasons = {
    http_response:'HTTP-Antwort nicht bestätigt', http_status:'HTTP-Anfrage abgewiesen',
    response_url:'Antwortadresse nicht bestätigt', response_size:'Antwort zu groß',
    response_json:'Antwort nicht als JSON lesbar', contract_version:'Antwortversion nicht bestätigt',
    response_contract:'Antwortfelder nicht bestätigt', response_receipts:'Wunschquittungen nicht bestätigt',
    response_migration:'Exportquittung nicht bestätigt', response_projection:'Sender- oder Nickfreigaben nicht bestätigt',
    response_events:'Sendungsmeldungen nicht bestätigt', prepare:'Anfrage konnte nicht vorbereitet werden',
    send:'Anfrage konnte nicht gesendet werden', timeout:'Antwortfrist überschritten',
    busy:'Eine frühere Anfrage wartet noch auf Rückmeldung'
  };
  function render(operation, targetKind) {
    var failure = operation && operation.lastFailure;
    var reason = failure && Object.prototype.hasOwnProperty.call(reasons, failure.stage) ? reasons[failure.stage] : '';
    var code = failure && Number.isInteger(failure.httpStatus) && failure.httpStatus >= 100 && failure.httpStatus <= 599 ?
      ' (HTTP ' + failure.httpStatus + ')' : '';
    var target = targetKind === 'cloud-functions' ? 'Gespeichertes Ziel: Google Cloud Functions. ' :
      targetKind === 'cloud-run' ? 'Gespeichertes Ziel: Google Cloud Run. ' : '';
    dependencies.dom.setText('relay-failure', target + (operation && !operation.healthy && reason ? reason + code + '.' : ''));
  }
  return { render:render };
});

/**
 * @param {string} fileName
 * @return {void} null
 */
function require(fileName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html
 * @class App
 */
function App() {}

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_mayJoinChannel
 * @param {User} user
 * @return {ChannelJoinPermission} 
 */
App.prototype.mayJoinChannel = function mayJoinChannel(user) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_mayShowPublicMessage
 * @param {PublicMessage} publicMessage
 * @return {Boolean} true, wenn die Nachricht angezeigt werden soll, false im anderen Fall.
 */
App.prototype.mayShowPublicMessage = function mayShowPublicMessage(publicMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_mayShowPublicActionMessage
 * @param {PublicActionMessage} publicActionMessage
 * @return {Boolean} true, wenn die Handlung ausgefÃ¼hrt werden soll, false im anderen Fall.
 */
App.prototype.mayShowPublicActionMessage = function mayShowPublicActionMessage(publicActionMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onAppStart
 * @return {void} 
 */
App.prototype.onAppStart = function onAppStart() {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onBeforeKnuddelReceived
 * @param {KnuddelTransfer} knuddelTransfer
 * @return {void} 
 */
App.prototype.onBeforeKnuddelReceived = function onBeforeKnuddelReceived(knuddelTransfer) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onKnuddelReceived
 * @param {User} sender
 * @param {BotUser} receiver
 * @param {KnuddelAmount} knuddelAmount
 * @param {String} transferReason
 * @return {void} 
 */
App.prototype.onKnuddelReceived = function onKnuddelReceived(sender, receiver, knuddelAmount, transferReason) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onPrepareShutdown
 * @param {Number} secondsTillShutdown
 * @return {void} 
 */
App.prototype.onPrepareShutdown = function onPrepareShutdown(secondsTillShutdown) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onPrivateMessage
 * @param {PrivateMessage} privateMessage
 * @return {void} 
 */
App.prototype.onPrivateMessage = function onPrivateMessage(privateMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onPublicMessage
 * @param {PublicMessage} publicMessage
 * @return {void} 
 */
App.prototype.onPublicMessage = function onPublicMessage(publicMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onPublicEventMessage
 * @param {PublicEventMessage} publicEventMessage
 * @return {void} 
 */
App.prototype.onPublicEventMessage = function onPublicEventMessage(publicEventMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onPublicActionMessage
 * @param {PublicActionMessage} publicActionMessage
 * @return {void} 
 */
App.prototype.onPublicActionMessage = function onPublicActionMessage(publicActionMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onShutdown
 * @return {void} 
 */
App.prototype.onShutdown = function onShutdown() {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onUserDiced
 * @param {DiceEvent} diceEvent
 * @return {void} 
 */
App.prototype.onUserDiced = function onUserDiced(diceEvent) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onUserJoined
 * @param {User} user
 * @return {void} 
 */
App.prototype.onUserJoined = function onUserJoined(user) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onUserLeft
 * @param {User} user
 * @return {void} 
 */
App.prototype.onUserLeft = function onUserLeft(user) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onDebtsUpdate
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {KnuddelAmount} debts
 * @return {void} 
 */
App.prototype.onDebtsUpdate = function onDebtsUpdate(debts) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onAppEventReceived
 * @param {AppInstance} appInstance
 * @param {String} type
 * @param {Object} data
 * @return {void} 
 */
App.prototype.onAppEventReceived = function onAppEventReceived(appInstance, type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onAppRequestReceived
 * @param {User} user
 * @param {String} type
 * @param {Object} data
 * @return {Object} Response-Daten
 */
App.prototype.onAppRequestReceived = function onAppRequestReceived(user, type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onEventReceived
 * @param {User} user
 * @param {String} type
 * @param {JSON} data
 * @param {AppContentSession} appContentSession
 * @return {void} 
 */
App.prototype.onEventReceived = function onEventReceived(user, type, data, appContentSession) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onAccountReceivedKnuddel
 * @param {User} sender
 * @param {BotUser} receiver
 * @param {KnuddelAmount} knuddelAmount
 * @param {String} transferReason
 * @param {KnuddelAccount} knuddelAccount
 * @return {void} 
 */
App.prototype.onAccountReceivedKnuddel = function onAccountReceivedKnuddel(sender, receiver, knuddelAmount, transferReason, knuddelAccount) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onAccountChangedKnuddelAmount
 * @param {User} user
 * @param {KnuddelAccount} KnuddelAccount
 * @param {KnuddelAmount} oldKnuddelAmount
 * @param {KnuddelAmount} newKnuddelAmount
 * @return {void} 
 */
App.prototype.onAccountChangedKnuddelAmount = function onAccountChangedKnuddelAmount(user, KnuddelAccount, oldKnuddelAmount, newKnuddelAmount) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onKnuddelAmountChanged
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {User} user
 * @param {KnuddelAmount} oldKnuddelAmount
 * @param {KnuddelAmount} newKnuddelAmount
 * @return {void} 
 */
App.prototype.onKnuddelAmountChanged = function onKnuddelAmountChanged(user, oldKnuddelAmount, newKnuddelAmount) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onKnuddelPurchaseSuccess
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {User} user
 * @param {Number} startTimestamp
 * @param {KnuddelShopProduct} boughtProduct
 * @param {Boolean} toBot
 * @return {void} 
 */
App.prototype.onKnuddelPurchaseSuccess = function onKnuddelPurchaseSuccess(user, startTimestamp, boughtProduct, toBot) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onKnuddelPurchaseFailed
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {User} user
 * @param {Number} startTimestamp
 * @param {String} errorMessage
 * @return {void} 
 */
App.prototype.onKnuddelPurchaseFailed = function onKnuddelPurchaseFailed(user, startTimestamp, errorMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onMaxKnuddelToAppChanged
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {User} user
 * @param {KnuddelAmount} oldMaxKnuddelToApp
 * @param {KnuddelAmount} newMaxKnuddelToApp
 * @return {void} 
 */
App.prototype.onMaxKnuddelToAppChanged = function onMaxKnuddelToAppChanged(user, oldMaxKnuddelToApp, newMaxKnuddelToApp) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onUserDeleted
 * @param {Number} userId
 * @param {UserPersistence} userPersistence
 * @return {void} 
 */
App.prototype.onUserDeleted = function onUserDeleted(userId, userPersistence) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_onDeveloperCommand
 * @since AppServer 108662, ChatServer 108662
 * @param {User} user
 * @param {String} params
 * @return {void} 
 */
App.prototype.onDeveloperCommand = function onDeveloperCommand(user, params) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#method_mayUserDice
 * @param {User} user
 * @param {DiceConfiguration} diceConfig
 * @return {Boolean} true, wenn der User wÃ¼rfeln darf, false im anderen Fall.
 */
App.prototype.mayUserDice = function mayUserDice(user, diceConfig) {};

/**
 * @see https://developer.knuddels.de/docs/classes/App.html#property_chatCommands
 * ErmÃ¶glicht das Registrieren eigener Chatbefehle.
 * In einem Channel kann nur eine App laufen, die einen bestimmten Chatbefehl nutzt.
 * Versucht eine zweite App einen Chatbefehl zu registrieren, den eine andere
 * App bereits nutzt, so wird ein Fehler geloggt und die App startet nicht bzw. fÃ¤hrt herunter.
 * 
 * Die Struktur eines registrierten Chatbefehls ist:
 * commandName: function (user, params, command) {}
 * 
 * 
 * 
 * commandName ist der Name der Funktion, wie sie aufgerufen wird (beispielsweise /commandname)
 * user ist der Nutzer, der die Funktion aufgerufen hat
 * params sind die Parameter, die der Nutzer hinter dem Befehl eingegeben hat (beispielsweise /commandname params)
 * command ist der Name des Befehl selbst (beispielsweise commandName)
 * 

* @type {Object}
*/
App.chatCommands = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/HttpHeaders.html
 * @class HttpHeaders
 * @since AppServer 20260213-125115
 */
function HttpHeaders() {}




/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html
 * @class Toplist
 */
function Toplist() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_getUserPersistenceNumberKey
 * @return {String} userPersistenceNumberKey mit dem die Topliste erzeugt wurde
 */
Toplist.prototype.getUserPersistenceNumberKey = function getUserPersistenceNumberKey() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_getDisplayName
 * @return {String} Anzeigename der Topliste
 */
Toplist.prototype.getDisplayName = function getDisplayName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_getChatCommand
 * @param {User|Number} [user|userId]
 * @return {String} 
 */
Toplist.prototype.getChatCommand = function getChatCommand(userOruserId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_getLabel
 * @param {User|Number} user|userId
 * @return {String} Anzeigename
 */
Toplist.prototype.getLabel = function getLabel(userOruserId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_addLabelChangeListener
 * @param {Function} listener
 * @return {void} 
 */
Toplist.prototype.addLabelChangeListener = function addLabelChangeListener(listener) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_removeLabelChangeListener
 * @param {Function} listener
 * @return {void} 
 */
Toplist.prototype.removeLabelChangeListener = function removeLabelChangeListener(listener) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_addRankChangeListener
 * @param {Function} listener
 * @return {void} 
 */
Toplist.prototype.addRankChangeListener = function addRankChangeListener(listener) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Toplist.html#method_removeRankChangeListener
 * @param {Function} listener
 * @return {void} 
 */
Toplist.prototype.removeRankChangeListener = function removeRankChangeListener(listener) {};




/**
 * @see https://developer.knuddels.de/docs/classes/SingleDiceResult.html
 * @class SingleDiceResult
 */
function SingleDiceResult() {}

/**
 * @see https://developer.knuddels.de/docs/classes/SingleDiceResult.html#method_getDice
 * @return {Dice} 
 */
SingleDiceResult.prototype.getDice = function getDice() {};

/**
 * @see https://developer.knuddels.de/docs/classes/SingleDiceResult.html#method_valuesRolled
 * @return {Number[]} 
 */
SingleDiceResult.prototype.valuesRolled = function valuesRolled() {};

/**
 * @see https://developer.knuddels.de/docs/classes/SingleDiceResult.html#method_sum
 * @return {Number} 
 */
SingleDiceResult.prototype.sum = function sum() {};




/**
 * @see https://developer.knuddels.de/docs/classes/WebHookResponse.html
 * @class WebHookResponse
 * @since AppServer 20260213-125115
 */
function WebHookResponse() {}

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookResponse.html#method_send
 * @param {Number} statusCode
 * @param {Object} headers
 * @param {String} body
 * @return {void} 
 */
WebHookResponse.prototype.send = function send(statusCode, headers, body) {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookResponse.html#method_isSent
 * @return {Boolean} 
 */
WebHookResponse.prototype.isSent = function isSent() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChatServerInfo.html
 * @class ChatServerInfo
 * @extends ServerInfo
 */
function ChatServerInfo() {}
ChatServerInfo.prototype = new ServerInfo;

/**
 * @see https://developer.knuddels.de/docs/classes/ChatServerInfo.html#method_isTestSystem
 * @return {Boolean} 
 */
ChatServerInfo.prototype.isTestSystem = function isTestSystem() {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html
 * @class AppContentSession
 */
function AppContentSession() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_sendEvent
 * @param {String} type
 * @param {Json} [data]
 * @return {void} 
 */
AppContentSession.prototype.sendEvent = function sendEvent(type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_getAppViewMode
 * @return {AppViewMode} 
 */
AppContentSession.prototype.getAppViewMode = function getAppViewMode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_remove
 * @return {void} 
 */
AppContentSession.prototype.remove = function remove() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_getUser
 * @return {User} user
 */
AppContentSession.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_getAppContent
 * @return {AppContent} 
 */
AppContentSession.prototype.getAppContent = function getAppContent() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_getGlobalAppInstance
 * @return {GlobalAppInstance|null} 
 */
AppContentSession.prototype.getGlobalAppInstance = function getGlobalAppInstance() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_getOpenTimestamp
 * @return {Date} 
 */
AppContentSession.prototype.getOpenTimestamp = function getOpenTimestamp() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContentSession.html#method_isConnectedUsingDirectConnection
 * @return {Boolean} 
 */
AppContentSession.prototype.isConnectedUsingDirectConnection = function isConnectedUsingDirectConnection() {};




/**
 * @see https://developer.knuddels.de/docs/classes/String.html
 * @class String
 */
function String() {}

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_escapeKCode
 * @return {String} KCode escaped
 */
String.prototype.escapeKCode = function escapeKCode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_stripKCode
 * @return {String} 
 */
String.prototype.stripKCode = function stripKCode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_startsWith
 * @param {String} prefix
 * @return {Boolean} true, wenn der String mit prefix beginnt.
 */
String.prototype.startsWith = function startsWith(prefix) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_endsWith
 * @param {String} suffix
 * @return {Boolean} true, wenn der String mit suffix endet.
 */
String.prototype.endsWith = function endsWith(suffix) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_getPixelWidth
 * @param {Number} fontSize
 * @param {Boolean} isBold
 * @return {Number} 
 */
String.prototype.getPixelWidth = function getPixelWidth(fontSize, isBold) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_limitString
 * @param {Number} fontSize
 * @param {Boolean} isBold
 * @param {Number} maxPixelWidth
 * @param {String} [abbreviationMarker]
 * @return {String} 
 */
String.prototype.limitString = function limitString(fontSize, isBold, maxPixelWidth, abbreviationMarker) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_contains
 * @param {String} needle
 * @return {Boolean} 
 */
String.prototype.contains = function contains(needle) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_minimalConversionCost
 * @since AppServer 82271
 * @param {String} otherString
 * @return {Number} 
 */
String.prototype.minimalConversionCost = function minimalConversionCost(otherString) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_hasOnlyNicknameCharacters
 * @since AppServer 82271
 * @return {Boolean} 
 */
String.prototype.hasOnlyNicknameCharacters = function hasOnlyNicknameCharacters() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_hasOnlyDigits
 * @since AppServer 82271
 * @return {Boolean} 
 */
String.prototype.hasOnlyDigits = function hasOnlyDigits() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_hasOnlyAlphanumericalAndWhitespaceCharacters
 * @since AppServer 82271
 * @return {Boolean} 
 */
String.prototype.hasOnlyAlphanumericalAndWhitespaceCharacters = function hasOnlyAlphanumericalAndWhitespaceCharacters() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_isEmpty
 * @since AppServer 92695
 * @return {Boolean} 
 */
String.prototype.isEmpty = function isEmpty() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_toCamelCase
 * @since AppServer 92695
 * @return {String} 
 */
String.prototype.toCamelCase = function toCamelCase() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_capitalize
 * @since AppServer 92695
 * @return {String} 
 */
String.prototype.capitalize = function capitalize() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_replaceAll
 * @param {String} search
 * @param {String} replacement
 * @return {String} 
 */
String.prototype.replaceAll = function replaceAll(search, replacement) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_replaceAll
 * @param {RegExp} regexp
 * @param {String} replacement
 * @return {String} 
 */
String.prototype.replaceAll = function replaceAll(regexp, replacement) {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_isOk
 * @since ChatServer 82262, AppServer 82262
 * @return {Boolean} 
 */
String.prototype.isOk = function isOk() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_isAllowedAsChatMessage
 * @return {Boolean} 
 */
String.prototype.isAllowedAsChatMessage = function isAllowedAsChatMessage() {};

/**
 * @see https://developer.knuddels.de/docs/classes/String.html#method_isAllowedAsNick
 * @return {Boolean} 
 */
String.prototype.isAllowedAsNick = function isAllowedAsNick() {};




/**
 * @see https://developer.knuddels.de/docs/classes/Gender.html
 * @class Gender
 */
function Gender() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Gender.html#property_Male
 * Das Geschlecht ist mÃ¤nnlich.

* @type {Gender}
*/
Gender.Male = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/Gender.html#property_Female
 * Das Geschlecht ist weiblich.

* @type {Gender}
*/
Gender.Female = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/Gender.html#property_Unknown
 * Das Geschlecht ist nicht bekannt.

* @type {Gender}
*/
Gender.Unknown = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html
 * @class UserStatus
 */
function UserStatus() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#method_getNumericStatus
 * @return {Number} 
 */
UserStatus.prototype.getNumericStatus = function getNumericStatus() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#method_isAtLeast
 * @param {UserStatus} otherUserStatus
 * @return {Boolean} 
 */
UserStatus.prototype.isAtLeast = function isAtLeast(otherUserStatus) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_Newbie
 * 

* @type {UserStatus}
*/
UserStatus.Newbie = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_Family
 * 

* @type {UserStatus}
*/
UserStatus.Family = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_Stammi
 * 

* @type {UserStatus}
*/
UserStatus.Stammi = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_HonoryMember
 * 

* @type {UserStatus}
*/
UserStatus.HonoryMember = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_Admin
 * 

* @type {UserStatus}
*/
UserStatus.Admin = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_SystemBot
 * 

* @type {UserStatus}
*/
UserStatus.SystemBot = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserStatus.html#property_Sysadmin
 * 

* @type {UserStatus}
*/
UserStatus.Sysadmin = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html
 * @class AuthenticityClassification
 */
function AuthenticityClassification() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html#method_getDisplayText
 * @since AppServer 94663, ChatServer 94663
 * @return {String} 
 */
AuthenticityClassification.prototype.getDisplayText = function getDisplayText() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html#property_ServiceNotAvailable
 * Der Service zur Erkennung der Echtheit von Nutzern ist derzeit fÃ¼r die API nicht erreichbar.

* @type {AuthenticityClassification}
*/
AuthenticityClassification.ServiceNotAvailable = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html#property_Unknown
 * Es liegen zu wenige Informationen vor, um die Echtheit des Nutzers zu bestÃ¤tigen.

* @type {AuthenticityClassification}
*/
AuthenticityClassification.Unknown = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html#property_Trusted
 * Der Nutzer ist sehr wahrscheinlich echt.

* @type {AuthenticityClassification}
*/
AuthenticityClassification.Trusted = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AuthenticityClassification.html#property_VeryTrusted
 * Der Nutzer wurde als echt erkannt.

* @type {AuthenticityClassification}
*/
AuthenticityClassification.VeryTrusted = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html
 * @class WebHookRequest
 * @since AppServer 20260213-125115
 */
function WebHookRequest() {}

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getMethod
 * @return {String} 
 */
WebHookRequest.prototype.getMethod = function getMethod() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getPath
 * @return {String} 
 */
WebHookRequest.prototype.getPath = function getPath() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getQueryString
 * @return {String} 
 */
WebHookRequest.prototype.getQueryString = function getQueryString() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getHeaders
 * @return {HttpHeaders} 
 */
WebHookRequest.prototype.getHeaders = function getHeaders() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getBody
 * @return {String} 
 */
WebHookRequest.prototype.getBody = function getBody() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getBodyBase64
 * @return {String} 
 */
WebHookRequest.prototype.getBodyBase64 = function getBodyBase64() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getContentType
 * @return {String} 
 */
WebHookRequest.prototype.getContentType = function getContentType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookRequest.html#method_getRemoteAddress
 * @return {String} 
 */
WebHookRequest.prototype.getRemoteAddress = function getRemoteAddress() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html
 * @class ToplistLabelChangeEvent
 */
function ToplistLabelChangeEvent() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getToplist
 * @return {Toplist} 
 */
ToplistLabelChangeEvent.prototype.getToplist = function getToplist() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getOldLabel
 * @return {String} 
 */
ToplistLabelChangeEvent.prototype.getOldLabel = function getOldLabel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getNewLabel
 * @return {String} 
 */
ToplistLabelChangeEvent.prototype.getNewLabel = function getNewLabel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getUser
 * @return {User} 
 */
ToplistLabelChangeEvent.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getOldValue
 * @return {Number} 
 */
ToplistLabelChangeEvent.prototype.getOldValue = function getOldValue() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistLabelChangeEvent.html#method_getNewValue
 * @return {Number} 
 */
ToplistLabelChangeEvent.prototype.getNewValue = function getNewValue() {};




/**
 * @see https://developer.knuddels.de/docs/classes/PrivateMessage.html
 * @class PrivateMessage
 * @extends Message
 */
function PrivateMessage() {}
PrivateMessage.prototype = new Message;

/**
 * @see https://developer.knuddels.de/docs/classes/PrivateMessage.html#method_getReceivingUsers
 * @return {User[]} 
 */
PrivateMessage.prototype.getReceivingUsers = function getReceivingUsers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/PrivateMessage.html#method_sendReply
 * @param {String} text
 * @return {void} 
 */
PrivateMessage.prototype.sendReply = function sendReply(text) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ToplistDisplayType.html
 * @class ToplistDisplayType
 */
function ToplistDisplayType() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistDisplayType.html#property_Label
 * Nur Anzeigename anzeigen.

* @type {ToplistDisplayType}
*/
ToplistDisplayType.Label = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ToplistDisplayType.html#property_Value
 * Gespeicherten Wert anzeigen.

* @type {ToplistDisplayType}
*/
ToplistDisplayType.Value = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ToplistDisplayType.html#property_LabelAndRank
 * Anzeigename und Rang anzeigen.

* @type {ToplistDisplayType}
*/
ToplistDisplayType.LabelAndRank = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ToplistDisplayType.html#property_ValueAndRank
 * Wert und Rang anzeigen.

* @type {ToplistDisplayType}
*/
ToplistDisplayType.ValueAndRank = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html
 * @class RootAppInstance
 * @extends AppInstance
 */
function RootAppInstance() {}
RootAppInstance.prototype = new AppInstance;

/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html#method_updateAppFiles
 * @return {String[]} Dateinamen aller aktualisierten Dateien.
 */
RootAppInstance.prototype.updateAppFiles = function updateAppFiles() {};

/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html#method_invalidateClientCache
 * @return {void} 
 */
RootAppInstance.prototype.invalidateClientCache = function invalidateClientCache() {};

/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html#method_updateApp
 * @param {String} [message]
 * @param {String} [logMessage]
 * @return {Number} Anzahl Sekunden bis das Update planmÃ¤ÃŸig durchgefÃ¼hrt wird.
 */
RootAppInstance.prototype.updateApp = function updateApp(message, logMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html#method_cancelUpdateApp
 * @since AppServer 98117
 * @return {Boolean} true falls ein Update abgebrochen wurde.
 */
RootAppInstance.prototype.cancelUpdateApp = function cancelUpdateApp() {};

/**
 * @see https://developer.knuddels.de/docs/classes/RootAppInstance.html#method_stopApp
 * @param {String} [message]
 * @param {String} [logMessage]
 * @return {void} 
 */
RootAppInstance.prototype.stopApp = function stopApp(message, logMessage) {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html
 * @class AppInstance
 */
function AppInstance() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getAppInfo
 * @return {AppInfo} 
 */
AppInstance.prototype.getAppInfo = function getAppInfo() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_sendAppEvent
 * @param {String} type
 * @param {Object} data
 * @return {void} 
 */
AppInstance.prototype.sendAppEvent = function sendAppEvent(type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_isRootInstance
 * @return {Boolean} 
 */
AppInstance.prototype.isRootInstance = function isRootInstance() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getRootInstance
 * @return {RootAppInstance} 
 */
AppInstance.prototype.getRootInstance = function getRootInstance() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getAllInstances
 * @param {Boolean} [includeSelf]
 * @return {AppInstance[]} 
 */
AppInstance.prototype.getAllInstances = function getAllInstances(includeSelf) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getStartDate
 * @return {Date} 
 */
AppInstance.prototype.getStartDate = function getStartDate() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getRegisteredChatCommandNames
 * @return {String[]|null} 
 */
AppInstance.prototype.getRegisteredChatCommandNames = function getRegisteredChatCommandNames() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInstance.html#method_getChannelName
 * @return {String} 
 */
AppInstance.prototype.getChannelName = function getChannelName() {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShop.html
 * @class KnuddelShop
 */
function KnuddelShop() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShop.html#method_getShopName
 * @return {String} 
 */
KnuddelShop.prototype.getShopName = function getShopName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShop.html#method_getProducts
 * @return {KnuddelShopProduct[]} 
 */
KnuddelShop.prototype.getProducts = function getProducts() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelInformation.html
 * @class ChannelInformation
 */
function ChannelInformation() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelInformation.html#method_getTopic
 * @return {String} 
 */
ChannelInformation.prototype.getTopic = function getTopic() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelInformation.html#method_setTopic
 * @param {String} topic
 * @param {Boolean} showMessage
 * @return {void} 
 */
ChannelInformation.prototype.setTopic = function setTopic(topic, showMessage) {};




/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html
 * @class UserAccess
 */
function UserAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_getUserId
 * @param {String} nick
 * @return {Number} userId des Users mit dem angegebenen Nick
 */
UserAccess.prototype.getUserId = function getUserId(nick) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_exists
 * @param {String} nick
 * @return {Boolean} true, falls ein User mit diesem Nick existiert, false andernfalls
 */
UserAccess.prototype.exists = function exists(nick) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_isUserDeleted
 * @param {Number} userId
 * @return {Boolean} true, falls der User mit dieser userId gelÃ¶scht wurde, false andernfalls (auch wenn er niemals existierte)
 */
UserAccess.prototype.isUserDeleted = function isUserDeleted(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_mayAccess
 * @param {Number} userId
 * @return {Boolean} true, falls der Nutzer mit UserAccess/getUserById:method geladen werden darf, false andernfalls
 */
UserAccess.prototype.mayAccess = function mayAccess(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_getUserById
 * @param {Number} userId
 * @return {User} User, der die Ã¼bergebene userId besitzt
 */
UserAccess.prototype.getUserById = function getUserById(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_getNick
 * @param {Number} userId
 * @return {String} Korrekt geschriebener Nickname fÃ¼r den User der Ã¼bergebenen userId
 */
UserAccess.prototype.getNick = function getNick(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_getAccessibleUserCount
 * @since AppServer 20200212-112449
 * @return {Number} die Anzahl der fÃ¼r diese App zugreifbaren User
 */
UserAccess.prototype.getAccessibleUserCount = function getAccessibleUserCount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserAccess.html#method_eachAccessibleUser
 * @param {Function} callback
 * @param {Object} [parameters]
 * @return {void} 
 */
UserAccess.prototype.eachAccessibleUser = function eachAccessibleUser(callback, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html
 * @class Channel
 */
function Channel() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getChannelConfiguration
 * @return {ChannelConfiguration} 
 */
Channel.prototype.getChannelConfiguration = function getChannelConfiguration() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getChannelRestrictions
 * @return {ChannelRestrictions} 
 */
Channel.prototype.getChannelRestrictions = function getChannelRestrictions() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getChannelDesign
 * @since AppServer 87470, ChatServer 87470
 * @return {ChannelDesign} 
 */
Channel.prototype.getChannelDesign = function getChannelDesign() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getOnlineUsers
 * @param {...UserType} [userType]
 * @return {User[]} 
 */
Channel.prototype.getOnlineUsers = function getOnlineUsers(userType) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_isVideoChannel
 * @return {Boolean} 
 */
Channel.prototype.isVideoChannel = function isVideoChannel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getVideoChannelData
 * @return {VideoChannelData} 
 */
Channel.prototype.getVideoChannelData = function getVideoChannelData() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getChannelName
 * @return {String} 
 */
Channel.prototype.getChannelName = function getChannelName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getRootChannelName
 * @return {String} 
 */
Channel.prototype.getRootChannelName = function getRootChannelName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getTalkMode
 * @return {ChannelTalkMode} 
 */
Channel.prototype.getTalkMode = function getTalkMode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_getAllUsersWithTalkPermission
 * @param {...ChannelTalkPermission} channelTalkPermission
 * @return {User[]} 
 */
Channel.prototype.getAllUsersWithTalkPermission = function getAllUsersWithTalkPermission(channelTalkPermission) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Channel.html#method_isVisible
 * @since AppServer 82202
 * @return {Boolean} 
 */
Channel.prototype.isVisible = function isVisible() {};




/**
 * @see https://developer.knuddels.de/docs/classes/Color.html
 * @class Color
 */
function Color() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_fromRGB
 * @static
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @return {Color} 
 */
Color.fromRGB = function fromRGB(red, green, blue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_fromRGBA
 * @static
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @param {Number} alpha
 * @return {Color} 
 */
Color.fromRGBA = function fromRGBA(red, green, blue, alpha) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_getAlpha
 * @return {Number} 
 */
Color.prototype.getAlpha = function getAlpha() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_getBlue
 * @return {Number} 
 */
Color.prototype.getBlue = function getBlue() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_getGreen
 * @return {Number} 
 */
Color.prototype.getGreen = function getGreen() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_getRed
 * @return {Number} 
 */
Color.prototype.getRed = function getRed() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_toKCode
 * @return {String} 
 */
Color.prototype.toKCode = function toKCode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_asNumber
 * @return {Number} 
 */
Color.prototype.asNumber = function asNumber() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_fromNumber
 * @static
 * @param {Number} value
 * @return {Color} 
 */
Color.fromNumber = function fromNumber(value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_fromHexString
 * @static
 * @param {String} value
 * @return {Color} 
 */
Color.fromHexString = function fromHexString(value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Color.html#method_asHexString
 * @return {String} 
 */
Color.prototype.asHexString = function asHexString() {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntryAccess.html
 * @class AppProfileEntryAccess
 */
function AppProfileEntryAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntryAccess.html#method_getAllProfileEntries
 * @return {AppProfileEntry[]} 
 */
AppProfileEntryAccess.prototype.getAllProfileEntries = function getAllProfileEntries() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntryAccess.html#method_getAppProfileEntry
 * @param {String} userPersistenceNumberKey
 * @return {AppProfileEntry} 
 */
AppProfileEntryAccess.prototype.getAppProfileEntry = function getAppProfileEntry(userPersistenceNumberKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntryAccess.html#method_createOrUpdateEntry
 * @param {Toplist} toplist
 * @param {ToplistDisplayType} toplistDisplayType
 * @return {AppProfileEntry} 
 */
AppProfileEntryAccess.prototype.createOrUpdateEntry = function createOrUpdateEntry(toplist, toplistDisplayType) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntryAccess.html#method_removeEntry
 * @param {AppProfileEntry} appProfileEntry
 * @return {void} 
 */
AppProfileEntryAccess.prototype.removeEntry = function removeEntry(appProfileEntry) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelConfiguration.html
 * @class ChannelConfiguration
 */
function ChannelConfiguration() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelConfiguration.html#method_getChannelRights
 * @return {ChannelRights} 
 */
ChannelConfiguration.prototype.getChannelRights = function getChannelRights() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelConfiguration.html#method_getChannelInformation
 * @return {ChannelInformation} 
 */
ChannelConfiguration.prototype.getChannelInformation = function getChannelInformation() {};




/**
 * @see https://developer.knuddels.de/docs/classes/PublicEventMessage.html
 * @class PublicEventMessage
 * @extends Message
 */
function PublicEventMessage() {}
PublicEventMessage.prototype = new Message;

/**
 * @see https://developer.knuddels.de/docs/classes/PublicEventMessage.html#method_getFunctionName
 * @return {String} 
 */
PublicEventMessage.prototype.getFunctionName = function getFunctionName() {};




/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistence.html
 * @class UserPersistence
 * @extends Persistence
 */
function UserPersistence() {}
UserPersistence.prototype = new Persistence;

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistence.html#method_deleteAllNumbers
 * @since AppServer 88569
 * @return {Number} Anzahl der gelÃ¶schten Zahlenwerte
 */
UserPersistence.prototype.deleteAllNumbers = function deleteAllNumbers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistence.html#method_deleteAllObjects
 * @since AppServer 88569
 * @return {Number} Anzahl der gelÃ¶schten Objekte
 */
UserPersistence.prototype.deleteAllObjects = function deleteAllObjects() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistence.html#method_deleteAllStrings
 * @since AppServer 88569
 * @return {Number} Anzahl der gelÃ¶schten Zeichenketten.
 */
UserPersistence.prototype.deleteAllStrings = function deleteAllStrings() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistence.html#method_deleteAll
 * @since AppServer 88569
 * @return {Number} 
 */
UserPersistence.prototype.deleteAll = function deleteAll() {};




/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html
 * @class UserPersistenceNumbers
 */
function UserPersistenceNumbers() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getSum
 * @static
 * @param {String} key
 * @return {Number} Summe
 */
UserPersistenceNumbers.getSum = function getSum(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_deleteAll
 * @static
 * @param {String} key
 * @return {Number} Anzahl der gelÃ¶schten EintrÃ¤ge
 */
UserPersistenceNumbers.deleteAll = function deleteAll(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getCount
 * @static
 * @param {String} key
 * @param {Object} [parameters]
 * @return {Number} 
 */
UserPersistenceNumbers.getCount = function getCount(key, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_updateKey
 * @static
 * @param {String} oldKeyName
 * @param {String} newKeyName
 * @return {Number} Anzahl der aktualisierten Nutzer
 */
UserPersistenceNumbers.updateKey = function updateKey(oldKeyName, newKeyName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_updateValue
 * @static
 * @param {String} key
 * @param {Number} oldValue
 * @param {Number} newValue
 * @return {Number} Anzahl der EintrÃ¤ge, die geÃ¤ndert wurden
 */
UserPersistenceNumbers.updateValue = function updateValue(key, oldValue, newValue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_addNumber
 * @static
 * @param {String} key
 * @param {Number} value
 * @param {Object} [parameters]
 * @return {Number} Anzahl der EintrÃ¤ge, die geÃ¤ndert wurden
 */
UserPersistenceNumbers.addNumber = function addNumber(key, value, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getSortedEntries
 * @static
 * @param {String} key
 * @param {Object} [parameters]
 * @return {UserPersistenceNumberEntry[]} Gefundene Elemente - falls keine Elemente vorhanden sind ist das Array leer.
 */
UserPersistenceNumbers.getSortedEntries = function getSortedEntries(key, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getSortedEntriesAdjacent
 * @static
 * @param {String} key
 * @param {User|Number} user|userId
 * @param {Object} [parameters]
 * @return {UserPersistenceNumberEntry[]} Gefundene Elemente - falls keine Elemente vorhanden sind ist das Array leer.
 */
UserPersistenceNumbers.getSortedEntriesAdjacent = function getSortedEntriesAdjacent(key, userOruserId, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getPosition
 * @static
 * @param {String} key
 * @param {User|Number} user|userId
 * @param {Object} [parameters]
 * @return {Number} 
 */
UserPersistenceNumbers.getPosition = function getPosition(key, userOruserId, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getRank
 * @static
 * @param {String} key
 * @param {User|Number} user|userId
 * @param {Object} [parameters]
 * @return {Number} 
 */
UserPersistenceNumbers.getRank = function getRank(key, userOruserId, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_each
 * @static
 * @param {String} key
 * @param {Function} callback
 * @param {Object} [parameters]
 * @return {void} 
 */
UserPersistenceNumbers.each = function each(key, callback, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getUserIdsByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceNumbers.getUserIdsByKey = function getUserIdsByKey(key, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getNicksByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceNumbers.getNicksByKey = function getNicksByKey(key, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumbers.html#method_getAllKeys
 * @static
 * @since AppServer 82483
 * @param {String} [filterKey]
 * @return {String[]} Liste mit allen keys
 */
UserPersistenceNumbers.getAllKeys = function getAllKeys(filterKey) {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html
 * @class AppInfo
 */
function AppInfo() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppUid
 * @return {Number} 
 */
AppInfo.prototype.getAppUid = function getAppUid() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getRootAppUid
 * @return {Number} 
 */
AppInfo.prototype.getRootAppUid = function getRootAppUid() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppName
 * @return {String} Name der App
 */
AppInfo.prototype.getAppName = function getAppName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppVersion
 * @return {String} 
 */
AppInfo.prototype.getAppVersion = function getAppVersion() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppId
 * @return {String} appId
 */
AppInfo.prototype.getAppId = function getAppId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppKey
 * @return {String} appKey
 */
AppInfo.prototype.getAppKey = function getAppKey() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppDeveloper
 * @return {User} 
 */
AppInfo.prototype.getAppDeveloper = function getAppDeveloper() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppManagers
 * @return {User[]} 
 */
AppInfo.prototype.getAppManagers = function getAppManagers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_updateApp
 * @param {String} [message]
 * @param {String} [logMessage]
 * @return {void} 
 */
AppInfo.prototype.updateApp = function updateApp(message, logMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_stopApp
 * @param {String} [message]
 * @param {String} [logMessage]
 * @return {void} 
 */
AppInfo.prototype.stopApp = function stopApp(message, logMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getTaxRate
 * @return {Number} 
 */
AppInfo.prototype.getTaxRate = function getTaxRate() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getTotalTaxKnuddelAmount
 * @return {KnuddelAmount} 
 */
AppInfo.prototype.getTotalTaxKnuddelAmount = function getTotalTaxKnuddelAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_getMaxPayoutKnuddelAmount
 * @return {KnuddelAmount} 
 */
AppInfo.prototype.getMaxPayoutKnuddelAmount = function getMaxPayoutKnuddelAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppInfo.html#method_requestKnuddelDebts
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {Function} callback
 * @return {void} 
 */
AppInfo.prototype.requestKnuddelDebts = function requestKnuddelDebts(callback) {};




/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html
 * @class Persistence
 */
function Persistence() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_hasString
 * @param {String} key
 * @return {Boolean} 
 */
Persistence.prototype.hasString = function hasString(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_setString
 * @param {String} key
 * @param {String} value
 * @return {void} 
 */
Persistence.prototype.setString = function setString(key, value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_getString
 * @param {String} key
 * @param {String} [defaultValue]
 * @return {String} 
 */
Persistence.prototype.getString = function getString(key, defaultValue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_deleteString
 * @param {String} key
 * @return {void} 
 */
Persistence.prototype.deleteString = function deleteString(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_hasNumber
 * @param {String} key
 * @return {Boolean} 
 */
Persistence.prototype.hasNumber = function hasNumber(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_setNumber
 * @param {String} key
 * @param {Number} value
 * @return {void} 
 */
Persistence.prototype.setNumber = function setNumber(key, value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_addNumber
 * @param {String} key
 * @param {Number} value
 * @return {Number} Der neue Wert, der fÃ¼r key gespeichert ist.
 */
Persistence.prototype.addNumber = function addNumber(key, value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_getNumber
 * @param {String} key
 * @param {Number} [defaultValue]
 * @return {Number} 
 */
Persistence.prototype.getNumber = function getNumber(key, defaultValue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_deleteNumber
 * @param {String} key
 * @return {void} 
 */
Persistence.prototype.deleteNumber = function deleteNumber(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_hasObject
 * @param {String} key
 * @return {Boolean} 
 */
Persistence.prototype.hasObject = function hasObject(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_setObject
 * @param {String} key
 * @param {Object} object
 * @return {void} 
 */
Persistence.prototype.setObject = function setObject(key, object) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_getObject
 * @param {String} key
 * @param {Object} [defaultValue]
 * @return {Object} 
 */
Persistence.prototype.getObject = function getObject(key, defaultValue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Persistence.html#method_deleteObject
 * @param {String} key
 * @return {void} 
 */
Persistence.prototype.deleteObject = function deleteObject(key) {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html
 * @class AppContent
 */
function AppContent() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getAppViewMode
 * @return {AppViewMode} 
 */
AppContent.prototype.getAppViewMode = function getAppViewMode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getHTMLFile
 * @return {HTMLFile} 
 */
AppContent.prototype.getHTMLFile = function getHTMLFile() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getWidth
 * @return {Number} width
 */
AppContent.prototype.getWidth = function getWidth() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getHeight
 * @return {Number} height
 */
AppContent.prototype.getHeight = function getHeight() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getLoadConfiguration
 * @return {LoadConfiguration} 
 */
AppContent.prototype.getLoadConfiguration = function getLoadConfiguration() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_overlayContent
 * @static
 * @param {HTMLFile} htmlFile
 * @param {Number} width
 * @param {Number} height
 * @return {AppContent} 
 */
AppContent.overlayContent = function overlayContent(htmlFile, width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_overlayContent
 * @static
 * @param {HTMLFile} htmlFile
 * @return {AppContent} 
 */
AppContent.overlayContent = function overlayContent(htmlFile) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_popupContent
 * @static
 * @param {HTMLFile} htmlFile
 * @return {AppContent} 
 */
AppContent.popupContent = function popupContent(htmlFile) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_popupContent
 * @static
 * @param {HTMLFile} htmlFile
 * @param {Number} width
 * @param {Number} height
 * @return {AppContent} 
 */
AppContent.popupContent = function popupContent(htmlFile, width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_globalContent
 * @static
 * @param {HTMLFile} htmlFile
 * @return {AppContent} 
 */
AppContent.globalContent = function globalContent(htmlFile) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_globalContent
 * @static
 * @param {HTMLFile} htmlFile
 * @param {Number} width
 * @param {Number} height
 * @return {AppContent} 
 */
AppContent.globalContent = function globalContent(htmlFile, width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_headerbarContent
 * @static
 * @param {HTMLFile} htmlFile
 * @param {Number} height
 * @return {AppContent} 
 */
AppContent.headerbarContent = function headerbarContent(htmlFile, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_sendEvent
 * @param {String} type
 * @param {Object} [data]
 * @return {void} 
 */
AppContent.prototype.sendEvent = function sendEvent(type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getUsers
 * @return {User[]} 
 */
AppContent.prototype.getUsers = function getUsers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_getSessions
 * @return {AppContentSession[]} 
 */
AppContent.prototype.getSessions = function getSessions() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_replaceWithAppContent
 * @param {AppContent} newAppContent
 * @return {void} 
 */
AppContent.prototype.replaceWithAppContent = function replaceWithAppContent(newAppContent) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_remove
 * @return {void} 
 */
AppContent.prototype.remove = function remove() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_addCloseListener
 * @param {Function} callback
 * @return {void} 
 */
AppContent.prototype.addCloseListener = function addCloseListener(callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_setAllowJFXBrowser
 * @param {Boolean} allowJFXBrowser
 * @return {void} 
 */
AppContent.prototype.setAllowJFXBrowser = function setAllowJFXBrowser(allowJFXBrowser) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_isAllowJFXBrowser
 * @return {Boolean} 
 */
AppContent.prototype.isAllowJFXBrowser = function isAllowJFXBrowser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_setResponsive
 * @param {Boolean} isResponsive
 * @return {void} 
 */
AppContent.prototype.setResponsive = function setResponsive(isResponsive) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppContent.html#method_isResponsive
 * @return {Boolean} 
 */
AppContent.prototype.isResponsive = function isResponsive() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ToplistAccess.html
 * @class ToplistAccess
 */
function ToplistAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistAccess.html#method_getAllToplists
 * @return {Toplist[]} 
 */
ToplistAccess.prototype.getAllToplists = function getAllToplists() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistAccess.html#method_getToplist
 * @param {String} userPersistenceNumberKey
 * @return {Toplist} 
 */
ToplistAccess.prototype.getToplist = function getToplist(userPersistenceNumberKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistAccess.html#method_removeToplist
 * @param {Toplist} toplist
 * @return {void} 
 */
ToplistAccess.prototype.removeToplist = function removeToplist(toplist) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistAccess.html#method_createOrUpdateToplist
 * @param {String} userPersistenceNumberKey
 * @param {String} displayName
 * @param {Object} [parameters]
 * @return {Toplist} 
 */
ToplistAccess.prototype.createOrUpdateToplist = function createOrUpdateToplist(userPersistenceNumberKey, displayName, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html
 * @class KnuddelsServer
 */
function KnuddelsServer() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_execute
 * @static
 * @param {String} fileName
 * @return {void} 
 */
KnuddelsServer.execute = function execute(fileName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_listFiles
 * @static
 * @param {String} path
 * @return {String[]} 
 */
KnuddelsServer.listFiles = function listFiles(path) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getDefaultBotUser
 * @static
 * @return {BotUser} 
 */
KnuddelsServer.getDefaultBotUser = function getDefaultBotUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getPersistence
 * @static
 * @return {AppPersistence} 
 */
KnuddelsServer.getPersistence = function getPersistence() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getChannel
 * @static
 * @return {Channel} 
 */
KnuddelsServer.getChannel = function getChannel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppDeveloper
 * @static
 * @return {User} 
 */
KnuddelsServer.getAppDeveloper = function getAppDeveloper() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppId
 * @static
 * @return {String} appId
 */
KnuddelsServer.getAppId = function getAppId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppName
 * @static
 * @return {String} Name der App
 */
KnuddelsServer.getAppName = function getAppName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppVersion
 * @static
 * @return {String} 
 */
KnuddelsServer.getAppVersion = function getAppVersion() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getUserAccess
 * @static
 * @return {UserAccess} 
 */
KnuddelsServer.getUserAccess = function getUserAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getPaymentAccess
 * @static
 * @since AppServer 108571, ChatServer 108571
 * @return {PaymentAccess} 
 */
KnuddelsServer.getPaymentAccess = function getPaymentAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getExternalServerAccess
 * @static
 * @return {ExternalServerAccess} 
 */
KnuddelsServer.getExternalServerAccess = function getExternalServerAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_registerInAppChatMessage
 * @static
 * @param {String} chatGroupId
 * @param {User} sender
 * @param {String} text
 * @param {Number[]} receiverUserIds
 * @return {void} 
 */
KnuddelsServer.registerInAppChatMessage = function registerInAppChatMessage(chatGroupId, sender, text, receiverUserIds) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_userExists
 * @static
 * @param {String} nick
 * @return {Boolean} 
 */
KnuddelsServer.userExists = function userExists(nick) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getUserId
 * @static
 * @param {String} nick
 * @return {Number} 
 */
KnuddelsServer.getUserId = function getUserId(nick) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_canAccessUser
 * @static
 * @param {Number} userId
 * @return {Boolean} 
 */
KnuddelsServer.canAccessUser = function canAccessUser(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getNickCorrectCase
 * @static
 * @param {Number} userId
 * @return {String} 
 */
KnuddelsServer.getNickCorrectCase = function getNickCorrectCase(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getUser
 * @static
 * @param {Number} userId
 * @return {User} 
 */
KnuddelsServer.getUser = function getUser(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_refreshHooks
 * @static
 * @return {void} 
 */
KnuddelsServer.refreshHooks = function refreshHooks() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getDefaultLogger
 * @static
 * @return {Logger} 
 */
KnuddelsServer.getDefaultLogger = function getDefaultLogger() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getFullImagePath
 * @static
 * @param {String} imageName
 * @return {String} Absoluter Pfad zum Einbinden der Grafik
 */
KnuddelsServer.getFullImagePath = function getFullImagePath(imageName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getFullSystemImagePath
 * @static
 * @param {String} imageName
 * @return {String} Absoluter Pfad zum Einbinden der Grafik
 */
KnuddelsServer.getFullSystemImagePath = function getFullSystemImagePath(imageName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_isTestSystem
 * @static
 * @return {Boolean} 
 */
KnuddelsServer.isTestSystem = function isTestSystem() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_isNewAppKnuddelTransferEnabled
 * @static
 * @return {Boolean} 
 */
KnuddelsServer.isNewAppKnuddelTransferEnabled = function isNewAppKnuddelTransferEnabled() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getChatServerInfo
 * @static
 * @return {ChatServerInfo} 
 */
KnuddelsServer.getChatServerInfo = function getChatServerInfo() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppServerInfo
 * @static
 * @return {AppServerInfo} 
 */
KnuddelsServer.getAppServerInfo = function getAppServerInfo() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppInfo
 * @static
 * @return {AppInfo} 
 */
KnuddelsServer.getAppInfo = function getAppInfo() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppAccess
 * @static
 * @return {AppAccess} 
 */
KnuddelsServer.getAppAccess = function getAppAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getWebHookAccess
 * @static
 * @since AppServer 20260213-125115
 * @return {WebHookAccess} 
 */
KnuddelsServer.getWebHookAccess = function getWebHookAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppManagers
 * @static
 * @return {User[]} 
 */
KnuddelsServer.getAppManagers = function getAppManagers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getToplistAccess
 * @static
 * @return {ToplistAccess} 
 */
KnuddelsServer.getToplistAccess = function getToplistAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getAppProfileEntryAccess
 * @static
 * @return {AppProfileEntryAccess} 
 */
KnuddelsServer.getAppProfileEntryAccess = function getAppProfileEntryAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_getPerformanceStats
 * @static
 * @return {JSON} Ein Array von Arrays mit Objekten mit Performance-Daten (siehe Beispiel).
 */
KnuddelsServer.getPerformanceStats = function getPerformanceStats() {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html
 * @class KnuddelShopProduct
 */
function KnuddelShopProduct() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getProductId
 * @return {String} 
 */
KnuddelShopProduct.prototype.getProductId = function getProductId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getOrigKnuddelPayout
 * @return {Number} 
 */
KnuddelShopProduct.prototype.getOrigKnuddelPayout = function getOrigKnuddelPayout() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getOrigPriceCents
 * @return {Number} 
 */
KnuddelShopProduct.prototype.getOrigPriceCents = function getOrigPriceCents() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getNewKnuddelPayout
 * @return {Number|null} 
 */
KnuddelShopProduct.prototype.getNewKnuddelPayout = function getNewKnuddelPayout() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getNewPriceCents
 * @return {Number|null} 
 */
KnuddelShopProduct.prototype.getNewPriceCents = function getNewPriceCents() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getLoyaltyPoints
 * @return {Number} 
 */
KnuddelShopProduct.prototype.getLoyaltyPoints = function getLoyaltyPoints() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getLoyaltyLevelIncrease
 * @return {Number} 
 */
KnuddelShopProduct.prototype.getLoyaltyLevelIncrease = function getLoyaltyLevelIncrease() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelShopProduct.html#method_getHappyHourBonusPercentage
 * @return {Number|null} 
 */
KnuddelShopProduct.prototype.getHappyHourBonusPercentage = function getHappyHourBonusPercentage() {};




/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html
 * @class GlobalAppCategory
 * @since AppServer 20210921-153142
 */
function GlobalAppCategory() {}

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Action
 * Kategorie: Action
 * Spiele, bei denen es vornehmlich um die Reaktion und die Hand-Augen-Koordination des Spielers geht.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Action = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Adventure
 * Kategorie: Abenteuer
 * Spiele, in denen der Spieler die Rolle eines Protagonisten in einer interaktiven Geschichte annimmt.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Adventure = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Puzzle
 * Kategorie: Denkspiel / Puzzle
 * Spiele, die darauf abzielen Intelligenz oder ProblemlÃ¶sungsfÃ¤higkeiten des Spielers zu testen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Puzzle = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Flirt
 * Kategorie: Flirt
 * Apps, die Flirten unterstÃ¼tzen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Flirt = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_BoardGame
 * Kategorie: Gesellschaftsspiel
 * Spiele, die in einer Gruppe mit mehreren gespielt werden, oft mit einem (virtuellen) Spielbrett.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.BoardGame = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_CardGame
 * Kategorie: Kartenspiel
 * Spiele, die mit (virtuellen) Spielkarten gespielt werden.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.CardGame = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Useful
 * Kategorie: NÃ¼tzliches
 * Apps und Tools, die die Nutzung von Knuddels vereinfachen oder verbessern.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Useful = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Quiz
 * Kategorie: Quiz
 * Apps, die das Wissen eines Spielers testen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Quiz = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_RolePlaying
 * Kategorie: Rollenspiel
 * Spiele, bei denen die Spieler die Rolle von realen oder fiktionalen Charakteren in einer interaktiven Welt annehmen kÃ¶nnen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.RolePlaying = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Simulation
 * Kategorie: Simulation
 * Apps, die versuchen AktivitÃ¤ten des echten Lebens nachzustellen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Simulation = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_SocialGambling
 * Kategorie: Social Gambling
 * Spiele, fÃ¼r die Knuddel benÃ¶tigt werden und bei denen rein auf Zufall basiert Knuddel gewonnen werden kÃ¶nnen.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.SocialGambling = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Sport
 * Kategorie: Sport
 * Spiele und Apps zum Thema Sport.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Sport = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppCategory.html#property_Strategy
 * Kategorie: Strategie
 * Spiele, bei denen es vornehmlich um die Planungs- und Entscheidungs-FÃ¤higkeiten der Spieler geht.

* @type {GlobalAppCategory}
*/
GlobalAppCategory.Strategy = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntry.html
 * @class AppProfileEntry
 */
function AppProfileEntry() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntry.html#method_getKey
 * @return {String} 
 */
AppProfileEntry.prototype.getKey = function getKey() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntry.html#method_getDisplayType
 * @return {ToplistDisplayType} 
 */
AppProfileEntry.prototype.getDisplayType = function getDisplayType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppProfileEntry.html#method_getToplist
 * @return {Toplist} 
 */
AppProfileEntry.prototype.getToplist = function getToplist() {};




/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html
 * @class QuestAccess
 */
function QuestAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html#method_solvedQuest
 * @param {String} questKey
 * @return {void} 
 */
QuestAccess.prototype.solvedQuest = function solvedQuest(questKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html#method_getQuests
 * @since AppServer 82290, ChatServer 82290
 * @return {Quest[]} quests
 */
QuestAccess.prototype.getQuests = function getQuests() {};

/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html#method_hasQuest
 * @since AppServer 82290, ChatServer 82290
 * @param {String} questKey
 * @return {Boolean} 
 */
QuestAccess.prototype.hasQuest = function hasQuest(questKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html#method_getQuest
 * @since AppServer 82290, ChatServer 82290
 * @param {String} questKey
 * @return {Quest|null} quest
 */
QuestAccess.prototype.getQuest = function getQuest(questKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/QuestAccess.html#method_getUser
 * @since AppServer 82290, ChatServer 82290
 * @return {User} 
 */
QuestAccess.prototype.getUser = function getUser() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html
 * @class ExternalServerAccess
 */
function ExternalServerAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_getAllAccessibleDomains
 * @return {Domain[]} 
 */
ExternalServerAccess.prototype.getAllAccessibleDomains = function getAllAccessibleDomains() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_canAccessURL
 * @param {String} urlString
 * @return {Boolean} 
 */
ExternalServerAccess.prototype.canAccessURL = function canAccessURL(urlString) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_getURL
 * @param {String} urlString
 * @param {Object} [parameters]
 * @return {void} 
 */
ExternalServerAccess.prototype.getURL = function getURL(urlString, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_postURL
 * @param {String} urlString
 * @param {Object} [parameters]
 * @return {void} 
 */
ExternalServerAccess.prototype.postURL = function postURL(urlString, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_touchURL
 * @param {String} urlString
 * @param {Object} [parameters]
 * @return {void} 
 */
ExternalServerAccess.prototype.touchURL = function touchURL(urlString, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerAccess.html#method_callURL
 * @param {String} urlString
 * @param {Object} [parameters]
 * @return {void} 
 */
ExternalServerAccess.prototype.callURL = function callURL(urlString, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html
 * @class KnuddelTransfer
 */
function KnuddelTransfer() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_getSender
 * @return {User} 
 */
KnuddelTransfer.prototype.getSender = function getSender() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_getReceiver
 * @return {BotUser} 
 */
KnuddelTransfer.prototype.getReceiver = function getReceiver() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_getKnuddelAmount
 * @return {KnuddelAmount} 
 */
KnuddelTransfer.prototype.getKnuddelAmount = function getKnuddelAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_getTransferReason
 * @return {String} 
 */
KnuddelTransfer.prototype.getTransferReason = function getTransferReason() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_reject
 * @param {String} reason
 * @return {void} 
 */
KnuddelTransfer.prototype.reject = function reject(reason) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_accept
 * @return {void} 
 */
KnuddelTransfer.prototype.accept = function accept() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransfer.html#method_isProcessed
 * @return {Boolean} 
 */
KnuddelTransfer.prototype.isProcessed = function isProcessed() {};




/**
 * @see https://developer.knuddels.de/docs/classes/Domain.html
 * @class Domain
 */
function Domain() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Domain.html#method_getDomainName
 * @return {String} 
 */
Domain.prototype.getDomainName = function getDomainName() {};




/**
 * @see https://developer.knuddels.de/docs/classes/UserType.html
 * @class UserType
 */
function UserType() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserType.html#property_AppBot
 * Bot der App.

* @type {UserType}
*/
UserType.AppBot = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserType.html#property_SystemBot
 * Bot des Knuddels-Chatsystems.

* @type {UserType}
*/
UserType.SystemBot = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/UserType.html#property_Human
 * Menschlicher User.

* @type {UserType}
*/
UserType.Human = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html
 * @class UserPersistenceStrings
 */
function UserPersistenceStrings() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_exists
 * @static
 * @since AppServer 88571
 * @param {String} key
 * @param {String} value
 * @param {Boolean} [ignoreCase]
 * @return {Boolean} Information, ob Eintrag existiert.
 */
UserPersistenceStrings.exists = function exists(key, value, ignoreCase) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_deleteAll
 * @static
 * @since AppServer 82478
 * @param {String} key
 * @return {Number} Anzahl der gelÃ¶schten EintrÃ¤ge
 */
UserPersistenceStrings.deleteAll = function deleteAll(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_getAllKeys
 * @static
 * @since AppServer 82483
 * @param {String} [filterKey]
 * @return {String[]} Liste mit allen keys
 */
UserPersistenceStrings.getAllKeys = function getAllKeys(filterKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_each
 * @static
 * @param {String} key
 * @param {Function} callback
 * @param {Object} [parameters]
 * @return {void} 
 */
UserPersistenceStrings.each = function each(key, callback, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_getUserIdsByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceStrings.getUserIdsByKey = function getUserIdsByKey(key, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceStrings.html#method_getNicksByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceStrings.getNicksByKey = function getNicksByKey(key, callback) {};




/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html
 * @class BotUser
 * @extends User
 */
function BotUser() {}
BotUser.prototype = new User;

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_sendPublicMessage
 * @param {String} message
 * @return {void} 
 */
BotUser.prototype.sendPublicMessage = function sendPublicMessage(message) {};

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_sendPublicActionMessage
 * @param {String} actionMessage
 * @return {void} 
 */
BotUser.prototype.sendPublicActionMessage = function sendPublicActionMessage(actionMessage) {};

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_sendPrivateMessage
 * @param {String} message
 * @param {User[]} [users]
 * @return {void} 
 */
BotUser.prototype.sendPrivateMessage = function sendPrivateMessage(message, users) {};

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_sendPostMessage
 * @param {String} topic
 * @param {String} text
 * @param {User} [receivingUser]
 * @return {void} 
 */
BotUser.prototype.sendPostMessage = function sendPostMessage(topic, text, receivingUser) {};

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_transferKnuddel
 * @param {User} receivingUser
 * @param {KnuddelAmount} knuddelAmount
 * @param {Object} [parameters]
 * @return {void} 
 */
BotUser.prototype.transferKnuddel = function transferKnuddel(receivingUser, knuddelAmount, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/BotUser.html#method_destroyKnuddel
 * @since AppServer 20200212-112449
 * @param {KnuddelAmount} knuddelAmount
 * @param {String} reason
 * @param {Object} [parameters]
 * @return {void} 
 */
BotUser.prototype.destroyKnuddel = function destroyKnuddel(knuddelAmount, reason, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html
 * @class ClientType
 */
function ClientType() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_Applet
 * Der User ist mit dem Java Applet im Chat.

* @type {ClientType}
*/
ClientType.Applet = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_Browser
 * Der User ist mit dem Browser im Chat (Mini-Chat, HTML-Chat).

* @type {ClientType}
*/
ClientType.Browser = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_Android
 * Der User ist mit der Android-App im Chat.

* @type {ClientType}
*/
ClientType.Android = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_IOS
 * Der User ist mit der iOS-App im Chat.

* @type {ClientType}
*/
ClientType.IOS = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_Offline
 * Der User ist nicht im Chat.

* @type {ClientType}
*/
ClientType.Offline = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_Web
 * Der User ist im Desktop-Web im Chat (nur K3).

* @type {ClientType}
*/
ClientType.Web = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ClientType.html#property_MobileWeb
 * Der User ist auf einem MobilgerÃ¤t im Web im Chat (nur K3).

* @type {ClientType}
*/
ClientType.MobileWeb = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html
 * @class GenderDetailed
 */
function GenderDetailed() {}

/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#method_toGender
 * @since AppServer 20220811170542
 * @return {Gender} gender
 */
GenderDetailed.prototype.toGender = function toGender() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#property_Male
 * Das Geschlecht ist mÃ¤nnlich.

* @type {GenderDetailed}
*/
GenderDetailed.Male = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#property_Female
 * Das Geschlecht ist weiblich.

* @type {GenderDetailed}
*/
GenderDetailed.Female = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#property_NonBinaryHe
 * Das Geschlecht ist weder mÃ¤nnlich, noch weiblich. Die Person mÃ¶chte aber als Mann angesprochen werden.

* @type {GenderDetailed}
*/
GenderDetailed.NonBinaryHe = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#property_NonBinaryShe
 * Das Geschlecht ist weder mÃ¤nnlich, noch weiblich. Die Person mÃ¶chte aber als Frau angesprochen werden.

* @type {GenderDetailed}
*/
GenderDetailed.NonBinaryShe = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/GenderDetailed.html#property_Unknown
 * Das Geschlecht ist nicht bekannt.

* @type {GenderDetailed}
*/
GenderDetailed.Unknown = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/User.html
 * @class User
 */
function User() {}

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getUserId
 * @return {Number} 
 */
User.prototype.getUserId = function getUserId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getNick
 * @return {String} 
 */
User.prototype.getNick = function getNick() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getAge
 * @return {Number} 
 */
User.prototype.getAge = function getAge() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getGender
 * @return {Gender} 
 */
User.prototype.getGender = function getGender() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getGenderDetailed
 * @since AppServer 20220811170542
 * @return {GenderDetailed} 
 */
User.prototype.getGenderDetailed = function getGenderDetailed() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getRegDate
 * @return {Date} 
 */
User.prototype.getRegDate = function getRegDate() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getUserStatus
 * @return {UserStatus} 
 */
User.prototype.getUserStatus = function getUserStatus() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getUserType
 * @return {UserType} 
 */
User.prototype.getUserType = function getUserType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getClientType
 * @return {ClientType} 
 */
User.prototype.getClientType = function getClientType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isConnectedWithK3Client
 * @return {Boolean} 
 */
User.prototype.isConnectedWithK3Client = function isConnectedWithK3Client() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_canShowAppViewMode
 * @param {AppViewMode} mode
 * @return {Boolean} 
 */
User.prototype.canShowAppViewMode = function canShowAppViewMode(mode) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_canSendAppContent
 * @param {AppContent} appContent
 * @return {Boolean} 
 */
User.prototype.canSendAppContent = function canSendAppContent(appContent) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isInTeam
 * @param {String} teamName
 * @param {String} [subTeamName]
 * @return {Boolean} 
 */
User.prototype.isInTeam = function isInTeam(teamName, subTeamName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getPersistence
 * @return {UserPersistence} 
 */
User.prototype.getPersistence = function getPersistence() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_sendPrivateMessage
 * @param {String} message
 * @return {void} 
 */
User.prototype.sendPrivateMessage = function sendPrivateMessage(message) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_sendPostMessage
 * @param {String} topic
 * @param {String} text
 * @return {void} 
 */
User.prototype.sendPostMessage = function sendPostMessage(topic, text) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isChannelOwner
 * @return {Boolean} 
 */
User.prototype.isChannelOwner = function isChannelOwner() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isLikingChannel
 * @return {Boolean} 
 */
User.prototype.isLikingChannel = function isLikingChannel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isChannelCoreUser
 * @since AppServer 92701, ChatServer 92701
 * @return {Boolean} 
 */
User.prototype.isChannelCoreUser = function isChannelCoreUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isAppManager
 * @return {Boolean} 
 */
User.prototype.isAppManager = function isAppManager() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isMuted
 * @return {Boolean} 
 */
User.prototype.isMuted = function isMuted() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isColorMuted
 * @return {Boolean} 
 */
User.prototype.isColorMuted = function isColorMuted() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isLocked
 * @return {Boolean} 
 */
User.prototype.isLocked = function isLocked() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isChannelModerator
 * @return {Boolean} 
 */
User.prototype.isChannelModerator = function isChannelModerator() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isEventModerator
 * @return {Boolean} 
 */
User.prototype.isEventModerator = function isEventModerator() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isAppDeveloper
 * @return {Boolean} 
 */
User.prototype.isAppDeveloper = function isAppDeveloper() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getProfileLink
 * @param {String} [displayText]
 * @return {String} 
 */
User.prototype.getProfileLink = function getProfileLink(displayText) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isOnlineInChannel
 * @return {Boolean} 
 */
User.prototype.isOnlineInChannel = function isOnlineInChannel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getKnuddelAmount
 * @return {KnuddelAmount} Anzahl der Knuddel
 */
User.prototype.getKnuddelAmount = function getKnuddelAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isOnline
 * @return {Boolean} true, falls der Nutzer online ist.
 */
User.prototype.isOnline = function isOnline() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getReadme
 * @return {String} Readme des Nutzers
 */
User.prototype.getReadme = function getReadme() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getOnlineMinutes
 * @return {Number} 
 */
User.prototype.getOnlineMinutes = function getOnlineMinutes() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getLastOnlineTime
 * @return {Date} Zeitpunkt, zu dem der Nutzer das letzte Mal in einem Channel online war.
 */
User.prototype.getLastOnlineTime = function getLastOnlineTime() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isAway
 * @return {Boolean} 
 */
User.prototype.isAway = function isAway() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_hasProfilePhoto
 * @return {Boolean} 
 */
User.prototype.hasProfilePhoto = function hasProfilePhoto() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_sendAppContent
 * @param {AppContent} appContent
 * @return {AppContentSession} appContentSession, null, falls die interne PrÃ¼fung von canShowAppContent false geliefert hat
 */
User.prototype.sendAppContent = function sendAppContent(appContent) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getAppContentSessions
 * @param {AppViewMode} [appViewMode]
 * @return {AppContentSession[]} die aktiven appContentSessions fÃ¼r den Ã¼bergebenen AppViewMode dieses Users
 */
User.prototype.getAppContentSessions = function getAppContentSessions(appViewMode) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getAppContentSession
 * @param {AppViewMode} appViewMode
 * @return {AppContentSession} appContentSession fÃ¼r Ã¼bergebenen AppViewMode, ansonsten null
 */
User.prototype.getAppContentSession = function getAppContentSession(appViewMode) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_sendEvent
 * @param {String} type
 * @param {Object} data
 * @return {void} 
 */
User.prototype.sendEvent = function sendEvent(type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_equals
 * @param {User} user
 * @return {Boolean} 
 */
User.prototype.equals = function equals(user) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getProfilePhoto
 * @param {Number} width
 * @param {Number} height
 * @return {String} 
 */
User.prototype.getProfilePhoto = function getProfilePhoto(width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getQuestAccess
 * @since AppServer 82290, ChatServer 82290
 * @return {QuestAccess} questAccess
 */
User.prototype.getQuestAccess = function getQuestAccess() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isStreamingVideo
 * @return {Boolean} 
 */
User.prototype.isStreamingVideo = function isStreamingVideo() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getKnuddelAccount
 * @return {KnuddelAccount} 
 */
User.prototype.getKnuddelAccount = function getKnuddelAccount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getChannelTalkPermission
 * @return {ChannelTalkPermission} 
 */
User.prototype.getChannelTalkPermission = function getChannelTalkPermission() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isProfilePhotoVerified
 * @return {Boolean} 
 */
User.prototype.isProfilePhotoVerified = function isProfilePhotoVerified() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_isAgeVerified
 * @return {Boolean} 
 */
User.prototype.isAgeVerified = function isAgeVerified() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_addNicklistIcon
 * @param {String} imagePath
 * @param {Number} imageWidth
 * @return {void} 
 */
User.prototype.addNicklistIcon = function addNicklistIcon(imagePath, imageWidth) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_removeNicklistIcon
 * @param {String} imagePath
 * @return {void} 
 */
User.prototype.removeNicklistIcon = function removeNicklistIcon(imagePath) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_exists
 * @return {void} 
 */
User.prototype.exists = function exists() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_triggerDice
 * @since AppServer 89159, ChatServer 89159
 * @param {DiceConfiguration} diceConfiguration
 * @return {void} 
 */
User.prototype.triggerDice = function triggerDice(diceConfiguration) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getAuthenticityClassification
 * @since AppServer 94663, ChatServer 94663
 * @return {AuthenticityClassification} 
 */
User.prototype.getAuthenticityClassification = function getAuthenticityClassification() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_getMaxKnuddelToApp
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @return {KnuddelAmount} 
 */
User.prototype.getMaxKnuddelToApp = function getMaxKnuddelToApp() {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_canTransferKnuddelToApp
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {KnuddelAmount} knuddelAmount
 * @return {Boolean} 
 */
User.prototype.canTransferKnuddelToApp = function canTransferKnuddelToApp(knuddelAmount) {};

/**
 * @see https://developer.knuddels.de/docs/classes/User.html#method_transferKnuddelToApp
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {KnuddelAmount} knuddelAmount
 * @param {String} displayReasonText
 * @param {Object} [parameters]
 * @return {void} 
 */
User.prototype.transferKnuddelToApp = function transferKnuddelToApp(knuddelAmount, displayReasonText, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/Message.html
 * @class Message
 */
function Message() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Message.html#method_getAuthor
 * @return {User} 
 */
Message.prototype.getAuthor = function getAuthor() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Message.html#method_getText
 * @return {String} 
 */
Message.prototype.getText = function getText() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Message.html#method_getRawText
 * @return {String} 
 */
Message.prototype.getRawText = function getRawText() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Message.html#method_getCreationDate
 * @return {Date} 
 */
Message.prototype.getCreationDate = function getCreationDate() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ServerInfo.html
 * @class ServerInfo
 */
function ServerInfo() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ServerInfo.html#method_getServerId
 * @return {String} 
 */
ServerInfo.prototype.getServerId = function getServerId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ServerInfo.html#method_getRevision
 * @return {Number} 
 */
ServerInfo.prototype.getRevision = function getRevision() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ServerInfo.html#method_getVersion
 * @since AppServer 20191007-160000
 * @return {String} 
 */
ServerInfo.prototype.getVersion = function getVersion() {};




/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html
 * @class DiceConfigurationFactory
 */
function DiceConfigurationFactory() {}

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_addDice
 * @param {Dice} dice
 * @return {void} 
 */
DiceConfigurationFactory.prototype.addDice = function addDice(dice) {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_computeCurrentDiceCount
 * @return {Number} 
 */
DiceConfigurationFactory.prototype.computeCurrentDiceCount = function computeCurrentDiceCount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_setUseOpenThrow
 * @param {Boolean} shouldUseOpenThrow
 * @return {void} 
 */
DiceConfigurationFactory.prototype.setUseOpenThrow = function setUseOpenThrow(shouldUseOpenThrow) {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_setUseOpenThrows
 * @param {Boolean} shouldUseOpenThrow
 * @return {void} 
 */
DiceConfigurationFactory.prototype.setUseOpenThrows = function setUseOpenThrows(shouldUseOpenThrow) {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_setShouldUsePrivateThrow
 * @param {Boolean} shouldUsePrivateThrow
 * @return {void} 
 */
DiceConfigurationFactory.prototype.setShouldUsePrivateThrow = function setShouldUsePrivateThrow(shouldUsePrivateThrow) {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_getDiceConfiguration
 * @return {DiceConfiguration} 
 */
DiceConfigurationFactory.prototype.getDiceConfiguration = function getDiceConfiguration() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfigurationFactory.html#method_fromString
 * @static
 * @param {String} diceConfigurationString
 * @return {DiceConfiguration} 
 */
DiceConfigurationFactory.fromString = function fromString(diceConfigurationString) {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppViewMode.html
 * @class AppViewMode
 */
function AppViewMode() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppViewMode.html#property_Overlay
 * Zum Ã–ffnen eines Overlay durch das HTML User Interface

* @type {AppViewMode}
*/
AppViewMode.Overlay = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AppViewMode.html#property_Popup
 * Zum Ã–ffnen eines Popups durch das HTML User Interface

* @type {AppViewMode}
*/
AppViewMode.Popup = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AppViewMode.html#property_Headerbar
 * Zum Ã–ffnen einer Headerbar durch das HTML User Interface

* @type {AppViewMode}
*/
AppViewMode.Headerbar = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/AppViewMode.html#property_Global
 * Zum Ã¯Â¿Â½ffnen einer globalen App (HTML User Interface). Die App wird je nach Client unterschiedlich angezeigt
 * z.B. am PC als eigenes Fenster (Popup) oder in K3 neben dem oder anstelle des Channel.

* @type {AppViewMode}
*/
AppViewMode.Global = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumberEntry.html
 * @class UserPersistenceNumberEntry
 */
function UserPersistenceNumberEntry() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumberEntry.html#method_getUser
 * @return {User} 
 */
UserPersistenceNumberEntry.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumberEntry.html#method_getValue
 * @return {Number} 
 */
UserPersistenceNumberEntry.prototype.getValue = function getValue() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumberEntry.html#method_getRank
 * @return {Number} 
 */
UserPersistenceNumberEntry.prototype.getRank = function getRank() {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceNumberEntry.html#method_getPosition
 * @return {Number} 
 */
UserPersistenceNumberEntry.prototype.getPosition = function getPosition() {};




/**
 * @see https://developer.knuddels.de/docs/classes/PublicMessage.html
 * @class PublicMessage
 * @extends Message
 */
function PublicMessage() {}
PublicMessage.prototype = new Message;




/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyLevel.html
 * @class LoyaltyLevel
 */
function LoyaltyLevel() {}

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyLevel.html#method_getReward
 * @return {String} 
 */
LoyaltyLevel.prototype.getReward = function getReward() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyLevel.html#method_getRequiredPoints
 * @return {Number} 
 */
LoyaltyLevel.prototype.getRequiredPoints = function getRequiredPoints() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyLevel.html#method_getLevel
 * @return {Number} 
 */
LoyaltyLevel.prototype.getLevel = function getLevel() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyLevel.html#method_getIcon
 * @return {String} 
 */
LoyaltyLevel.prototype.getIcon = function getIcon() {};




/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html
 * @class Logger
 */
function Logger() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html#method_debug
 * @param {...Object} msg
 * @return {void} 
 */
Logger.prototype.debug = function debug(msg) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html#method_info
 * @param {...Object} msg
 * @return {void} 
 */
Logger.prototype.info = function info(msg) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html#method_warn
 * @param {...Object} msg
 * @return {void} 
 */
Logger.prototype.warn = function warn(msg) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html#method_error
 * @param {...Object} msg
 * @return {void} 
 */
Logger.prototype.error = function error(msg) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Logger.html#method_fatal
 * @param {...Object} msg
 * @return {void} 
 */
Logger.prototype.fatal = function fatal(msg) {};




/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html
 * @class DiceConfiguration
 */
function DiceConfiguration() {}

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_isUsingOpenThrow
 * @return {Boolean} 
 */
DiceConfiguration.prototype.isUsingOpenThrow = function isUsingOpenThrow() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_isUsingPrivateThrow
 * @return {Boolean} 
 */
DiceConfiguration.prototype.isUsingPrivateThrow = function isUsingPrivateThrow() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_getDices
 * @return {Dice[]} 
 */
DiceConfiguration.prototype.getDices = function getDices() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_equals
 * @param {DiceConfiguration} diceConfiguration
 * @return {Boolean} 
 */
DiceConfiguration.prototype.equals = function equals(diceConfiguration) {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_getChatCommand
 * @since AppServer 82248
 * @return {String} 
 */
DiceConfiguration.prototype.getChatCommand = function getChatCommand() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceConfiguration.html#method_toString
 * @since AppServer 108781
 * @return {String} z.B. "5W5 + W6"
 */
DiceConfiguration.prototype.toString = function toString() {};




/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html
 * @class GlobalAppInstance
 * @since AppServer 20210803-133329
 */
function GlobalAppInstance() {}

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_setAppConfig
 * @param {GlobalAppConfig} appConfig
 * @return {void} 
 */
GlobalAppInstance.prototype.setAppConfig = function setAppConfig(appConfig) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getAppConfig
 * @return {GlobalAppConfig} Die aktuelle GlobalAppConfig. Ã„nderungen daran werden NICHT automatisch Ã¼bernommen.
							Siehe auch setAppConfig(...).
 */
GlobalAppInstance.prototype.getAppConfig = function getAppConfig() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getOpenSlashCommand
 * @return {String} Der Start-Befehl fÃ¼r diese globale App.
 */
GlobalAppInstance.prototype.getOpenSlashCommand = function getOpenSlashCommand() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getOpenAppChatCommand
 * @since AppServer 20220502-125000
 * @return {String} Der Start-Befehl fÃ¼r diese globale App.
 */
GlobalAppInstance.prototype.getOpenAppChatCommand = function getOpenAppChatCommand() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getAddAsFavoriteChatCommand
 * @since AppServer 20220502-125000
 * @return {String} Der Befehl fÃ¼r diese globale App.
 */
GlobalAppInstance.prototype.getAddAsFavoriteChatCommand = function getAddAsFavoriteChatCommand() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getRemoveAsFavoriteChatCommand
 * @since AppServer 20220502-125000
 * @return {String} Der Befehl fÃ¼r diese globale App.
 */
GlobalAppInstance.prototype.getRemoveAsFavoriteChatCommand = function getRemoveAsFavoriteChatCommand() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_hasAsFavorite
 * @since AppServer 20220502-152500
 * @param {User} user
 * @return {Boolean} true, wenn der User diese globale App als Favorit gesetzt hat, sonst false.
 */
GlobalAppInstance.prototype.hasAsFavorite = function hasAsFavorite(user) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_openGlobalApp
 * @param {User} user
 * @param {Boolean} [forceReplace]
 * @return {AppContentSession} Die AppContentSession des User fÃ¼r diese Globale App oder undefined, falls die App nicht geÃ¶ffnet werden konnte.
 */
GlobalAppInstance.prototype.openGlobalApp = function openGlobalApp(user, forceReplace) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getActiveSessions
 * @return {AppContentSession[]} Array mit den AppContentSessions.
 */
GlobalAppInstance.prototype.getActiveSessions = function getActiveSessions() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_getActiveSession
 * @param {Number} userId
 * @return {AppContentSession|null} Die AppContentSession des Ã¼bergebenen Users oder null.
 */
GlobalAppInstance.prototype.getActiveSession = function getActiveSession(userId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppInstance.html#method_closeActiveSessions
 * @return {void} 
 */
GlobalAppInstance.prototype.closeActiveSessions = function closeActiveSessions() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html
 * @class ChannelTalkPermission
 */
function ChannelTalkPermission() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_NotInChannel
 * Der User ist gerade nicht im Channel,
 * daher ist die ChannelTalkPermission nicht bekannnt.

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.NotInChannel = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_Default
 * Der User hat keine speziellen Rederechte.
 * Beim ChannelTalkMode Default kÃ¶nnen diese User
 * Nachrichten verfassen:

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.Default = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_TalkOnce
 * Der User kann eine Ã¶ffentliche Nachricht verfassen. Danach wechselt die
 * ChannelTalkPermission automatisch auf Default.

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.TalkOnce = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_TalkPermanent
 * Der User kann permanent Ã¶ffentliche Nachrichten verfassen.

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.TalkPermanent = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_VIP
 * Der User ist VIP und kann Ã¶ffentliche Nachrichten verfassen,
 * die farbig und groÃŸ dargestellt werden.

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.VIP = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkPermission.html#property_Moderator
 * Der User ist VIP und kann Ã¶ffentliche Nachrichten verfassen,
 * die farbig und groÃŸ dargestellt werden. Moderatoren haben zudem weitere MÃ¶glichkeiten, die in der
 * Anleitung zum Moderationssystem
 * nachgelesen werden kÃ¶nnen.

* @type {ChannelTalkPermission}
*/
ChannelTalkPermission.Moderator = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/OwnAppInstance.html
 * @class OwnAppInstance
 */
function OwnAppInstance() {}

/**
 * @see https://developer.knuddels.de/docs/classes/OwnAppInstance.html#method_getOnlineUsers
 * @since AppServer 82560
 * @param {AppInstance} otherAppInstance
 * @param {...UserType} [userType]
 * @return {User[]} 
 */
OwnAppInstance.prototype.getOnlineUsers = function getOnlineUsers(otherAppInstance, userType) {};




/**
 * @see https://developer.knuddels.de/docs/classes/HTMLFile.html
 * @class HTMLFile
 */
function HTMLFile() {}

/**
 * @see https://developer.knuddels.de/docs/classes/HTMLFile.html#method_HTMLFile
 * @param {String} assetPath
 * @param {Json} [pageData]
 * @return {HTMLFile} 
 */
HTMLFile.prototype.HTMLFile = function HTMLFile(assetPath, pageData) {};

/**
 * @see https://developer.knuddels.de/docs/classes/HTMLFile.html#method_getAssetPath
 * @return {String} assetPath
 */
HTMLFile.prototype.getAssetPath = function getAssetPath() {};

/**
 * @see https://developer.knuddels.de/docs/classes/HTMLFile.html#method_getPageData
 * @return {Json} pageData
 */
HTMLFile.prototype.getPageData = function getPageData() {};




/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html
 * @class PaymentAccess
 * @since AppServer 108571, ChatServer 108571
 */
function PaymentAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_startKnuddelPurchase
 * @since AppServer 108571, ChatServer 108571
 * @param {User} user
 * @param {KnuddelAmount} amount
 * @param {Object} [parameters]
 * @return {void} 
 */
PaymentAccess.prototype.startKnuddelPurchase = function startKnuddelPurchase(user, amount, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_startKnuddelPurchase
 * @since AppServer 20210315-162600, ChatServer 20210315-162600
 * @param {User} user
 * @param {String} productId
 * @param {Object} [parameters]
 * @return {void} 
 */
PaymentAccess.prototype.startKnuddelPurchase = function startKnuddelPurchase(user, productId, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_requestKnuddelBuyBonusInfos
 * @since AppServer 20200403-191108, ChatServer 20200403-191108
 * @param {User} user
 * @param {Function} callback
 * @return {void} 
 */
PaymentAccess.prototype.requestKnuddelBuyBonusInfos = function requestKnuddelBuyBonusInfos(user, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_requestKnuddelBuyProducts
 * @since AppServer 20210204-140000, ChatServer 20210204-140000
 * @param {User} user
 * @param {Function} callback
 * @return {void} 
 */
PaymentAccess.prototype.requestKnuddelBuyProducts = function requestKnuddelBuyProducts(user, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_requestKnuddelShops
 * @since AppServer 20210215-140000, ChatServer 20210215-140000
 * @param {User} user
 * @param {Function} callback
 * @return {void} 
 */
PaymentAccess.prototype.requestKnuddelShops = function requestKnuddelShops(user, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_requestLoyaltyDetails
 * @since AppServer 20240408-213104, ChatServer 20240408-213104
 * @param {User} user
 * @param {Function} callback
 * @return {void} 
 */
PaymentAccess.prototype.requestLoyaltyDetails = function requestLoyaltyDetails(user, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/PaymentAccess.html#method_openKnuddelShop
 * @since AppServer 20210713-180000, ChatServer 20210713-180000
 * @param {User} user
 * @param {String} [transferReason]
 * @return {void} 
 */
PaymentAccess.prototype.openKnuddelShop = function openKnuddelShop(user, transferReason) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html
 * @class ExternalServerResponse
 */
function ExternalServerResponse() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getURLString
 * @return {String} 
 */
ExternalServerResponse.prototype.getURLString = function getURLString() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getResponseCode
 * @return {Number} var responseCode = externalServerResponse.getResponseCode(); // z.B. 200
 */
ExternalServerResponse.prototype.getResponseCode = function getResponseCode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getHeaders
 * @since AppServer 20260213-125115
 * @return {HttpHeaders} 
 */
ExternalServerResponse.prototype.getHeaders = function getHeaders() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getHeaderFields
 * @return {HttpHeaders} 
 */
ExternalServerResponse.prototype.getHeaderFields = function getHeaderFields() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getHeaderFieldNames
 * @since AppServer 108668
 * @return {String[]} 
 */
ExternalServerResponse.prototype.getHeaderFieldNames = function getHeaderFieldNames() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ExternalServerResponse.html#method_getHeaderFieldValues
 * @since AppServer 108668
 * @param {String} headerFieldName
 * @return {String[]} 
 */
ExternalServerResponse.prototype.getHeaderFieldValues = function getHeaderFieldValues(headerFieldName) {};




/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html
 * @class LoadConfiguration
 */
function LoadConfiguration() {}

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setBackgroundColor
 * @param {Color} color
 * @return {void} 
 */
LoadConfiguration.prototype.setBackgroundColor = function setBackgroundColor(color) {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setBackgroundImage
 * @param {String} imageUrl
 * @return {void} 
 */
LoadConfiguration.prototype.setBackgroundImage = function setBackgroundImage(imageUrl) {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setText
 * @param {String} text
 * @return {void} 
 */
LoadConfiguration.prototype.setText = function setText(text) {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setLoadingIndicatorImage
 * @param {String} imageUrl
 * @return {void} 
 */
LoadConfiguration.prototype.setLoadingIndicatorImage = function setLoadingIndicatorImage(imageUrl) {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setForegroundColor
 * @param {Color} color
 * @return {void} 
 */
LoadConfiguration.prototype.setForegroundColor = function setForegroundColor(color) {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoadConfiguration.html#method_setEnabled
 * @param {Boolean} enabled
 * @return {void} 
 */
LoadConfiguration.prototype.setEnabled = function setEnabled(enabled) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelDesign.html
 * @class ChannelDesign
 * @since AppServer 87470, ChatServer 87470
 */
function ChannelDesign() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelDesign.html#method_getDefaultFontSize
 * @since AppServer 87470, ChatServer 87470
 * @return {Number} default font size
 */
ChannelDesign.prototype.getDefaultFontSize = function getDefaultFontSize() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelDesign.html#method_getDefaultFontColor
 * @since AppServer 87470, ChatServer 87470
 * @return {Color} default font color
 */
ChannelDesign.prototype.getDefaultFontColor = function getDefaultFontColor() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelDesign.html#method_getBackgroundColor
 * @since AppServer 87470, ChatServer 87470
 * @return {Color} background color
 */
ChannelDesign.prototype.getBackgroundColor = function getBackgroundColor() {};




/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html
 * @class WebHookAccess
 * @since AppServer 20260213-125115
 */
function WebHookAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html#method_registerWebHook
 * @param {String} key
 * @param {Function} observer
 * @return {String} Die vollstÃ¤ndige WebHook-URL, unter der der WebHook erreichbar ist.
 */
WebHookAccess.prototype.registerWebHook = function registerWebHook(key, observer) {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html#method_unregisterWebHook
 * @param {String} key
 * @return {void} 
 */
WebHookAccess.prototype.unregisterWebHook = function unregisterWebHook(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html#method_unregisterAllWebHooks
 * @return {void} 
 */
WebHookAccess.prototype.unregisterAllWebHooks = function unregisterAllWebHooks() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html#method_getRegisteredWebhooks
 * @return {String[]} Die Keys der registrierten WebHooks.
 */
WebHookAccess.prototype.getRegisteredWebhooks = function getRegisteredWebhooks() {};

/**
 * @see https://developer.knuddels.de/docs/classes/WebHookAccess.html#method_getWebHookUrl
 * @param {String} key
 * @return {String|null} Die WebHook-URL oder null.
 */
WebHookAccess.prototype.getWebHookUrl = function getWebHookUrl(key) {};




/**
 * @see https://developer.knuddels.de/docs/classes/PublicActionMessage.html
 * @class PublicActionMessage
 * @extends Message
 */
function PublicActionMessage() {}
PublicActionMessage.prototype = new Message;

/**
 * @see https://developer.knuddels.de/docs/classes/PublicActionMessage.html#method_getFunctionName
 * @return {String} 
 */
PublicActionMessage.prototype.getFunctionName = function getFunctionName() {};




/**
 * @see https://developer.knuddels.de/docs/classes/VideoChannelData.html
 * @class VideoChannelData
 */
function VideoChannelData() {}

/**
 * @see https://developer.knuddels.de/docs/classes/VideoChannelData.html#method_getStreamingVideoUsers
 * @return {User[]} 
 */
VideoChannelData.prototype.getStreamingVideoUsers = function getStreamingVideoUsers() {};




/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html
 * @class GlobalAppConfig
 * @since AppServer 20210803-133329
 */
function GlobalAppConfig() {}

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_GlobalAppConfig
 * @param {String} globalAppId
 * @param {String} displayName
 * @param {Function} openRequestHandler
 * @return {void} 
 */
GlobalAppConfig.prototype.GlobalAppConfig = function GlobalAppConfig(globalAppId, displayName, openRequestHandler) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getId
 * @return {String} globalAppId
 */
GlobalAppConfig.prototype.getId = function getId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getDisplayName
 * @return {String} displayName
 */
GlobalAppConfig.prototype.getDisplayName = function getDisplayName() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setDisplayName
 * @param {String} displayName
 * @return {void} 
 */
GlobalAppConfig.prototype.setDisplayName = function setDisplayName(displayName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getImagePath
 * @return {String} imagePath
 */
GlobalAppConfig.prototype.getImagePath = function getImagePath() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setImagePath
 * @param {String} [imagePath]
 * @return {void} 
 */
GlobalAppConfig.prototype.setImagePath = function setImagePath(imagePath) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getFeaturedImagePath
 * @return {String} featuredImagePath
 */
GlobalAppConfig.prototype.getFeaturedImagePath = function getFeaturedImagePath() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setFeaturedImagePath
 * @param {String} [featuredImagePath]
 * @return {void} 
 */
GlobalAppConfig.prototype.setFeaturedImagePath = function setFeaturedImagePath(featuredImagePath) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getFeaturedCardColor
 * @return {Color} featuredCardColor
 */
GlobalAppConfig.prototype.getFeaturedCardColor = function getFeaturedCardColor() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setFeaturedCardColor
 * @param {Color} featuredCardColor
 * @return {void} 
 */
GlobalAppConfig.prototype.setFeaturedCardColor = function setFeaturedCardColor(featuredCardColor) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getMinStatus
 * @return {UserStatus} minStatus
 */
GlobalAppConfig.prototype.getMinStatus = function getMinStatus() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setMinStatus
 * @param {UserStatus} minStatus
 * @return {void} 
 */
GlobalAppConfig.prototype.setMinStatus = function setMinStatus(minStatus) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getMinRegDays
 * @return {Boolean} minRegDays
 */
GlobalAppConfig.prototype.getMinRegDays = function getMinRegDays() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setMinRegDays
 * @param {Number} minRegDays
 * @return {void} 
 */
GlobalAppConfig.prototype.setMinRegDays = function setMinRegDays(minRegDays) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getMinAge
 * @return {Boolean} minAge
 */
GlobalAppConfig.prototype.getMinAge = function getMinAge() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setMinAge
 * @param {Number} minAge
 * @return {void} 
 */
GlobalAppConfig.prototype.setMinAge = function setMinAge(minAge) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getMaxAge
 * @return {Boolean} maxAge
 */
GlobalAppConfig.prototype.getMaxAge = function getMaxAge() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setMaxAge
 * @param {Number} maxAge
 * @return {void} 
 */
GlobalAppConfig.prototype.setMaxAge = function setMaxAge(maxAge) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getAllowedGenders
 * @return {Gender[]} allowedGenders
 */
GlobalAppConfig.prototype.getAllowedGenders = function getAllowedGenders() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setAllowedGenders
 * @param {...Gender[]} [allowedGenders]
 * @return {void} 
 */
GlobalAppConfig.prototype.setAllowedGenders = function setAllowedGenders(allowedGenders) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_isRestrictToOneIp
 * @return {Boolean} restrictToOneIp
 */
GlobalAppConfig.prototype.isRestrictToOneIp = function isRestrictToOneIp() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setRestrictToOneIp
 * @param {Boolean} restrictToOneIp
 * @return {void} 
 */
GlobalAppConfig.prototype.setRestrictToOneIp = function setRestrictToOneIp(restrictToOneIp) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getAllowedUserIds
 * @return {Number[]} allowedUserIds Array mit den Ids von Usern, welche diese App Ã¶ffnen dÃ¼rfen.
 */
GlobalAppConfig.prototype.getAllowedUserIds = function getAllowedUserIds() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setAllowedUserIds
 * @param {Number[]} allowedUserIds
 * @return {void} 
 */
GlobalAppConfig.prototype.setAllowedUserIds = function setAllowedUserIds(allowedUserIds) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getBlockedUserIds
 * @return {Number[]} blockedUserIds Array mit den Ids von Usern, welche diese App NICHT Ã¶ffnen dÃ¼rfen.
 */
GlobalAppConfig.prototype.getBlockedUserIds = function getBlockedUserIds() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setBlockedUserIds
 * @param {Number[]} blockedUserIds
 * @return {void} 
 */
GlobalAppConfig.prototype.setBlockedUserIds = function setBlockedUserIds(blockedUserIds) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getOpenRequestHandler
 * @return {Function} Der OpenRequestHandler
 */
GlobalAppConfig.prototype.getOpenRequestHandler = function getOpenRequestHandler() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setOpenRequestHandler
 * @param {Function} openRequestHandler
 * @return {void} 
 */
GlobalAppConfig.prototype.setOpenRequestHandler = function setOpenRequestHandler(openRequestHandler) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getSessionOpenedCallback
 * @return {Function} Der SessionOpenedCallback
 */
GlobalAppConfig.prototype.getSessionOpenedCallback = function getSessionOpenedCallback() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setSessionOpenedCallback
 * @param {Function} [sessionOpenedCallback]
 * @return {void} 
 */
GlobalAppConfig.prototype.setSessionOpenedCallback = function setSessionOpenedCallback(sessionOpenedCallback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getCategories
 * @return {GlobalAppCategory[]} categories Array mit den Kategorien dieser App. Standard: []
 */
GlobalAppConfig.prototype.getCategories = function getCategories() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setCategories
 * @param {...GlobalAppCategory} [categories]
 * @return {void} 
 */
GlobalAppConfig.prototype.setCategories = function setCategories(categories) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_getShowDeveloper
 * @return {Boolean} Standard: false
 */
GlobalAppConfig.prototype.getShowDeveloper = function getShowDeveloper() {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_setShowDeveloper
 * @param {Boolean} [showDeveloper]
 * @return {void} 
 */
GlobalAppConfig.prototype.setShowDeveloper = function setShowDeveloper(showDeveloper) {};

/**
 * @see https://developer.knuddels.de/docs/classes/GlobalAppConfig.html#method_toString
 * @return {String} Liefert die GlobalAppConfig als JSON-String.
 */
GlobalAppConfig.prototype.toString = function toString() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkMode.html
 * @class ChannelTalkMode
 */
function ChannelTalkMode() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkMode.html#property_Everyone
 * Jeder darf gerade im Channel schreiben.

* @type {ChannelTalkMode}
*/
ChannelTalkMode.Everyone = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkMode.html#property_OnlyWithTalkPermission
 * Nur Personen, die besondere Rederechte haben dÃ¼rfen gerade im Channel schreiben.

* @type {ChannelTalkMode}
*/
ChannelTalkMode.OnlyWithTalkPermission = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/ChannelTalkMode.html#property_FilteredByModerators
 * Nur Personen, die besondere Rederechte haben dÃ¼rfen gerade im Channel schreiben.
 * Die Nachrichten aller anderen Nutzer werden gefiltert und ggf. von den Moderatoren zugelassen.

* @type {ChannelTalkMode}
*/
ChannelTalkMode.FilteredByModerators = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRestrictions.html
 * @class ChannelRestrictions
 */
function ChannelRestrictions() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRestrictions.html#method_getMutedUsers
 * @return {User[]} 
 */
ChannelRestrictions.prototype.getMutedUsers = function getMutedUsers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRestrictions.html#method_getColorMutedUsers
 * @return {User[]} 
 */
ChannelRestrictions.prototype.getColorMutedUsers = function getColorMutedUsers() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRestrictions.html#method_getLockedUsers
 * @return {User[]} 
 */
ChannelRestrictions.prototype.getLockedUsers = function getLockedUsers() {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransferDisplayType.html
 * @class KnuddelTransferDisplayType
 */
function KnuddelTransferDisplayType() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransferDisplayType.html#property_Public
 * Nachricht wird Ã¶ffentlich angezeigt.

* @type {KnuddelTransferDisplayType}
*/
KnuddelTransferDisplayType.Public = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransferDisplayType.html#property_Private
 * Nachricht wird privat angezeigt.

* @type {KnuddelTransferDisplayType}
*/
KnuddelTransferDisplayType.Private = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransferDisplayType.html#property_Post
 * Nachricht wird als /m zugestellt.

* @type {KnuddelTransferDisplayType}
*/
KnuddelTransferDisplayType.Post = undefined;
/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelTransferDisplayType.html#property_Silent
 * Der Nutzer erhÃ¤lt keine Nachricht, wird jedoch (wie sonst auch) am Ende des Tages
 * per /m Ã¼ber AktivitÃ¤ten in seinem KnuddelAccount informiert.

* @type {KnuddelTransferDisplayType}
*/
KnuddelTransferDisplayType.Silent = undefined;



/**
 * @see https://developer.knuddels.de/docs/classes/Dice.html
 * @class Dice
 */
function Dice() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Dice.html#method_Dice
 * @param {Number} [count]
 * @param {Number} value
 * @return {Dice} 
 */
Dice.prototype.Dice = function Dice(count, value) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Dice.html#method_getAmount
 * @return {Number} 
 */
Dice.prototype.getAmount = function getAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Dice.html#method_getNumberOfSides
 * @return {Number} 
 */
Dice.prototype.getNumberOfSides = function getNumberOfSides() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRights.html
 * @class ChannelRights
 */
function ChannelRights() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRights.html#method_getChannelOwners
 * @return {User[]} 
 */
ChannelRights.prototype.getChannelOwners = function getChannelOwners() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRights.html#method_getChannelModerators
 * @return {User[]} 
 */
ChannelRights.prototype.getChannelModerators = function getChannelModerators() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelRights.html#method_getEventModerators
 * @return {User[]} 
 */
ChannelRights.prototype.getEventModerators = function getEventModerators() {};




/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html
 * @class UserPersistenceObjects
 */
function UserPersistenceObjects() {}

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html#method_deleteAll
 * @static
 * @since AppServer 82478
 * @param {String} key
 * @return {Number} Anzahl der gelÃ¶schten EintrÃ¤ge
 */
UserPersistenceObjects.deleteAll = function deleteAll(key) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html#method_getAllKeys
 * @static
 * @since AppServer 82483
 * @param {String} [filterKey]
 * @return {String[]} Liste mit allen keys
 */
UserPersistenceObjects.getAllKeys = function getAllKeys(filterKey) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html#method_each
 * @static
 * @param {String} key
 * @param {Function} callback
 * @param {Object} [parameters]
 * @return {void} 
 */
UserPersistenceObjects.each = function each(key, callback, parameters) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html#method_getUserIdsByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceObjects.getUserIdsByKey = function getUserIdsByKey(key, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/UserPersistenceObjects.html#method_getNicksByKey
 * @static
 * @since AppServer 20201113-145716, ChatServer 20201113-145716
 * @param {String} key
 * @param {Function} callback
 * @return {void} 
 */
UserPersistenceObjects.getNicksByKey = function getNicksByKey(key, callback) {};




/**
 * @see https://developer.knuddels.de/docs/classes/Quest.html
 * @class Quest
 */
function Quest() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Quest.html#method_setSolved
 * @since AppServer 82290, ChatServer 82290
 * @return {void} 
 */
Quest.prototype.setSolved = function setSolved() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Quest.html#method_getQuestKey
 * @since AppServer 82290, ChatServer 82290
 * @return {String} questKey
 */
Quest.prototype.getQuestKey = function getQuestKey() {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html
 * @class AppAccess
 */
function AppAccess() {}

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_getOwnInstance
 * @return {AppInstance} Instanz der eigenen App
 */
AppAccess.prototype.getOwnInstance = function getOwnInstance() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_getAllRunningAppsInChannel
 * @since AppServer 82904
 * @param {Boolean} [includeSelf]
 * @return {AppInstance[]} Instanzen der anderen laufenden Apps
 */
AppAccess.prototype.getAllRunningAppsInChannel = function getAllRunningAppsInChannel(includeSelf) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_getRunningAppInChannel
 * @since AppServer 82904
 * @param {String} appId
 * @return {AppInstance|null} Instanz der anderen laufenden App oder null
 */
AppAccess.prototype.getRunningAppInChannel = function getRunningAppInChannel(appId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_registerGlobalApp
 * @since AppServer 20210803-133329
 * @param {GlobalAppConfig} globalAppConfig
 * @return {GlobalAppInstance} Instanz-Objekt der globalen App.
 */
AppAccess.prototype.registerGlobalApp = function registerGlobalApp(globalAppConfig) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_unregisterGlobalApp
 * @since AppServer 20210803-133329
 * @param {String} globalAppId
 * @return {GlobalAppInstance|null} Instanz-Objekt der globalen App oder null.
 */
AppAccess.prototype.unregisterGlobalApp = function unregisterGlobalApp(globalAppId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_getGlobalAppInstance
 * @since AppServer 20210803-133329
 * @param {String} globalAppId
 * @return {GlobalAppInstance|null} Instanz-Objekt der globalen App oder null.
 */
AppAccess.prototype.getGlobalAppInstance = function getGlobalAppInstance(globalAppId) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppAccess.html#method_getAllGlobalAppInstances
 * @since AppServer 20210803-133329
 * @return {GlobalAppInstance[]} Instanz-Objekte der globalen Apps.
 */
AppAccess.prototype.getAllGlobalAppInstances = function getAllGlobalAppInstances() {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppServerInfo.html
 * @class AppServerInfo
 * @extends ServerInfo
 */
function AppServerInfo() {}
AppServerInfo.prototype = new ServerInfo;




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html
 * @class KnuddelAmount
 */
function KnuddelAmount() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_KnuddelAmount
 * @param {Number} knuddel
 * @return {KnuddelAmount} 
 */
KnuddelAmount.prototype.KnuddelAmount = function KnuddelAmount(knuddel) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_fromCents
 * @static
 * @param {Number} knuddel
 * @return {KnuddelAmount} 
 */
KnuddelAmount.fromCents = function fromCents(knuddel) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_fromKnuddel
 * @static
 * @param {Number} knuddel
 * @return {KnuddelAmount} 
 */
KnuddelAmount.fromKnuddel = function fromKnuddel(knuddel) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_getKnuddelCents
 * @return {Number} 
 */
KnuddelAmount.prototype.getKnuddelCents = function getKnuddelCents() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_asNumber
 * @return {Number} 
 */
KnuddelAmount.prototype.asNumber = function asNumber() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_negate
 * @return {KnuddelAmount} 
 */
KnuddelAmount.prototype.negate = function negate() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAmount.html#method_isNegative
 * @return {Boolean} 
 */
KnuddelAmount.prototype.isNegative = function isNegative() {};




/**
 * @see https://developer.knuddels.de/docs/classes/DiceResult.html
 * @class DiceResult
 */
function DiceResult() {}

/**
 * @see https://developer.knuddels.de/docs/classes/DiceResult.html#method_getDiceConfiguration
 * @return {DiceConfiguration} 
 */
DiceResult.prototype.getDiceConfiguration = function getDiceConfiguration() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceResult.html#method_getSingleDiceResults
 * @return {SingleDiceResult[]} 
 */
DiceResult.prototype.getSingleDiceResults = function getSingleDiceResults() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceResult.html#method_totalSum
 * @return {Number} 
 */
DiceResult.prototype.totalSum = function totalSum() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceResult.html#method_toString
 * @since AppServer 108781
 * @return {String} z.B. "5W5 + W6: 5> 4, 4, 3, 4, 5> 3, 1 = 29"
 */
DiceResult.prototype.toString = function toString() {};




/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html
 * @class AppPersistence
 * @extends Persistence
 */
function AppPersistence() {}
AppPersistence.prototype = new Persistence;

/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html#method_getDatabaseFileSize
 * @return {Number} 
 */
AppPersistence.prototype.getDatabaseFileSize = function getDatabaseFileSize() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html#method_getDatabaseFileSizeLimit
 * @return {Number} 
 */
AppPersistence.prototype.getDatabaseFileSizeLimit = function getDatabaseFileSizeLimit() {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html#method_getStringKeys
 * @since AppServer 20191007-160000
 * @param {String} [keyPattern]
 * @return {String[]} 
 */
AppPersistence.prototype.getStringKeys = function getStringKeys(keyPattern) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html#method_getNumberKeys
 * @since AppServer 20191007-160000
 * @param {String} [keyPattern]
 * @return {String[]} 
 */
AppPersistence.prototype.getNumberKeys = function getNumberKeys(keyPattern) {};

/**
 * @see https://developer.knuddels.de/docs/classes/AppPersistence.html#method_getObjectKeys
 * @since AppServer 20191007-160000
 * @param {String} [keyPattern]
 * @return {String[]} 
 */
AppPersistence.prototype.getObjectKeys = function getObjectKeys(keyPattern) {};




/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html
 * @class ToplistRankChangeEvent
 */
function ToplistRankChangeEvent() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getToplist
 * @return {Toplist} 
 */
ToplistRankChangeEvent.prototype.getToplist = function getToplist() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getOldRank
 * @return {Number} -1, falls der Nutzer vorher keinen Rang hatte.
 */
ToplistRankChangeEvent.prototype.getOldRank = function getOldRank() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getNewRank
 * @return {Number} 
 */
ToplistRankChangeEvent.prototype.getNewRank = function getNewRank() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getUser
 * @return {User} 
 */
ToplistRankChangeEvent.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getUsersOvertook
 * @return {User[]} 
 */
ToplistRankChangeEvent.prototype.getUsersOvertook = function getUsersOvertook() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getOldValue
 * @return {Number} 
 */
ToplistRankChangeEvent.prototype.getOldValue = function getOldValue() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ToplistRankChangeEvent.html#method_getNewValue
 * @return {Number} 
 */
ToplistRankChangeEvent.prototype.getNewValue = function getNewValue() {};




/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyDetails.html
 * @class LoyaltyDetails
 */
function LoyaltyDetails() {}

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyDetails.html#method_getPoints
 * @return {Number} 
 */
LoyaltyDetails.prototype.getPoints = function getPoints() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyDetails.html#method_getLevels
 * @return {LoyaltyLevel[]} 
 */
LoyaltyDetails.prototype.getLevels = function getLevels() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyDetails.html#method_getEndangeredPoints
 * @return {Number} 
 */
LoyaltyDetails.prototype.getEndangeredPoints = function getEndangeredPoints() {};

/**
 * @see https://developer.knuddels.de/docs/classes/LoyaltyDetails.html#method_getNextDeductionTimestamp
 * @return {Number} 
 */
LoyaltyDetails.prototype.getNextDeductionTimestamp = function getNextDeductionTimestamp() {};




/**
 * @see https://developer.knuddels.de/docs/classes/ChannelJoinPermission.html
 * @class ChannelJoinPermission
 */
function ChannelJoinPermission() {}

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelJoinPermission.html#method_accepted
 * @static
 * @return {ChannelJoinPermission} 
 */
ChannelJoinPermission.accepted = function accepted() {};

/**
 * @see https://developer.knuddels.de/docs/classes/ChannelJoinPermission.html#method_denied
 * @static
 * @param {String} denyReason
 * @return {ChannelJoinPermission} 
 */
ChannelJoinPermission.denied = function denied(denyReason) {};




/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html
 * @class KnuddelAccount
 */
function KnuddelAccount() {}

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getKnuddelAmount
 * @return {KnuddelAmount} 
 */
KnuddelAccount.prototype.getKnuddelAmount = function getKnuddelAmount() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getKnuddelAmountUsed
 * @return {KnuddelAmount} 
 */
KnuddelAccount.prototype.getKnuddelAmountUsed = function getKnuddelAmountUsed() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getKnuddelAmountUnused
 * @return {KnuddelAmount} 
 */
KnuddelAccount.prototype.getKnuddelAmountUnused = function getKnuddelAmountUnused() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getTotalKnuddelAmountAppToUser
 * @return {KnuddelAmount} 
 */
KnuddelAccount.prototype.getTotalKnuddelAmountAppToUser = function getTotalKnuddelAmountAppToUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getTotalKnuddelAmountUserToApp
 * @return {KnuddelAmount} 
 */
KnuddelAccount.prototype.getTotalKnuddelAmountUserToApp = function getTotalKnuddelAmountUserToApp() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_hasEnough
 * @param {KnuddelAmount} knuddelAmount
 * @return {Boolean} 
 */
KnuddelAccount.prototype.hasEnough = function hasEnough(knuddelAmount) {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_getUser
 * @return {User} 
 */
KnuddelAccount.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/KnuddelAccount.html#method_use
 * @param {KnuddelAmount} knuddelAmount
 * @param {String} displayReasonText
 * @param {Object} [parameters]
 * @return {void} 
 */
KnuddelAccount.prototype.use = function use(knuddelAmount, displayReasonText, parameters) {};




/**
 * @see https://developer.knuddels.de/docs/classes/DiceEvent.html
 * @class DiceEvent
 */
function DiceEvent() {}

/**
 * @see https://developer.knuddels.de/docs/classes/DiceEvent.html#method_getUser
 * @return {User} 
 */
DiceEvent.prototype.getUser = function getUser() {};

/**
 * @see https://developer.knuddels.de/docs/classes/DiceEvent.html#method_getDiceResult
 * @return {DiceResult} 
 */
DiceEvent.prototype.getDiceResult = function getDiceResult() {};




/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html
 * @class RandomOperations
 */
function RandomOperations() {}

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_nextInt
 * @static
 * @param {Number} [minValue]
 * @param {Number} maxValue
 * @return {Number} 
 */
RandomOperations.nextInt = function nextInt(minValue, maxValue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_nextInts
 * @static
 * @param {Number} [minValue]
 * @param {Number} maxValue
 * @param {Number} count
 * @param {Boolean} onlyDifferentNumbers
 * @return {Number[]} 
 */
RandomOperations.nextInts = function nextInts(minValue, maxValue, count, onlyDifferentNumbers) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_flipTrue
 * @static
 * @param {Number} truePropability
 * @return {Boolean} 
 */
RandomOperations.flipTrue = function flipTrue(truePropability) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_getRandomObject
 * @static
 * @param {Object[]} objects
 * @return {Object} 
 */
RandomOperations.getRandomObject = function getRandomObject(objects) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_shuffleObjects
 * @static
 * @param {Object[]} objects
 * @return {Object[]} 
 */
RandomOperations.shuffleObjects = function shuffleObjects(objects) {};

/**
 * @see https://developer.knuddels.de/docs/classes/RandomOperations.html#method_getRandomString
 * @static
 * @since AppServer 92699
 * @param {Number} length
 * @param {String} [allowedCharacters]
 * @return {String} Zeichenkette mit gewÃ¼nschter LÃ¤nge
 */
RandomOperations.getRandomString = function getRandomString(length, allowedCharacters) {};




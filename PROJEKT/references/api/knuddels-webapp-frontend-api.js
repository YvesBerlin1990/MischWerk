/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html
 * @class Client.Color
 */
Client.Color = function(){}

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_fromRGB
 * @static
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @return {Client.Color} 
 */
Client.Color.fromRGB = function fromRGB(red, green, blue) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_fromHexString
 * @static
 * @param {String} colorString
 * @return {Client.Color} 
 */
Client.Color.fromHexString = function fromHexString(colorString) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_getRed
 * @return {Number} 
 */
Client.Color.prototype.getRed = function getRed() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_getGreen
 * @return {Number} 
 */
Client.Color.prototype.getGreen = function getGreen() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_getBlue
 * @return {Number} 
 */
Client.Color.prototype.getBlue = function getBlue() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Color.html#method_asHexString
 * @return {String} 
 */
Client.Color.prototype.asHexString = function asHexString() {};




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
 * @see https://developer.knuddels.de/docs/classes/Client.Event.html
 * @class Client.Event
 */
Client.Event = function(){}

/**
 * @see https://developer.knuddels.de/docs/classes/Client.Event.html#method_Event
 * @static
 * @param {String} type
 * @param {Object} data
 * @return {void} 
 */
Client.Event.Event = function Event(type, data) {};




/**
 * @see https://developer.knuddels.de/docs/classes/Client.html
 * @class Client
 */
function Client() {}

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_close
 * @static
 * @return {void} 
 */
Client.close = function close() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_sendEvent
 * @static
 * @param {String} type
 * @param {Json} data?
 * @return {void} 
 */
Client.sendEvent = function sendEvent(type, data) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_executeSlashCommand
 * @static
 * @param {String} command
 * @return {void} 
 */
Client.executeSlashCommand = function executeSlashCommand(command) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_includeJS
 * @static
 * @param {...String} files
 * @return {void} 
 */
Client.includeJS = function includeJS(files) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_addEventListener
 * @static
 * @param {String} type
 * @param {Function} callback
 * @return {void} 
 */
Client.addEventListener = function addEventListener(type, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_dispatchEvent
 * @static
 * @param {Client.Event} event
 * @return {void} 
 */
Client.dispatchEvent = function dispatchEvent(event) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_removeEventListener
 * @static
 * @param {String} type
 * @return {void} 
 */
Client.removeEventListener = function removeEventListener(type) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_removeEventListener
 * @static
 * @param {String} type
 * @param {Function} callback
 * @return {void} 
 */
Client.removeEventListener = function removeEventListener(type, callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_includeCSS
 * @static
 * @param {...String} files
 * @return {void} 
 */
Client.includeCSS = function includeCSS(files) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_playSound
 * @static
 * @param {String} fileName
 * @return {void} 
 */
Client.playSound = function playSound(fileName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_prefetchSound
 * @static
 * @param {String} fileName
 * @return {void} 
 */
Client.prefetchSound = function prefetchSound(fileName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_freeSound
 * @static
 * @param {String} fileName
 * @return {void} 
 */
Client.freeSound = function freeSound(fileName) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_getHostFrame
 * @static
 * @return {Client.HostFrame} 
 */
Client.getHostFrame = function getHostFrame() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_getNick
 * @static
 * @return {String} Nickname des Betrachters
 */
Client.getNick = function getNick() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_getClientType
 * @static
 * @return {ClientType} 
 */
Client.getClientType = function getClientType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_isK3Client
 * @static
 * @return {Boolean} 
 */
Client.isK3Client = function isK3Client() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_getCacheInvalidationId
 * @static
 * @return {String} 
 */
Client.getCacheInvalidationId = function getCacheInvalidationId() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_getDirectConnection
 * @static
 * @return {Promise} 
 */
Client.getDirectConnection = function getDirectConnection() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_addConnectionTypeChangeListener
 * @static
 * @param {Function} callback
 * @return {void} 
 */
Client.addConnectionTypeChangeListener = function addConnectionTypeChangeListener(callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#method_removeConnectionTypeChangeListener
 * @static
 * @param {Function} callback
 * @return {void} 
 */
Client.removeConnectionTypeChangeListener = function removeConnectionTypeChangeListener(callback) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.html#property_pageData
 * Beinhaltet die JSON-Daten, die beim Erstellen des HTMLFile Ã¼bergeben wurden.

* @type {Json}
*/
Client.pageData = {};



/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html
 * @class Client.HostFrame
 */
Client.HostFrame = function(){}

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setTitle
 * @param {String} newTitle
 * @return {void} 
 */
Client.HostFrame.prototype.setTitle = function setTitle(newTitle) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setBackgroundColor
 * @param {Client.Color} newColor
 * @param {Number} [durationMillis]
 * @return {void} 
 */
Client.HostFrame.prototype.setBackgroundColor = function setBackgroundColor(newColor, durationMillis) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setIcons
 * @since Applet: 9.0bwj, AppServer: 84904
 * @param {...String} path
 * @return {void} 
 */
Client.HostFrame.prototype.setIcons = function setIcons(path) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setResizable
 * @param {Boolean} resizable
 * @return {void} 
 */
Client.HostFrame.prototype.setResizable = function setResizable(resizable) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_focus
 * @since Applet: 9.0bwj, AppServer: 84904
 * @return {void} 
 */
Client.HostFrame.prototype.focus = function focus() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setSize
 * @since Applet: 9.0bwj, AppServer: 84516
 * @param {Number} width
 * @param {Number} height
 * @return {void} 
 */
Client.HostFrame.prototype.setSize = function setSize(width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setMinSize
 * @param {Number} width
 * @param {Number} height
 * @return {void} 
 */
Client.HostFrame.prototype.setMinSize = function setMinSize(width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setMaxSize
 * @param {Number} width
 * @param {Number} height
 * @return {void} 
 */
Client.HostFrame.prototype.setMaxSize = function setMaxSize(width, height) {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_getAppViewMode
 * @since Applet: 9.0byl
 * @return {String} 
 */
Client.HostFrame.prototype.getAppViewMode = function getAppViewMode() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_getBrowserType
 * @since Applet: 9.0bzp
 * @return {String} 
 */
Client.HostFrame.prototype.getBrowserType = function getBrowserType() {};

/**
 * @see https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_getBrowserVersion
 * @since STAPP: b210331
 * @return {String} 
 */
Client.HostFrame.prototype.getBrowserVersion = function getBrowserVersion() {};




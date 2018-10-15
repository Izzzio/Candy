
//unify browser and node
if (typeof _this ==='undefined') {
    var _this = this;
}

class DApp {

    constructor(candy) {
        let that = this;

        this.candy = candy;

        /***
         * @var {starwaveProtocol} this.starwave
         */
        this._starwave = candy.starwave;

        /**
         * Network functions
         * @type {{getCurrentPeers: ((function(*=): (*|Array))|getCurrentPeers), getSocketByBusAddress: getSocketByBusAddress, socketSend: *, rpc: {registerGetHandler: DApp.network.rpc.registerGetHandler, registerPostHandler: DApp.network.rpc.registerPostHandler}}}
         */
        this.network = {
            getCurrentPeers: this._starwave.getCurrentPeers,
            getSocketByBusAddress: this._starwave.getSocketByBusAddress,
            socketSend: this._starwave.write,
        };

        /**
         * Messaging functions
         * @type {{registerMessageHandler: (function(): boolean), broadcastMessage: (function(): void), sendMessage: (function(): void), starwave: {registerMessageHandler: (function(): any), sendMessage: (function(): any), createMessage: (function(): any)}}}
         */
        this.messaging = {
            registerMessageHandler: function () {
                return that.candy.registerMessageHandler.apply(that.candy, arguments)
            },
            broadcastMessage: function () {
                return that.candy.broadcastMessage.apply(that.candy, arguments)
            },
            sendMessage: function () {
                return that.network.socketSend.apply(that, arguments)
            },
            starwave: {
                registerMessageHandler: function () {
                    return that._starwave.registerMessageHandler.apply(that._starwave, arguments)
                },
                sendMessage: function () {
                    return that._starwave.sendMessage.apply(that._starwave, arguments)
                },
                createMessage: function () {
                    return that._starwave.createMessage.apply(that._starwave, arguments)
                },
            }
        };

        /**
         * System functions
         * @type {{getConfig: *}}
         */
        this.system = {
            getConfig: this.getConfig()
        };
    }


    /**
     * Register message handler
     * @param {string} message
     * @param {function} handler
     * @return {boolean}
     */
    registerMessageHandler(message, handler) {
        return this.candy.registerMessageHandler(message, handler);
    }


    /**
     * Returns config object
     * @return {*}
     */
    getConfig() {
        return this.candy;
    }

    /**
     * Returns array of peers addresses or sockets
     * @param fullSockets
     * @return {*|Array}
     */
    getCurrentPeers(fullSockets) {
        return this._starwave.getCurrentPeers(fullSockets);
    }

    /**
     * Initiate Application start
     */
    init() {
        this.candy.start();

    }

    /**
     * Terminating app
     */
    terminate(cb) {
        cb();
    }
}

//unify browser and node
if (this.window === undefined) {
    module.exports = DApp;
}
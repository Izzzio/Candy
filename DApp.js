
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
            registerMessageHandler: (args) => this.candy.registerMessageHandler(args),

            broadcastMessage: (args) => this.candy.broadcastMessage(args),

            sendMessage: (args) => this.network.socketSend(args),

            starwave: {
                registerMessageHandler: (args) => this._starwave.registerMessageHandler(args),

                sendMessage: (args) =>  this._starwave.sendMessage(args),

                createMessage: (args) => this._starwave.createMessage(args),

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
    init(cb) {
        this.candy.start();
        if (typeof cb === 'function'){
            cb();
        }
    };

    /**
     * Terminating app
     */
    terminate(cb) {
        if (typeof cb === 'function'){
            cb();
        }
    }
}

//unify browser and node
if (this.window === undefined) {
    module.exports = DApp;
}
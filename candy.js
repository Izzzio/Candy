/**
 * Candy
 * Blockchain driven Web Applications
 * @Author: Andrey Nedobylsky
 */

const BlockchainMessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    MY_PEERS: 3
};

const BlockchainRequestors = {
    queryAllMsg: function (fromIndex) {
        return {'type': BlockchainMessageType.QUERY_ALL, data: typeof fromIndex === 'undefined' ? 0 : fromIndex}
    }
};

function Candy(nodeList) {
    let that = this;
    this.maxConnections = 30;
    this.nodeList = nodeList;
    this.connections = 0;
    this.sockets = [];
    this.blockHeight = 0;
    this.resourceQueue = {};

    /**
     * On data recived callback
     * @param {String} data
     */
    this.ondata = function (data) {
        return false;
    };

    /**
     * On blockchain connection ready
     */
    this.onready = function () {

    };

    /**
     * Internal data handler
     * @param {WebSocket} source
     * @param {Object} data
     */
    this.dataRecieved = function (source, data) {
        if(typeof that.ondata === 'function') {
            if(that.ondata(data)) {
                return;
            }
        }

        //Data block recived
        if(data.type === BlockchainMessageType.RESPONSE_BLOCKCHAIN) {
            try {
                /**
                 * @var {Block} block
                 */
                let blocks = JSON.parse(data.data);
                for (let a in blocks) {
                    let block = blocks[a];
                    if(that.blockHeight < block.index) {
                        that.blockHeight = block.index
                    }
                    //Loading requested resource
                    if(typeof that.resourceQueue[block.index] !== 'undefined') {
                        that.resourceQueue[block.index](block.data);
                        that.resourceQueue[block.index] = undefined;
                    }
                    console.log(block);
                }

            } catch (e) {
            }
        }

        //New peers recived
        if(data.type === BlockchainMessageType.MY_PEERS) {
            for (let a in data.data) {
                if(data.data.hasOwnProperty(a)) {
                    if(that.nodeList.indexOf(data.data[a]) == -1) {
                        that.nodeList.push(data.data[a]);
                        if(that.connections < that.maxConnections - 1) {
                            that.connectPeer(data.data[a]);
                        }
                    }
                }
            }
            that.nodeList = Array.from(new Set(that.nodeList));
        }
    };

    /**
     * Inits peer connection
     * @param {String} peer
     */
    this.connectPeer = function (peer) {
        let socket = new WebSocket(peer);
        socket.onopen = function () {
            that.connections++;
            if(typeof that.onready !== 'undefined') {
                that.onready();
                that.onready = undefined;
            }
        };

        socket.onclose = function (event) {
            that.connections--;
            that.sockets[that.sockets.indexOf(socket)] = null;
            delete that.sockets[that.sockets.indexOf(socket)];
        };

        socket.onmessage = function (event) {
            try {
                let data = JSON.parse(event.data);
                that.dataRecieved(socket, data);
            } catch (e) {
            }
        };

        socket.onerror = function (error) {
            //console.log("Ошибка " + error.message);
        };
        that.sockets.push(socket);
    };

    /**
     * Broadcast message to peers
     * @param message
     */
    this.broadcastMessage = function (message) {
        for (let a in that.sockets) {
            if(that.sockets.hasOwnProperty(a) && that.sockets[a] !== null) {
                that.sockets[a].send(message);
            }
        }
    };

    /**
     * Reconnecting peers if fully disconnected
     */
    this.autoconnect = function () {
        if(that.connections < 1 || that.sockets[that.sockets.length - 1] === null) {
            for (let a in that.nodeList) {
                if(that.nodeList.hasOwnProperty(a)) {
                    if(that.connections < that.maxConnections - 1) {
                        that.connectPeer(that.nodeList[a]);
                    }
                }
            }
        } else {
            that.sockets = Array.from(new Set(that.sockets));
            that.connections = that.sockets.length;
        }
    };

    /**
     * Starts connection to blockchain
     */
    this.start = function () {
        for (let a in that.nodeList) {
            if(that.nodeList.hasOwnProperty(a)) {
                if(that.connections < that.maxConnections - 1) {
                    that.connectPeer(that.nodeList[a]);
                }
            }
        }
        setInterval(function () {
            that.autoconnect();
        }, 5000);

        return this;
    };

    /**
     * Load resource from blockchain
     * @param {Number} blockId
     * @param {Function} callback
     */
    this.loadResource = function (blockId, callback) {
        if(blockId > that.blockHeigth && blockId < 1) {
            callback(404);
        }
        that.resourceQueue[blockId] = function (data) {
            callback(null, JSON.parse(data));
        };
        let message = BlockchainRequestors.queryAllMsg(blockId);
        that.broadcastMessage(JSON.stringify(message));
    };

    return this;
}
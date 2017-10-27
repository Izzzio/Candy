/**
 * Candy
 * Blockchain driven Web Applications
 * @Author: Andrey Nedobylsky
 */

const MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    MY_PEERS: 3,
    BROADCAST: 4
};

const BlockchainRequestors = {
    queryAllMsg: function (fromIndex) {
        return {'type': MessageType.QUERY_ALL, data: typeof fromIndex === 'undefined' ? 0 : fromIndex}
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
    this.lastMsgTimestamp = 0;

    /**
     * Current reciever address. Override allowed
     * @type {string}
     */
    this.recieverAddress = (Math.random() * (new Date().getTime())).toString(36).replace(/[^a-z]+/g, '');

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
     * If message recived
     * @param {object} message
     */
    this.onmessage = function (message) {

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
        if(data.type === MessageType.RESPONSE_BLOCKCHAIN) {
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
        if(data.type === MessageType.MY_PEERS) {
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

        if(data.type === MessageType.BROADCAST) {
            if(data.reciver === that.recieverAddress && that.lastMsgTimestamp < data.timestamp) {
                that.lastMsgTimestamp = data.timestamp;
                if(typeof that.onmessage === 'function') {
                    if(that.onmessage(data)) {
                        return;
                    }
                }
            } else {
                if(data.recepient !== that.recieverAddress) {
                    data.TTL++;
                    that.broadcast(data);
                }
            }
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
    this.broadcast = function (message) {
        if(typeof message !== 'string') {
            message = JSON.stringify(message);
        }
        for (let a in that.sockets) {
            if(that.sockets.hasOwnProperty(a) && that.sockets[a] !== null) {
                try {
                    that.sockets[a].send(message);
                } catch (e) {
                }
            }
        }
    };


    /**
     * Broadcast global message
     * @param {object} messageData содержание сообщения
     * @param {string} id идентефикатор сообщения
     * @param {string} reciver получатель сообщения
     * @param {string} recepient отправитель сообщения
     */
    this.broadcastMessage = function (messageData, id, reciver, recepient) {
        let message = {
            type: MessageType.BROADCAST,
            data: messageData,
            reciver: reciver,
            recepient: recepient,
            id: id,
            timestamp: (new Date().getTime()),
            TTL: 0
        };
        that.broadcast(message);
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
        that.broadcast(JSON.stringify(message));
    };

    return this;
}
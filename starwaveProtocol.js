/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author:  iZ³ Team (info@izzz.io)
 */

/**
 * moment js required
 * @type {number}
 */
'use strict'
const MESSAGE_MUTEX_TIMEOUT = 1000;
const LATENCY_TIME = 10 * 1000; //time on obsolescence of message

//const moment = require('moment');

class starwaveProtocol {

    constructor(candy, messageType) {
        this.recieverAddress = candy.recieverAddress;
       // this.config = config;
        this.candy = candy;
        this.candy.MessageType = messageType;
        this.getid = candy.getid;
        /**
         * Input message mutex
         * @type {{}}
         * @private
         */
        this._messageMutex = {};
    }

    /**
     * Create message of starwave type
     * @param data
     * @param reciver
     * @param sender
     * @param id
     * @param timestamp
     * @param TTL
     * @param relevancyTime
     * @param route
     * @param type
     * @param timestampOfStart
     * @returns {{data: *, reciver: *, sender: *, id: *, timestamp: number, TTL: number, index: *, mutex: string, relevancyTime: Array, route: Array, type: number, timestampOfStart: number}}
     */
    createMessage(data, reciver, sender, id, timestamp, TTL, relevancyTime, route, type, timestampOfStart) {
        return {
            data: data,
            reciver: reciver,
            sender: sender !== undefined ? sender : this.candy.recieverAddress,
            id: id,
            timestamp: timestamp !== undefined ? timestamp : moment().utc().valueOf(),  //при пересылке сообщений. если указано время, значит, пересылается сообщение и оставляем первоначальное время создания
            TTL: typeof TTL !== 'undefined' ? TTL : 0, //количество скачков сообщения
            mutex: this.getid() + this.getid() + this.getid(),
            relevancyTime: relevancyTime !== undefined ? relevancyTime : LATENCY_TIME, // время актуальности сообщений
            route: route !== undefined ? route : [],     //маршрут сообщения
            type: type !== undefined ? type : this.candy.MessageType.SW_BROADCAST,
            timestampOfStart: timestampOfStart !== undefined ? timestampOfStart : moment().utc().valueOf()
        };
    };

    /**
     * Register message handler
     * @param {string} message
     * @param {function} handler
     * @return {boolean}
     */
    registerMessageHandler(message, handler) {
        let that = this;
        if(typeof that.candy !== 'undefined') {
            this.candy.registerMessageHandler(message, function (messageBody) {
                if(messageBody.id === message || message.length === 0) {
                    if(typeof  messageBody.mutex !== 'undefined' && typeof that._messageMutex[messageBody.mutex] === 'undefined') {
                        handler(messageBody);
                        that.handleMessageMutex(messageBody);
                    }
                }
            });
            return true;
        }
        return false;
    };


    /**
     * send message to peer directly(using busAddress)
     * @param messageBusAddress
     * @param {object} message
     */
    sendMessageToPeer(messageBusAddress, message) {
        let that = this;
        if(typeof that.candy !== 'undefined') {

            if(messageBusAddress === this.getAddress()) { //Сообщение самому себе
                this.handleMessage(message, this.candy.messagesHandlers, null);
                return true;
            } else {
                let socket = this.getSocketByBusAddress(messageBusAddress);

                if(!socket) {  //нет такого подключенного сокета
                    return false;
                } else {
                    //добавляем свой адрес в маршруты, если маршрут не закончен
                    if(!this.routeIsComplete(message)) {
                        message.route.push(this.candy.recieverAddress);
                    }
                    //отправляем сообщение
                    this.write(socket, message);
                    this.handleMessageMutex(message);
                    return true; //сообщение отправлено
                }
            }

        }
    };

    /**
     * send broadcasting messages to all peers excluding previous sender
     * @param {object} message
     */
    broadcastMessage(message) {
        let that = this;
        //примечание по заданию: Если маршрут пустой ИЛИ если в маршруте нет известных получателей (за исключением отправителя), сообщения рассылаются всем кроме отправителя
        //если пустой, значит, первая отправка и идет всем
        if(typeof that.candy !== 'undefined') {
            let prevSender; //отправитель сообщения
            if(message.route.length > 0) { //если массив маршрута пуст, значит, это первая отправка сообщения и рассылать нужно без ограничений
                //сохраняем предыдущего отправителя(он записан последним в массиве маршрутов)
                prevSender = that.getSocketByBusAddress(message.route[message.route.length - 1]);
            }
            //добавляем свой адрес в маршруты
            message.route.push(this.candy.recieverAddress);
            //устанавливаем тип сообщения
            message.type = this.candy.MessageType.SW_BROADCAST;
            //рассылаем всем, кроме отправителя(если это уже не первая пересылка)
            this.broadcast(message, prevSender);
            this.handleMessageMutex(message);
        }
    };

    /**
     *  send message using starwave protocol
     * @param message //message object
     */
    sendMessage(message) {
        if(!this.sendMessageToPeer(message.reciver, message)) {   //не получилось отправить напрямую, нет напрямую подключенного пира, делаем рассылку всем
            //очищаем маршрут, начиная с текущего узла
            this.broadcastMessage(message);
            return 2; //отправили широковещательно
        }
        return 1; //отправили напрямую
    };

    /**
     * disassemble incoming message and decide what we should do with it
     * @param message
     * @returns {*}
     */
    manageIncomingMessage(message) {

        //Сообщение от самого себя
        if(message.sender === this.getAddress()) {
            try { //Попытка отключения от самого себя
                message._socket.close();
            } catch (e) {
            }
            return 0;
        }

        //проверяем актуальность сообщения
        if((moment().utc().valueOf()) > (message.timestamp + message.relevancyTime + LATENCY_TIME)) {
            return 0; //оставляем без внимания сообщение
        }
        //проверяем, достигли сообщение конечной точки
        if(this.endpointForMessage(message)) {
            //сохраняем карту маршрута
            if(message.route.length > 1) { //если карта маршрута из одного элемента, значит, есть прямое подключение к отправителю и записывать не нужно
                message.route.push(this.candy.recieverAddress);//переворачиваем массив, чтобы использовать его для посылки
                this.candy.routes[message.sender] = message.route.reverse().filter((v, i, a) => a.indexOf(v) === i);
            }
            return 1;   //признак того, что сообщение достигло цели
        } else {        //если сообщение проходное
            //пока ничего не делаем
            return 0;
            //return this.retranslateMessage(message);
        }
        //сообщение актуально и не достигло получателя, значит
        //проверяем наличие закольцованности. если в маршруте уже есть этот адрес, а конечная точка еще не нашлась,то не пускаем дальше
        //см. описание выше
        /* if(!this.routeIsComplete(message) &&
             (message.route.indexOf(this.candy.recieverAddress) > -1)) {
             return 0;                           //т.е. массив маршрута еще в стадии построения, и к нам пришло сообщение повторно
         }*/
    };

    /**
     * retranslate incoming message
     * @param message
     * @returns {*} sended message
     */
    retranslateMessage(message) {
        //пересоздаем сообщение(если необходимо что-то добавить)
        let newMessage = message;
        if(this.routeIsComplete(newMessage)) {
            let ind = newMessage.route.indexOf(this.candy.recieverAddress); // индекс текущего узла в маршрутной карте
            if(!this.sendMessageToPeer(newMessage.route[ind + 1], newMessage)) { //не получилось отправить напрямую, нет напрямую подключенного пира, делаем рассылку всем
                //очищаем маршрут, начиная с текущего узла, потому что маршрут сломан и перестраиваем его
                newMessage.route = newMessage.route.splice(ind);
                this.broadcastMessage(newMessage);
            }
        } else {//если маршрут не закончен
            this.sendMessage(newMessage);
        }
        return newMessage;
    };

    /**
     * full message processing according to the Protocol
     * @param message
     * @param messagesHandlers
     * @param ws
     * @returns {*} //id of processed message
     */
    handleMessage(message, messagesHandlers, ws) {
        if(message.type === this.candy.MessageType.SW_BROADCAST) {
            if(this.manageIncomingMessage(message) === 1) {
                //значит, сообщение пришло в конечную точку и
                /**
                 * Проходимся по обработчикам входящих сообщений
                 */
                for (let a in messagesHandlers) {
                    if(messagesHandlers.hasOwnProperty(a)) {
                        message._socket = ws;
                        if(messagesHandlers[a].handle(message)) {
                            return message.id; //Если сообщение обработано, выходим
                        }
                    }
                }
            }
        }
    }

    /**
     * process the message mutex
     * @param messageBody
     */
    handleMessageMutex(messageBody) {
        //взято из диспетчера
        this._messageMutex[messageBody.mutex] = true;
        setTimeout(() => {
            if(typeof this._messageMutex[messageBody.mutex] !== 'undefined') {
                delete this._messageMutex[messageBody.mutex];
            }
        }, MESSAGE_MUTEX_TIMEOUT);
    };

    /**
     * check if our node is the reciver
     * @param message
     * @returns {boolean}
     */
    endpointForMessage(message) {
        return message.reciver === this.candy.recieverAddress;
    };

    /**
     * check if our route is complete
     * @param message
     * @returns {boolean}
     */
    routeIsComplete(message) {
        return (message.route[message.route.length - 1] === message.reciver);
    };

    /**
     * Returns address
     * @return {string}
     */
    getAddress() {
        return this.candy.recieverAddress;
    };

    /**
     * Write to socket
     * @param ws
     * @param message
     */
    write (ws, message) {
        try {
            ws.send(JSON.stringify(message))
        } catch (e) { //ошибка записи, возможно сокет уже не активен
            console.log('Send error: ' + e );
        }
    }

    /**
     * get the list of connected peers(sockets)
     * @returns {Array}
     */
    getCurrentPeers(fullSockets) {
        return this.candy.sockets.map(function (s) {
            if(s && s.readyState === 1) {
                if(fullSockets) {
                    return s;
                } else {
                    return 'ws://' + s._socket.remoteAddress + ':' + /*s._socket.remotePort*/ config.p2pPort
                }
            }
        }).filter((v, i, a) => a.indexOf(v) === i);
    }

    /**
     * find socket using bus address
     * @param address
     * @return {*}
     */
    getSocketByBusAddress(address) {
        const sockets = this.getCurrentPeers(true);
        for (let i in sockets) {
            if(sockets.hasOwnProperty(i)) {
                if(sockets[i] && sockets[i].nodeMetaInfo) {
                    if(sockets[i].nodeMetaInfo.messageBusAddress === address) {
                        return sockets[i];
                    }
                }
            }
        }

        return false;
    }

        /**
         * Broadcast message
         * @param message
         * @param excludeIp
         */
    broadcast(message, excludeIp) {
        let i;
        for (i = 0; i <= this.candy.sockets.length; i++){
            let socket = this.candy.sockets[i];
            if(typeof excludeIp === 'undefined' || socket !== excludeIp) {
                this.write(socket, message)
            } else {

            }
        }
    };
}

/**
 Module which made transactions collections
 */

'use strict';
//unify browser and node
if (typeof _this ==='undefined') {
    var _this = this;
}
if (_this.window === undefined){

}

class TransactionCollector {

    constructor (candy) {
        this.candy = candy;
        this.lastAddedTransaction = {};
    }


    /**
     * create alert about new transaction
     * @param data
     * @param index
     * @returns {{type: number, data: *, index: string}}
     */
    createMessage(data, index = ''){
        let JSONdata = JSON.stringify(data);
        return {
            type: this.blockchain.messageType.TRANS_COLL,
            data: JSONdata,
            index:index
        }
    }

    /**
     * broadcasting message to all peers about new element of collection, excluding excludeSocket
     * @param data
     * @param broadcastFunction
     * @param excludeSocket
     */
    sendTransactionToAllPeers(data, broadcastFunction, excludeSocket){
        broadcastFunction (this.createMessage(data), excludeSocket);
    }
}

//unify browser and node
if (this.window === undefined){
    module.exports = TransactionCollector;
}
/**
 * Class realises universal functions for cryptography in project
 */

'use strict';
/*const CryptoJS = require('crypto-js');
const GostSign = require('./GOSTModules/gostSign');
const crypto = require('crypto');
const keypair = require('keypair');
const GostDigest = require('./GOSTModules/gostDigest');
*/
//unify browser and node
if (typeof _this ==='undefined') {
    var _this = this;
}

if (_this.window === undefined) {
    _this.DigitalSignature = require('./digitalSignature');
    _this.CryptoJS = require('crypto-js');
    _this.coding = new (require('./GOSTModules/gostCoding'))();
    _this.GostDigest = require('./GOSTModules/gostDigest');
    _this.CryptoJS = require('crypto-js');
    _this.GostSign = require('./GOSTModules/gostSign');
} else {
    _this.GostDigest =  _this.GostDigest ?  _this.GostDigest : gostFunctionForDigest;
    _this.coding = _this.coding ? _this.coding : gostFunctionForCoding;
    _this.CryptoJS = _this.CryptoJS ? _this.CryptoJS : CryptoJS;
    _this.GostSign = _this.GostSign ? _this.GostSign : gostFunctionForSign;
}

const inputOutputFormat = 'hex';
const SIGN_TYPE = 'sha256';
/**
 * Repair bad generated key
 * @param key
 * @return {*}
 */
function repairKey(key) {
    if(key[key.length - 1] !== "\n") {
        key += "\n";
    }
    return key.replace(new RegExp("\n\n", 'g'),"\n");
}

class Cryptography {
    constructor(config){
        if (!config){
        } else {
            let ha = null;
            //настраиваем хэш
            switch (config.hashFunction) {
                case 'STRIBOG':
                    ha = {length: 256};
                    break;
                case 'STRIBOG512':
                    ha.length = {length: 256};
                    break;
            }
            let sa = null;

            //настраиваем подпись
            switch (config.signFunction) {
                case 'GOST':
                    sa = {hash: "GOST R 34.11", length: 256};
                    break;
                case 'GOST512':
                    sa = {hash: "GOST R 34.11", length: 512, namedCurve: "T-512-A"};
                    break;
            }
            //проверяем параметры хэша
            if (ha !== null) {
                this.gostDigest = new _this.GostDigest(ha);
            }
            //проверяем параметры подписи и ключей
            if (sa !== null) {
                this.gostSign = new _this.GostSign(sa);
            } else {
                this.digitalSignature = new DigitalSignature();
            }
        }
    }

    /**
     * convert data data to buffer (all strings consider as utf8 format only)
     * @param data
     * @returns {Buffer}
     */
    static data2Buffer(data) {
        let bData;
        try{
            //bData = Buffer.from(data);
            bData = _this.coding.Chars.decode(data);

        } catch (e) {
           // bData = Buffer.from(JSON.stringify(data));
            bData = _this.coding.Chars.decode(JSON.stringify(data));
        }
        return bData;
    }

    /**
     * generates pair of keys
     * @returns {{private: *, public: *}}
     */
    generateKeyPair() {
        let keyPair;
        if (this.gostSign) {
            keyPair = this.gostSign.generateKey();
            //конвертируем в формат
            keyPair.public = _this.coding.Hex.encode(keyPair.publicKey);
            keyPair.private = _this.coding.Hex.encode(keyPair.privateKey);
        } else {
            keyPair = this.digitalSignature.generate();
            keyPair.private = repairKey(keyPair.private);
            keyPair.public = repairKey(keyPair.public);
        }
        return {private: keyPair.private, public: keyPair.public};
    }

    /**
     * signs data
     * @param data
     * @param key
     * @returns {{data: *, sign: *}}
     */
    sign(data, key) {
        let signedData;
        if (this.gostSign) {
            let bData, bKey;
            //prepare data for processing
            bData = Cryptography.data2Buffer(data);
            bKey = _this.coding.Hex.decode(key);

            signedData = this.gostSign.sign(bKey, bData);
            signedData = _this.coding.Hex.encode(signedData);
        } else {
            signedData = this.digitalSignature.signData(data, key).sign;
        }
        return {data: data, sign: signedData};
    }

    /**
     * verifies signed data
     * @param data
     * @param sign
     * @param key
     * @returns {boolean} true or false
     */
    verify(data, sign, key) {
        if(typeof  data === 'object') {
            sign = data.sign;
            data = data.data;
        }
        let result;
        if (this.gostSign) {
            let bData, bKey, bSign;
            bData = Cryptography.data2Buffer(data);
            bKey = _this.coding.Hex.decode(key);
            bSign = _this.coding.Hex.decode(sign);
            result = this.gostSign.verify(bKey, bSign, bData);
        } else {
            result = this.digitalSignature.verifyData(data, sign, key);
        }
        return result;
    }

    /**
     * creates hash of the data
     * @param {string/ArrayBufferTypes}data
     * @returns {Buffer}
     */
    hash(data = '') {
        let bData = Cryptography.data2Buffer(data);
        let hashBuffer;
        if (this.gostDigest) {
            hashBuffer = this.gostDigest.digest(bData);
        } else {
            hashBuffer = _this.CryptoJS.SHA256(data).toString();
            hashBuffer = _this.coding.Hex.decode(hashBuffer); //make output independent to hash function type
        }
        return _this.coding.Hex.encode(hashBuffer);
    }
}

if (this.window === undefined) {
    module.exports = Cryptography;
}
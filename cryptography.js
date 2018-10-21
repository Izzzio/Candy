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
    _this.coding = require('./GOSTModules/gostCoding');
    _this.GostDigest = require('./GOSTModules/gostDigest');
    _this.CryptoJS = require('crypto-js');
    _this.GostSign = require('./GOSTModules/gostSign');
    _this.utils = require('./utils');
} else {
    _this.GostDigest =  _this.GostDigest ?  _this.GostDigest : gostFunctionForDigest;
    _this.coding = _this.coding  ? _this.coding : gostFunctionForCoding;
    _this.CryptoJS = _this.CryptoJS ? _this.CryptoJS : CryptoJS;
    _this.GostSign = _this.GostSign ? _this.GostSign : gostFunctionForSign;
    _this.DigitalSignature = _this.DigitalSignature ? _this.DigitalSignature : DigitalSignature;
    _this.utils = _this.utils ? _this.utils : utils;
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
    constructor(config = {}){
        this.utils = _this.utils;
        this.coding = new _this.coding();
        this.config = config;
        this.config.hashFunction = this.config.hashFunction ? this.config.hashFunction.toUpperCase() : this.config.hashFunction;
        this.config.signFunction = this.config.signFunction ? this.config.signFunction.toUpperCase() : this.config.signFunction;
        let ha,sa;
        if (config) {
            //настраиваем хэш
            switch (this.config.hashFunction) {
                case 'STRIBOG':
                    ha = {length: 256};
                    break;
                case 'STRIBOG512':
                    ha = {length: 512};
                    break;
            }
            //настраиваем подпись
            switch (this.config.signFunction) {
                case 'GOST':
                    sa = {hash: "GOST R 34.11", length: 256};
                    break;
                case 'GOST512':
                    sa = {hash: "GOST R 34.11", length: 512, namedCurve: "T-512-A"};
                    break;
            }
        }
        //проверяем параметры хэша
        if (ha) {
            this.gostDigest = new _this.GostDigest(ha);
        }
        //проверяем параметры подписи и ключей
        if (sa) {
            this.gostSign = new _this.GostSign(sa);
        } else {
            this.digitalSignature = new _this.DigitalSignature();
        }

    }

    /**
     * convert data data to buffer (all strings consider as utf8 format only)
     * @param data
     * @returns {Buffer}
     */
    data2Buffer(data) {
        let bData;
        try{
            bData = this.coding.Chars.decode(data, 'utf8');

        } catch (e) {
            bData = this.coding.Chars.decode(JSON.stringify(data), 'utf8');
        }
        return bData;
    }

    /**
     * convert key from PEM format to hex string
     * @param key PEM key
     * @param kind kind of the key: public or private
     * @returns {string} base64 encoded key
     * @constructor
     */
    PEMToUtf16(key, kind = 'PUBLIC') {
        let k = this.coding.PEM.decode(key, `rsa ${kind} key`);
        let hex = this.coding.Hex.encode(k);
        hex = hex.replace(new RegExp(/\r\n/, 'g'),"");
        return this.utils.hexString2Unicode(hex);
    }

    /**
     * convert key from hex string to PEM format
     * @param key
     * @param kind
     * @returns {*|String|string|CryptoOperationData|Uint8Array}
     * @constructor
     */
    utf16ToPem(key, kind = 'PUBLIC') {
        key = this.utils.unicode2HexString(key).replace(new RegExp(/\r\n/, 'g'),"");
        let k = this.coding.Hex.decode(key);
        let pem = this.coding.PEM.encode(k, `RSA ${kind} KEY`);
        return pem;
    }

    /**
     * convert ArrayBuffer to unicode string
     * @param key {ArrayBuffer}
     * @returns {*|string}
     */
    bufferToUtf16(key){
     let k = this.coding.Hex.encode(key).replace(new RegExp(/\r\n/, 'g'),"");
     k = this.utils.hexString2Unicode(k);
     return k;
    }

    /**
     * convert unicode string to ArrayBuffer
     * @param key {string} unicode string
     * @returns {*|string}
     */
    utf16ToBuffer(key){
        let k = this.utils.unicode2HexString(key);
        k = this.coding.Hex.decode(k);
        return k;
    }

    /**
     * generates pair of keys
     * @returns {{private: *, public: *}}
     */
    generateKeyPair() {
        let keyPair;
        if (this.gostSign) {
            keyPair = this.gostSign.generateKey();
            keyPair.public = this.bufferToUtf16(keyPair.publicKey);
            keyPair.private = this.coding.Hex.encode(keyPair.privateKey);
        } else {
            keyPair = this.digitalSignature.generate();
            keyPair.private = repairKey(keyPair.private);
            keyPair.public = repairKey(keyPair.public);
        }
        if (this.config.signFunction === 'NEWRSA'){
            //get old rsa key in PEM format and convert to utf-16
            keyPair.public = this.PEMToUtf16(keyPair.public);
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
            bData = this.data2Buffer(data);
            bKey = this.coding.Hex.decode(key);

            signedData = this.gostSign.sign(bKey, bData);
            signedData = this.coding.Hex.encode(signedData);
        } else {
            signedData = this.digitalSignature.signData(data, key).sign;
        }
        signedData = signedData.replace('\r\n',''); //delete wrong symbols
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
            bData = this.data2Buffer(data);
            bKey = this.utf16ToBuffer(key);
            bSign = this.coding.Hex.decode(sign);
            result = this.gostSign.verify(bKey, bSign, bData);
        } else {
            let k = key;
            //convert key if it's not in PEM
            k = k.indexOf('RSA PUBLIC KEY') < 0 ?  this.utf16ToPem(k,'PUBLIC') : k;
            result = this.digitalSignature.verifyData(data, sign, k);
        }
        return result;
    }

    /**
     * creates hash of the data
     * @param {string/ArrayBufferTypes}data
     * @returns {Buffer}
     */
    hash(data = '') {
        let bData = this.data2Buffer(data);
        let hashBuffer;
        if (this.gostDigest) {
            hashBuffer = this.gostDigest.digest(bData);
        } else {
            hashBuffer = _this.CryptoJS.SHA256(data).toString();
            hashBuffer = this.coding.Hex.decode(hashBuffer); //make output independent to hash function type
        }
        return this.coding.Hex.encode(hashBuffer).replace('\r\n','');
    }
}

if (this.window === undefined) {
    module.exports = Cryptography;
}


/**
 * Encryption protocol for starwave
 * new fields in message object:
 * encrypted - means that message is encrypted
 * publicKey - public key of the sender which wants to make crypted tunnel
 * Using secp256k1 curve and aes256 algorithm as default
 *
 * This module uses elliptic library for creating keypair and Stanford Javascript Crypto Library (SJCL) to encrypt/decrypt message
 * https://github.com/indutny/elliptic
 * https://github.com/bitwiseshiftleft/sjcl
 */

'use strict';

class StarwaveCrypto {
    /*constructor(bits = 2048){
        //diffiehellman object
        this.keyObject = crypto.createDiffieHellman(bits);
        this.public = this.generateKeys();
    };*/

    constructor(starwaveProtocolObject, secretKeys, curve = 'secp256k1' ){
        // EСDH object
        this.ec = new elliptic.ec(curve);
        this.keyObject = this.ec.genKeyPair();
        this.public = this.getPublicInHex();
        this.starwave = starwaveProtocolObject;
        this.secretKeys = secretKeys;
        this.curve = curve;
    };

    /**
     * get public key object for Diffie-Hellman
     * @returns {*}
     */
    getPublicInHex (keyObject = this.keyObject){
        let publicKey = keyObject.getPublic(true,'hex');
        return publicKey;
    }

    /**
     * create secret key based on external public key
     * @param externalPublic
     * @returns {*}
     */
    createSecret(externalPublic){

        let secret;
        try {
            let pub = this.ec.curve.decodePoint(externalPublic, 'hex'); //get public key object from string
            secret = this.keyObject.derive(pub);
            secret = secret.toString(16);
        } catch (err) {
            console.log('Error: Can not create secret key ' + err); //if externalPublic is wrong
        }
        return secret;
    };


    /**
     * Encrypts data
     * @param data
     * @param secret
     */
    cipherData(data, secret){


        let encrypted = CryptoJS.AES.encrypt(data, secret).toString();
        encrypted = encrypted.toString();
       // encrypted =  CryptoJS.enc.Base64.parse(encryptedData);

        //let encrypted = CryptoJS.AES.encrypt(data, secret).toString();
       /* try {
            let options = { mode: CryptoJS.mode.CBC, iv: iv};
            encrypted = CryptoJS.AES.encrypt(msg, this.pass, options);
        } catch (err) {
            console.error('Error trying encrypt data' + err);
        }
        return encrypted;*/
       /* //output in base64 format so we should convert it to hex
        try{
            let b64 = CryptoJS.enc.Base64.parse(encrypted);
            encrypted = b64.toString(CryptoJS.enc.Hex);
        } catch (e) {
            console.log('Error converting encrypted data: ' + e)
        }*/
        return encrypted;
    }

    /**
     * Decripts data
     * @param encryptedData
     * @param secret
     * @returns {*}
     */
    decipherData(encryptedData, secret) {
        let data;
        try {
            //make tranformations because of little features in crypto (node) - it uses empty salt array
            let ct = CryptoJS.enc.Hex.parse(encryptedData);
            let salt = CryptoJS.lib.WordArray.create(0); // empty array
            data = CryptoJS.AES.decrypt({ciphertext: ct, salt: salt}, secret);
            data = data.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.log('Error decrypting data: ' + e)
        }
        return data;
    }

    /**
     * decrypts data field in message
     * @param message
     * @returns {*}
     */
    decipherMessage(message){
        let decryptedData;

        //if message didn't encrypted, return data
        if (!message.encrypted){
            return decryptedData = message.data;
        }

        //if we have secret key associated with this socket than we have the tunnel
        if (this.secretKeys[message.sender]){
            decryptedData = this.decipherData(message.data, this.secretKeys[message.sender]);
            if (decryptedData) {
                //try to parse json
                try {
                    decryptedData = JSON.parse(decryptedData)
                } catch (e) {
                    console.log("Error: An error occurred while parsing decrypted text: " + e);
                }
            }
            message.data = decryptedData;
            delete message.encrypted;
        }
        return decryptedData;
    }

    /**
     * encrypts data field in message
     * @param message
     * @returns {*}
     */
    cipherMessage(message){
        let cryptedData;
        //should be assotiated secret key and check that message has not been already encrypted
        if (this.secretKeys[message.reciver] && !message.encrypted){
            cryptedData = this.cipherData(JSON.stringify(message.data), this.secretKeys[message.reciver]);
            message.encrypted = true;
            message.data = cryptedData;
        }
        return cryptedData;
    }

    /**
     * processes incoming message
     * @param message
     * @returns {*}
     */
    handleIncomingMessage(message){
        //watch if the message has Public key field then the message is only for sending the key
        if (message.publicKey) {
            let sc = this.createSecret(message.publicKey); //exclude situation with exception on wrong public
            //if we don't have secret key then we save sender publickey and create secret and send our public to make connection
            if (!this.secretKeys[message.sender] && sc){
                this.makeConnection(message.sender);
            }
            if (sc){
                this.secretKeys[message.sender] = sc;
            }
            delete message.publicKey;
            return 0;
        }
        //try to decipher message if it possible
        return this.decipherMessage(message); //undefined if we have errors
    }

    /**
     * send public key to messagebus address
     * @param messageBus
     * @returns {{data: *, reciver: *, sender: *, id: *, timestamp: number, TTL: number, index: *, mutex: string, relevancyTime: Array, route: Array, type: number, timestampOfStart: number}|any|{type: number, data: *, reciver: *, recepient: *, id: *, timestamp: number, TTL: number, index: number}}
     */
    makeConnection(messageBus){
        let message = this.starwave.createMessage('',messageBus,undefined,'DH-CONNECTION');
        message.publicKey = this.public;
        this.starwave.sendMessage(message);
        return message;
    }

    /**
     * send message using encryption protocol
     * @param message
     * @returns {number}
     */
    sendMessage(message){
        //check if we have secret key for reciver
        let sk = this.secretKeys[message.reciver]; //secret key
        if (sk){
            if (this.cipherMessage(message)){
                this.starwave.sendMessage(message);
                return message;
            }else{
                console.log("Error: Can't cipher message");
                return 2;
            }
        }
        else
        {
            console.log(`Error: There is no secret key for address: ${message.reciver}`)
            return 1;
        }
    }

}

/**
 * Digital Signature for Candy
 * uses SHA256withRSA algorithm
 * required forge.min.js
 * https://github.com/digitalbazaar/forge
 */

'use strict';

//unify browser and node
if (typeof _this ==='undefined') {
    var _this = this;
}
if (_this.window === undefined){
    _this.forge = require('node-forge');
}


function DigitalSignature(dataToSign) { //data in string format
	
	/**
     * RSA keys for sign
     */
	this.keysPair = {};
   
	/**
     * Sign
     */
	this.sign = '';
    
	/**
     * data format as presented in 'block data'
     */
	this.signedData = {
		data: dataToSign,     //incoming data
		sign:'',              //sign in HEX format
		pubkey:''             //Public key in pem PKCS#1
	};
	
	/**
     * Generate pair of keys for signing
     * @param {len} length of the key
     */
	this.generate = (len = 2048) => {
		
        let rsa = _this.forge.pki.rsa;
        let keypair = _this.forge.rsa.generateKeyPair({len});
        keypair = {
            public: repairKey(fix(_this.forge.pki.publicKeyToRSAPublicKeyPem(keypair.publicKey, 72))),
            private: repairKey(fix(_this.forge.pki.privateKeyToPem(keypair.privateKey, 72)))
        };
        this.keysPair = keypair;
        console.log('Info: Keypair generated');
        return keypair;
    };
    
    
    function fix (str) {
      return str.replace(/\r/g, '') + '\n'
    }
    
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
	
	/**
     * Signs data
	 * @param {data} data for signing
	 * @param {key} key
     */
    
    
	this.signData = (data = dataToSign, key = this.keysPair.private) => {
		if (!data) {
			console.log('No data to sign');
			return '';
		}
        let md= _this.forge.md.sha256.create();
        md.update(data,'utf8');
        let privateKey = _this.forge.pki.privateKeyFromPem(key);
        this.sign = privateKey.sign(md); 
        console.log('Info: Data signed');
		return {data: data, sign: _this.forge.util.bytesToHex(this.sign)};
	};
	
	
	/**
     * Signs data
	 * @param {data} data for signing
     * @param {sign} sign
	 * @param {key} key
     */
	this.verifyData = (data = this.signedData, sign = this.signedData.sign, key = this.signedData.pubkey) => {
		if (typeof data === 'object'){
            sign = data.sign;
            data = data.data;
        }
        try {
            let publicKey = _this.forge.pki.publicKeyFromPem(repairKey(fix(key)));
            let md = _this.forge.md.sha256.create();
            md.update(data,'utf8');
			return publicKey.verify(md.digest().bytes(), _this.forge.util.hexToBytes(sign)); //verifying only in bytes format
		} catch (e){
			console.log(e);
            return false;
		}
	};
	
	if (dataToSign !== undefined){
        this.keysPair = this.generate();
        this.signedData.pubkey = this.keysPair.public;
        this.signedData.sign = this.signData().sign;
        if(this.verifyData() === false) {
            console.log('Sign self-validation error! Invalid key or sign checking');
        }
	}
	
	return this;
}

//unify browser and node
if (this.window === undefined){
    module.exports = DigitalSignature;
}
/**
 * Digital Signature for Candy
 * 
 * required jsrsasign (jsrsasign-all-min.js)
 */

'use strict';

function DigitalSignature(dataToSign) { //data in string format
	
	/**
     * EC keys for sign
     */
	this.keysPair = {};
	/**
     * curve's name for generating keys
     */
	this.curve = 'secp256k1';
	/**
     * Sign in HEX format
     */
	this.signHex = '';
	/**
     * Sign algorithm
     */
	this.sigAlg = 'SHA256withECDSA';
	/**
     * data format as presented in 'block data'
     */
	this.signedData = {
		data:'',
		sign:'',
		pubkey:''
	};
	
	/**
     * Generate pair of keys for signing
     * @param {curve} name of the curve
     */
	this.generateKeys = (curve = this.curve) => {
		let ec = new KJUR.crypto.ECDSA({"curve": curve});
		let keypair = ec.generateKeyPairHex();
		this.keysPair.private = keypair.ecprvhex;
		//ExportPublicToPEM
		this.keysPair.public = KEYUTIL.getPEM(KEYUTIL.getKey({xy: keypair.ecpubhex, curve: curve}));
		return this.keysPair;
	};
	
	
	/**
     * Signs data
	 * @param {data} data for signing
	 * @param {privateKey} private key
	 * @param {curve} name of the curve
	 * @param {sigAlg} name of the algorithm
     */
	this.signData = (data = dataToSign, privateKey = this.keysPair.private, curve = this.curve, sigAlg = this.sigAlg) => {
		if (!data) {
			console.log('No data to sign');
			return '';
		};
		var msg = data;
		var sig = new KJUR.crypto.Signature({"alg": sigAlg});
		sig.init({d: privateKey, curve: curve});
		sig.updateString(msg);
		this.signHex = sig.sign();
		return this.signHex; 
	};
	
	
	/**
     * Signs data
	 * @param {data} data for signing
	 * @param {puBkey} private key
	 * @param {sigAlg} name of the algorithm
	 * @param {sigVal} signature value
     */
	this.verify = (data, puBkey = this.keysPair.public, sigVal = this.signHex, sigAlg = this.sigAlg) => {
		try {
			var msg = data;
			var sig = new KJUR.crypto.Signature({"alg": sigAlg});
			sig.init(puBkey);
			sig.updateString(data);
			return sig.verify(sigVal);
		} catch (e){
			console.log(e);
            return false;
		};
	};
	
	if (dataToSign !== undefined){
		this.signedData.data = dataToSign;
		this.signedData.pubkey = this.generateKeys();
		this.signedData.sign = this.signData();
	};
	
	return this;
};
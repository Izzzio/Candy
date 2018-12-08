/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author: Andrey Nedobylsky (admin@twister-vl.ru)
 */


const utils = {
    /**
     * convert hex number string to utf-16
     * @param str
     * @return {*}
     */
    hexString2Unicode: function (str) {

        if(str.length % 4 !== 0) {
            return false;
        }

        str = str.toLowerCase();
        let code = '';
        str = str.match(/.{1,4}/g);
        for (let s of str) {
            if(s.length === 4) {
                code += String.fromCharCode(parseInt(s, 16));
            } else {
                code += s;
            }
        }

        return code;
    },
    /**
     * convert utf-16 string to hex
     * @param uniStr
     * @return {string}
     */
    unicode2HexString: function (uniStr) {
        let str = '';
        for (let i = 0; i < uniStr.length; i++) {
            let charCode = uniStr.charCodeAt(i);
            if(charCode < 0x1000) {
                str += '0';
            }
            if(charCode < 0x100) {
                str += '0';
            }
            if(charCode < 0x10) {
                str += '0';
            }
            str += charCode.toString(16);
        }

        return str;
    }
};

if (this.window === undefined) {
    module.exports = utils;
}
/**
 iZ³ | Izzzio blockchain - https://izzz.io
 */

/**
 * Blockchain validators object
 * Provide list of validators and modules for checking blocks
 */


'use strict';

function NodeMetaInfo(config) {

    this.validators = config ? config.validators : [];
    this.modules = [];
    this.versions = {};
    this.messageBusAddress = config ? config.recieverAddress : '';

    /**
     * Parse input meta message
     * @param {NodeMetaInfo} nodeMetaInfo
     * @return {NodeMetaInfo}
     */
    this.parse = function(nodeMetaInfo){
        if(typeof nodeMetaInfo==='string'){
            try {
                nodeMetaInfo = JSON.parse(nodeMetaInfo);
            }catch (e) {
                return this;
            }
        }

        this.validators = nodeMetaInfo.validators;
        this.modules = nodeMetaInfo.modules;
        this.messageBusAddress = nodeMetaInfo.messageBusAddress;

        return this;
    }


    /**
     * add new module description
     * @param {object} moduleName
     * @param {string} version = '0.0'
     */
     this.addModule = (moduleName, version = '0.0') => {
        this.modules.push(moduleName);
        this.versions[moduleName] = version;
    }

    /**
     * delete information about module
     * @param {string} moduleName
     */
    this.deleteModule = (moduleName) => {
        if(this.modules.indexOf(moduleName) !== -1) {
            this.modules.splice(this.modules.indexOf(moduleName), 1);
            delete this.versions[moduleName];
        }
    }

    return this;
}


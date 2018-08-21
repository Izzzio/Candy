/**
 iZ³ | Izzzio blockchain - https://izzz.io
 */

/**
 * Blockchain validators object
 * Provide list of validators and modules for checking blocks
 */


'use strict';

let NodeMetaInfo = function NodeMetaInfo(config) {

    this.validators = config ? config.validators : [];
    this.modules = [];
    this.versions = {};
    this.messageBusAddress = config ? config.recieverAddress : '';

    /**
     * Parse input meta message
     * @param {NodeMetaInfo} nodeMetaInfo
     * @return {NodeMetaInfo}
     */
    this.parse = function (nodeMetaInfo){
        let info = {};
        if(typeof nodeMetaInfo==='string'){
            try {
                nodeMetaInfo = JSON.parse(nodeMetaInfo);
            } catch (e) {
                console.log(e);
                return info;
            }
        }

        if (nodeMetaInfo.hasOwnProperty('validators')){
            info.validators = this.validators = nodeMetaInfo.validators;
        }
        if (nodeMetaInfo.hasOwnProperty('modules')) {
            info.modules = this.modules = nodeMetaInfo.modules;
        }
        if (nodeMetaInfo.hasOwnProperty('versions')) {
            info.versions = this.versions = nodeMetaInfo.versions;
        }
        if (nodeMetaInfo.hasOwnProperty('messageBusAddress')) {
            info.messageBusAddress = this.messageBusAddress = nodeMetaInfo.messageBusAddress;
        }

        return info;
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


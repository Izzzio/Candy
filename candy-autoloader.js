/**
 * Candy autoloader
 * Autoloads resources from iZ³ blokchain
 * @Author: Andrey Nedobylsky
 */

'use strict';

function CandyAutoloader(candy, checkInterval) {
    let that = this;
    this.candy = candy;
    this._checkInterval = (typeof checkInterval === 'undefined' ? 1000 : checkInterval);

    /**
     * Starts watchdog timer on ready
     */
    this.onready = function () {
        setInterval(function () {
            that.checkForLoad();
        }, that._checkInterval);
    };

    /**
     * Watchdog timer action
     */
    this.checkForLoad = function () {
        that.imgAutoLoad();
    };

    /**
     * Load all Candy images
     */
    this.imgAutoLoad = function () {
        let imgs = document.querySelectorAll('img[data-candy]');
        imgs.forEach(function (img, index) {
            if(img.src === "" || img.src === img.getAttribute('data-candy') || img.naturalHeight === 0) {
                let url = img.getAttribute('data-candy');
                that.candy.request(url, null, function (err, data) {
                    if(!err) {
                        img.src = data;
                    }
                });
            }
        });
    };

    candy._autoloader = this;

    return this;
}

#Candy
**Vitamin blockchain connection provider for browsers**

####Summary

Candy provides connection with Vitamin blockchain platform based on WebSocket protocol.
Candy can load binary and text resources from blockchain. For example: Images, CSS, Scripts, Sounds and other data. 

By connecting to the blockchain, data is downloaded from the peer-to-peer network, reducing server overloading. By the way, you can completely upload site to the blockchain and load only proxy HTTP<->Vitamin page.


##Example

You can found complete example in ``demo.html``

* Just require candy.js script in page

``<script src="candy.js"></script>``

* Write connection code and attempt resource to loading

```javascript
var candy = new Candy(['ws://127.0.0.1:6001']).start();
candy.onready = function () {
  candy.loadResource(432, function (err, data) {
      document.getElementById('demoImage').src = data.candyData;
  });
};
```

##Documentation

**Created Candy object**

```javascript
var nodeList = ['ws://127.0.0.1:6001'];
var candy = new Candy(nodeList);
```

* nodeList - initial list of Vitamin nodes with protocol string ``ws://`` and port ``6001``

**Connection initialization and starting**

```javascript
candy.start();
```

* start() - return current Candy object instance

**OnReady event**

```javascript
candy.onready = function () {
    
}
```

* **Fires once.** _onready_ event works like document.onready. Event fires if Candy already connected to blockchain. 

**Loading resources**

```javascript
candy.loadResource(resourceId, function (err, data) {
  document.getElementById('demoImage').src = data.candyData;
});
```

* loadResource method loading resource from blockchain by resource id. At the moment resourceId is the index of the block which contain resource data.

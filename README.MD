![Candy logo](https://github.com/VitaminBlockchain/Candy/raw/master/logo.png)

# [Candy](https://github.com/VitaminBlockchain/Candy/fork)
[GtiHub](https://github.com/VitaminBlockchain/Candy/fork)

**Vitamin blockchain connection provider for browsers**

#### Summary

Candy provides connection with Vitamin blockchain platform based on WebSocket protocol.
Candy can load binary and text resources from blockchain. For example: Images, CSS, Scripts, Sounds and other data. 

By connecting to the blockchain, data is downloaded from the peer-to-peer network, reducing server overloading. By the way, you can completely upload site to the blockchain and load only proxy HTTP<->Vitamin page.


## Example

You can found complete example in ``demo.html``

* Just require candy.js script in page

``<script src="candy.js"></script>``

* Write connection code and attempt resource to loading

```javascript
var candy = new Candy(['ws://127.0.0.1:6001']).start();
candy.onready = function () {
    candy.request('candy://block/432', null, function (err, data) {
        document.getElementById('demoImage').src = data;
    });
};
```

## Documentation

**Creating Candy object**

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

You can load external resources by using request method with block url
```javascript
candy.request('candy://block/432', null, function (err, data) {
    document.getElementById('demoImage').src = data;
});
```
Block url requests data directly from blokchain block by id with url
`candy://block/resourceId`

Of course I'ts possible by old style method: 

```javascript
candy.loadResource(resourceId, function (err, data) {
    document.getElementById('demoImage').src = data.candyData;
});
```

* loadResource method loading resource from blockchain by resource id. At the moment resourceId is the index of the block which contain resource data.

where **data** is a blockchain block data field.

**Sending broadcast messages**

```javascript
candy.broadcastMessage(messageData, id, reciver, recepient);
```

* messageData - data for broadcasting
* id - message id, used only by reciver
* reciver - reciver string. Uses as destination adress
* recepient - sender "reciver" string. For backward messaging

**Candy Server Application requests**

Candy Server App (CSA) - is a Node.js or CGI application running on decided server.
CSA use Vitamin blockchain as communication level. Request to Candy Application very similar to jQuery ajax request.

**request** method provide simple interface for requesting CSA. I'ts uses special candy url syntax:

``
   candy://host-name/pathname?query=string&like_get=sring
``

For example we request page from FastCGI Candy Server Application (FCSA) with php-fpm backend:

```javascript
candy.request('candy://php/helloworld.php?get=parameter&inquery=string&z=123321', {structured: 'data','in':'JSON'}, function (err, data) {
    if(!err) {
        $('#phpRes').html(data);
    } else {
        console.log(err);
    }
});
```

This example load html data from **helloworld.php** script hosted on server with php alias.

Second param is data object like POST data. This syntax very similar to **jQuery.post** method.

For example see ``demoApp.html``

## Candy Autoloader

Candy Autoloader is a simple component that's monitoring page for unloaded candy resources and automatically load it.

For example we load html data from Candy Application Server with inline image code like

```html
<img data-candy="candy://php/static/logo.png" src="#">
```

Autoloader detects unloaded image with `data-candy` attribute and attempt to load from `php` named host.

Also you can use block format url for loading resources

```html
<img data-candy="candy://block/432" src="#">
```

**Using autoloader**

```javascript
    var candy = new Candy(['ws://localhost:6001']).start();
    var candyAutoloader = new CandyAutoloader(candy);
```
...and... that's all :)

## Contributing

1. Fork it ( [https://github.com/VitaminBlockchain/Candy/fork](https://github.com/VitaminBlockchain/Candy/fork) )
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create a new Pull Request

## Contributors

- [lailune](https://github.com/lailune) Andrey Nedobylsky - creator, maintainer
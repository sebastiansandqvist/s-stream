# s-stream

### Basic use

As a getter/setter

```javascript
var s = stream(5);
s(); // 5
s(3);
s(); // 3
```

Can be observed via `.map`

```javascript
var s = stream();

s.map(function(value) {
	// called once with value 'foo'
	// called once more with value 'bar'
});

s('foo');
s('bar');
```

Map is called immediately if initialized with any value

```javascript
var s = stream(123);
s.map(function(value) {
	// called with value 123
});
```

Including undefined

### Promises

Streams wait for promise to resolve

```javascript
var p = new Promise(function(resolve, reject) {
	setTimeout(function() {
		resolve('foo');
	}, 250);
});

var s = stream(p);

s.map(function(value) {
	// called after 250ms with value 'foo'
});
```

With error handling

```javascript
var p = new Promise(function(resolve, reject) {
	setTimeout(function() {
		reject(new Error('failed'));
	}, 250);
});

var s = stream(p);

s.map(function(value) {
	// never called
});

s.catch(function(err) {
	// called after 250ms with Error('failed');
});
```

### Preventing memory leaks

Listeners can be removed with `.off`

```javascript
var s = stream();
var f = function() {};
s.map(f);
s.off(f);
```
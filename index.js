
var isPromise = function(thing) {
	return Boolean(thing && thing.constructor && typeof thing.then === 'function' && typeof thing.catch === 'function');
};

var emit = function(stream) {
	var val = stream();
	stream.callbacks.forEach(function(callback) {
		callback(val);
	});
};

var handleError = function(stream) {
	return function(err) {
		stream.errorCallbacks.forEach(function(errCallback) {
			errCallback(err);
		});
	}
};

var stream = function(value) {
	
	var initWithPromise = isPromise(value);
	var hasValue = arguments.length > 0 && !initWithPromise;

	var s = function() {
		if (arguments.length > 0) {
			if (isPromise(arguments[0])) {
				arguments[0].then(s).catch(handleError(s));
			}
			else {
				value = arguments[0];
				hasValue = true;
				emit(s);
			}
		}
		return value;
	}

	s.callbacks = [];
	s.map = function(callback) {
		s.callbacks.push(callback);
		if (hasValue) { callback(value); }
		return s;
	}

	s.errorCallbacks = [];
	s.catch = function(errCallback) {
		s.errorCallbacks.push(errCallback);
		return s;
	}

	s.off = function(callback) {
		var index = s.callbacks.indexOf(callback);
		if (index > -1) { s.callbacks.splice(index, 1); }
		return s;
	}

	s.offRejection = function(errCallback) {
		var index = s.errorCallbacks.indexOf(errCallback);
		if (index > -1) { s.errorCallbacks.splice(index, 1); }
		return s;
	};

	if (initWithPromise) { s(value); }

	return s;

};

module.exports = stream;
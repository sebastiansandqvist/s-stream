var expect = require('chai').expect;
var stream = require('./index.js');

describe('stream', function() {

	describe('basics', function() {

		it('should initialize to undefined', function() {
			var s = stream();
			expect(s()).to.equal(undefined);
		});

		it('should initialize to passed value', function() {
			var s = stream(2);
			expect(s()).to.equal(2);
		});

		it('should update value', function() {
			var s = stream(1);
			s(3);
			expect(s()).to.equal(3);
		});

	});

	describe('.map / .off', function() {

		it('should add listeners', function() {
			var s = stream();
			s.map(function() {});
			s.map(function() {});
			expect(s.callbacks.length).to.equal(2);
		});

		it('should remove listeners', function() {
			var s = stream();
			var f = function() {};
			s.map(f);
			expect(s.callbacks.indexOf(f)).to.equal(0);
			s.map(function() {});
			s.off(f);
			expect(s.callbacks.length).to.equal(1);
			expect(s.callbacks.indexOf(f)).to.equal(-1);

		});

		it('should call listener on update', function(done) {
			var s = stream();
			var f = function(val) {
				expect(val).to.equal(10);
				done();
			}
			s.map(f);
			setTimeout(function() {
				s(10);
			}, 50);
		});

		it('should call listeners if updated to undefined', function(done) {
			var s = stream();
			var f = function(val) {
				expect(val).to.equal(undefined);
				done();
			}

			s.map(f);
			setTimeout(function() {
				s(undefined);
			}, 50);

		});

		it('should call listener immediately if there is a value', function(done) {
			var s = stream(123);
			var f = function(val) {
				expect(val).to.equal(123);
				done();
			}
			s.map(f);
		});

		it('should not call listener immediately if undefined', function() {
			var s = stream();
			var f = function(val) {
				throw new Error('should not be called');
			}
			s.map(f);
		});

		it('should call listener immediately if manually set to undefined', function(done) {
			var s = stream(undefined);
			var f = function(val) {
				expect(val).to.equal(undefined);
				done();
			}
			s.map(f);
		});

		it('should call multiple listeners', function(done) {
			var s = stream(9);
			var f1 = function(val) { expect(val).to.equal(9); }
			var f2 = function(val) {
				expect(val).to.equal(9);
				done();
			}
			s.map(f1);
			s.map(f2);
		});

		it('should not call removed listeners', function(done) {
			var s = stream();
			var f1 = function(val) { expect(val).to.equal(8); }
			var f2 = function(val) { throw new Error(val); }
			var f3 = function(val) {
				expect(val).to.equal(8);
				done();
			}
			s.map(f1);
			s.map(f2);
			s.map(f3);
			s.off(f2);
			s(8);
		});

		it('should call listeners multiple times', function() {
			var s = stream();
			var callcount = 0;
			var f1 = function(val) { expect(val).to.equal(callcount); }
			var f2 = function(val) { expect(val).to.equal(callcount); }
			s.map(f1);
			s.map(f2);
			s(0);
			callcount++;
			s(1);
			callcount++;
			s(2);
		});

	});

	describe('promise', function() {

		it('should wait until promise resolves to call', function(done) {
			var s = stream();
			var p = new Promise(function(resolve) {
				setTimeout(resolve, 50, 'promise test');
			});

			s.map(function(val) {
				expect(val).to.equal('promise test');
				done();
			});

			s(p);
		});

		it('should wait until promise resolves to call when initialized', function(done) {
			var p = new Promise(function(resolve) {
				setTimeout(resolve, 50, 'promise test 2');
			});
			var s = stream(p);

			s.map(function(val) {
				expect(val).to.equal('promise test 2');
				done();
			});
		});

		it('should call .catch when promise rejects', function(done) {
			var s = stream();
			var p = new Promise(function(resolve, reject) {
				setTimeout(reject, 50, 'rejection test');
			});

			s.map(function(val) {
				throw new Error('should not call map');
			});

			s.catch(function(err) {
				expect(err).to.equal('rejection test');
				done();
			})

			s(p);

		});

		it('should add rejection handlers', function() {
			var s = stream();
			s.catch(function() {});
			s.catch(function() {});
			expect(s.errorCallbacks.length).to.equal(2);
		});

		it('should remove rejection handlers', function() {
			var s = stream();
			var f1 = function() {};
			var f2 = function() {};
			s.catch(f1);
			s.catch(f2);
			s.offRejection(f1)
			expect(s.errorCallbacks.length).to.equal(1);
			s.offRejection(f2)
			expect(s.errorCallbacks.length).to.equal(0);
		});

	});

	describe('chaining', function() {

		it('should be chainable', function() {
			var s = stream('chain test');
			var f1 = function(val) {
				expect(val).to.equal('chain test');
			}
			var f2 = function(val) {
				expect(val).to.equal('chain test');
			}
			s.map(f1).map(f2).off(f1).off(f2);
		});

		it('should be chainable with promises', function(done) {

			var counter = 0;
			var s = stream(new Promise(function(resolve, reject) {
				setTimeout(function() {
					if (counter === 0) { resolve('resolved'); }
					else { reject('rejected'); }
				}, 50);
			}));

			var f1 = function(val) {
				expect(counter).to.equal(0);
				expect(val).to.equal('resolved');
			};

			var f2 = function(err) {
				expect(counter).to.equal(1);
				expect(err).to.equal('rejected');
				done();
			};

			s.map(f1).catch(f2).off(f1).offRejection(f2);
			counter++;
			s.map(f1).catch(f2);

		});

	});

});
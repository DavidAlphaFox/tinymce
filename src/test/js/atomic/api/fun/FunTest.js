import Fun from 'ephox/katamari/api/Fun';
import Jsc from '@ephox/wrap-jsverify';
import { UnitTest, assert } from '@ephox/refute';

UnitTest.test('Function tests', function() {
  var testSanity = function () {
    var add2 = function (n) {
      return n + 2;
    };

    var squared = function (n) {
      return n * n;
    };

    var add2squared = Fun.compose(squared, add2);

    var f0 = function () {
      return assert.eq(0, arguments.length);
    };
    Fun.noarg(f0)(1, 2, 3);

    assert.eq(16, add2squared(2));

    assert.eq(undefined, Fun.identity(undefined));
    assert.eq(10, Fun.identity(10));
    assert.eq([1, 2, 4], Fun.identity([1, 2, 4]));
    assert.eq({a: 'a', b: 'b'}, Fun.identity({a: 'a', b: 'b'}));

    assert.eq(undefined, Fun.constant()());
    assert.eq(10, Fun.constant(10)());
    assert.eq({a: 'a'}, Fun.constant({a: 'a'})());

    assert.eq(false, Fun.never());
    assert.eq(true, Fun.always());

    var c = function (/* arguments */) {
      return Array.prototype.slice.call(arguments, 0);
    };

    assert.eq([], Fun.curry(c)());
    assert.eq(['a'], Fun.curry(c, 'a')());
    assert.eq(['a', 'b'], Fun.curry(c, 'a')('b'));
    assert.eq(['a', 'b'], Fun.curry(c)('a', 'b'));
    assert.eq(['a', 'b', 'c'], Fun.curry(c)('a', 'b', 'c'));
    assert.eq(['a', 'b', 'c'], Fun.curry(c, 'a', 'b')('c'));

    assert.eq(false, Fun.not(function () { return true; })());
    assert.eq(true, Fun.not(function () { return false; })());

    assert.throws(Fun.die('Died!'));

    var called = false;
    var f = function () {
      called = true;
    };
    Fun.apply(f);
    assert.eq(true, called);
    called = false;
    Fun.apply(f);
    assert.eq(true, called);

  };

  var testSpecs = function () {
    Jsc.property('Check compose :: compose(f, g)(x) = f(g(x))', 'string', 'string -> string', 'string -> string', function (x, f, g) {
      var h = Fun.compose(f, g);
      return Jsc.eq(f(g(x)), h(x));
    });

    Jsc.property('Check constant :: constant(a)() === a', 'json', function (json) {
      return Jsc.eq(json, Fun.constant(json)());
    });

    Jsc.property('Check identity :: identity(a) === a', 'json', function (json) {
      return Jsc.eq(json, Fun.identity(json));
    });

    Jsc.property('Check always :: f(x) === true', 'json', function (json) {
      return Jsc.eq(true, Fun.always(json));
    });

    Jsc.property('Check never :: f(x) === false', 'json', function (json) {
      return Jsc.eq(false, Fun.never(json));
    });

    Jsc.property('Check curry :: curry(f, x)(y) = f(x, y)', Jsc.array(Jsc.json), Jsc.array(Jsc.json), function (extra1, extra2) {
      var f = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        return args;
      };

      var curried = Fun.curry.apply(undefined, [ f ].concat(extra1));
      var output = Fun.curry.apply(undefined, [ curried ].concat(extra2))();
      return Jsc.eq(extra1.concat(extra2), output);
    });

    Jsc.property('Check not :: not(f(x)) === !f(x)', Jsc.json, Jsc.fun(Jsc.bool), function (x, f) {
      var g = Fun.not(f);
      return Jsc.eq(f(x), !g(x));
    });

    Jsc.property('Check not :: not(not(f(x))) === f(x)', Jsc.json, Jsc.fun(Jsc.bool), function (x, f) {
      var g = Fun.not(Fun.not(f));
      return Jsc.eq(f(x), g(x));
    });

    Jsc.property('Check apply :: apply(constant(a)) === a', Jsc.json, function (x) {
      return Jsc.eq(x, Fun.apply(Fun.constant(x)));
    });

    Jsc.property('Check call :: apply(constant(a)) === undefined', Jsc.json, function (x) {
      var hack = null;
      var output = Fun.call(function () {
        hack = x;
      });

      return Jsc.eq(undefined, output) && Jsc.eq(x, hack);
    });
  };

  testSanity();
  testSpecs();
});


import Arr from 'ephox/katamari/api/Arr';
import Jsc from '@ephox/wrap-jsverify';
import { UnitTest, assert } from '@ephox/refute';

UnitTest.test('ArrSortTest', function() {
  var testSanity = function () {
    assert.eq([1, 2, 3], Arr.sort([1, 3, 2]));
  };

  testSanity();

  Jsc.property(
    'sort(sort(xs)) === sort(xs)', Jsc.array(Jsc.nat), function (arr) {
      var sorted = Arr.sort(arr);
      var resorted = Arr.sort(sorted);
      return Jsc.eq(sorted, resorted);
    }
  );
});


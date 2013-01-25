// Copyright (c) 2011 Google, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


/** 
 * @fileoverview Test valueRange and dateWindow changes.
 *
 * @author konigsberg@google.com (Robert Konigsberg)
 */
var ZERO_TO_FIFTY = [[ 10, 0 ] , [ 20, 50 ]];
var ZERO_TO_FIFTY_STEPS = function() {
  var a = [];
  var x = 10;
  var y = 0;
  var step = 0;
  for (step = 0; step <= 50; step++) {
    a.push([x + (step * .2), y + step]);
  }
  return a;
} ();
var FIVE_TO_ONE_THOUSAND = [
    [ 1, 10 ], [ 2, 20 ], [ 3, 30 ], [ 4, 40 ] , [ 5, 50 ], 
    [ 6, 60 ], [ 7, 70 ], [ 8, 80 ], [ 9, 90 ] , [ 10, 1000 ]];

var RangeTestCase = TestCase("range-tests");

RangeTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

RangeTestCase.prototype.createGraph = function(opts) {
  var graph = document.getElementById("graph");
  var g = new Dygraph(graph, ZERO_TO_FIFTY_STEPS, opts);

  assertEquals([10, 20], g.xAxisRange());
  assertEquals([0, 55], g.yAxisRange(0));

  return g;
};

/**
 * Test that changes to valueRange and dateWindow are reflected
 * appropriately.
 */
RangeTestCase.prototype.testRangeSetOperations = function() {
  var g = this.createGraph({valueRange : [ 0, 55 ]});

  g.updateOptions({ dateWindow : [ 12, 18 ] });
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([0, 55], g.yAxisRange(0));

  g.updateOptions({ valueRange : [ 10, 40 ] });
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([10, 40], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, NaN] });
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([10, 44.2], g.yAxisRange(0));

  g.updateOptions({ valueRange: [10, 40] });
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([10, 40], g.yAxisRange(0));

  g.updateOptions({  });
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([10, 40], g.yAxisRange(0));
  
  g.updateOptions({valueRange : null, axes: {y:{valueRange : [15, 20]}}});
  assertEquals([12, 18], g.xAxisRange());
  assertEquals([15, 20], g.yAxisRange(0));

  g.updateOptions({ dateWindow : null, valueRange : null, axes: null });
  assertEquals([10, 20], g.xAxisRange());
  assertEquals([0, 55], g.yAxisRange(0));
};

/**
 * Verify that when zoomed in by mouse operations, an empty call to
 * updateOptions doesn't change the displayed ranges.
 */
RangeTestCase.prototype.zoom = function(g, xRange, yRange) {
  var originalXRange = g.xAxisRange();
  var originalYRange = g.yAxisRange(0);

  DygraphOps.dispatchMouseDown(g, xRange[0], yRange[0]);
  DygraphOps.dispatchMouseMove(g, xRange[1], yRange[0]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, xRange[1], yRange[0]);

  assertEqualsDelta(xRange, g.xAxisRange(), 0.2);
  // assertEqualsDelta(originalYRange, g.yAxisRange(0), 0.2); // Not true, it's something in the middle.

  var midX = (xRange[1] - xRange[0]) / 2;
  DygraphOps.dispatchMouseDown(g, midX, yRange[0]);
  DygraphOps.dispatchMouseMove(g, midX, yRange[1]); // this is really necessary.
  DygraphOps.dispatchMouseUp(g, midX, yRange[1]);

  assertEqualsDelta(xRange, g.xAxisRange(), 0.2);
  assertEqualsDelta(yRange, g.yAxisRange(0), 0.2);
}


/**
 * Verify that when zoomed in by mouse operations, an empty call to
 * updateOptions doesn't change the displayed ranges.
 */
RangeTestCase.prototype.testEmptyUpdateOptions_doesntUnzoom = function() {
  var g = this.createGraph();
  this.zoom(g, [ 11, 18 ], [ 35, 40 ]);

  assertEqualsDelta([11, 18], g.xAxisRange(), 0.1);
  assertEqualsDelta([35, 40], g.yAxisRange(0), 0.2);

  g.updateOptions({});

  assertEqualsDelta([11, 18], g.xAxisRange(), 0.1);
  assertEqualsDelta([35, 40], g.yAxisRange(0), 0.2);
}

/**
 * Verify that when zoomed in by mouse operations, a call to
 * updateOptions({ dateWindow : null, valueRange : null }) fully
 * unzooms.
 */
RangeTestCase.prototype.testRestoreOriginalRanges_viaUpdateOptions = function() {
  var g = this.createGraph();
  this.zoom(g, [ 11, 18 ], [ 35, 40 ]);

  g.updateOptions({ dateWindow : null, valueRange : null });

  assertEquals([0, 55], g.yAxisRange(0));
  assertEquals([10, 20], g.xAxisRange());
}

/**
 * Verify that log scale axis range is properly specified.
 */
RangeTestCase.prototype.testLogScaleExcludesZero = function() {
  var g = new Dygraph("graph", FIVE_TO_ONE_THOUSAND, { logscale : true });
  assertEquals([10, 1099], g.yAxisRange(0));
 
  g.updateOptions({ logscale : false });
  assertEquals([0, 1099], g.yAxisRange(0));
}

/**
 * Verify that includeZero range is properly specified.
 */
RangeTestCase.prototype.testIncludeZeroIncludesZero = function() {
  var g = new Dygraph("graph", [[0, 500], [500, 1000]], { includeZero : true });
  assertEquals([0, 1100], g.yAxisRange(0));
 
  g.updateOptions({ includeZero : false });
  assertEquals([450, 1050], g.yAxisRange(0));
}


/**
 * Verify that includeZero range is properly specified per axis.
 */
RangeTestCase.prototype.testIncludeZeroPerAxis = function() {
  var g = new Dygraph("graph", 
    'X,A,B\n'+
    '0,50,50\n'+
    '50,110,110\n',
    {
      drawPoints: true,
      pointSize:5,
      series:{ 
        A: {
          axis: 'y',
          pointSize: 10
        },
        B: {
          axis: 'y2'
        }
      },  
      axes: {
        'y2': { includeZero: true }
      }
    });


  assertEquals([44, 116], g.yAxisRange(0));
  assertEquals([0, 121], g.yAxisRange(1));

  g.updateOptions({
    axes: {
      'y2': { includeZero: false }
    }
  });

  assertEquals([44, 116], g.yAxisRange(1));
}


/**
 * Verify that includeZero range is properly specified per axis with old axis options.
 */
RangeTestCase.prototype.testIncludeZeroPerAxisOld = function() {
  var g = new Dygraph("graph",
    'X,A,B\n' +
    '0,50,50\n' +
    '50,110,110\n',
    {
      drawPoints: true,
      pointSize: 5,
     
        A: {
          pointSize: 10
        },
        B: {
          axis: {}
        },
      axes: {
        'y': { includeZero: true },
        'y2': { includeZero: false }
      }
    });

  assertEquals([0, 121], g.yAxisRange(0));
  assertEquals([44, 116], g.yAxisRange(1));

  g.updateOptions({
    axes: {
      'y': { includeZero: false },
      'y2': { includeZero: true }
    }
  });

  assertEquals([44, 116], g.yAxisRange(0));
  assertEquals([0, 121], g.yAxisRange(1));
}

/**
 * Verify that very large Y ranges don't break things.
 */ 
RangeTestCase.prototype.testHugeRange = function() {
  var g = new Dygraph("graph", [[0, -1e120], [1, 1e230]], { includeZero : true });
  assertEqualsDelta(1, -1e229 / g.yAxisRange(0)[0], 0.001);
  assertEqualsDelta(1, 1.1e230 / g.yAxisRange(0)[1], 0.001);
}

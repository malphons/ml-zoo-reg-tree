/* ============================================================
   Extra Trees Regressor — Comparison data showing
   random vs optimized splits
   ============================================================ */
(function () {
    'use strict';

    var points = [];
    var rng = (function (s) {
        return function () { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    })(42);

    for (var i = 0; i < 40; i++) {
        var x = 0.25 + i * 9.5 / 39;
        var noise = (rng() - 0.5) * 2.0;
        var y = 2.0 * Math.sin(x * 0.8) + 0.35 * x + 2.0 + noise;
        points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }

    function meanY(pts, lo, hi) {
        var s = 0, c = 0;
        for (var i = 0; i < pts.length; i++) {
            if (pts[i].x >= lo && pts[i].x < hi) { s += pts[i].y; c++; }
        }
        return c > 0 ? Math.round((s / c) * 100) / 100 : 0;
    }

    function makeSegs(splits) {
        var bounds = [0].concat(splits).concat([10]);
        var segs = [];
        for (var i = 0; i < bounds.length - 1; i++) {
            segs.push({ xStart: bounds[i], xEnd: bounds[i + 1], y: meanY(points, bounds[i], bounds[i + 1]) });
        }
        return segs;
    }

    /* Best-split tree (like standard decision tree / RF): splits chosen to minimize MSE */
    var bestSplits = [2.68, 4.85, 7.60];
    var bestSegments = makeSegs(bestSplits);

    /* Random-split tree (Extra Trees style): thresholds drawn uniformly at random */
    var randomSplits = [1.95, 5.30, 8.10];
    var randomSegments = makeSegs(randomSplits);

    /* Ensemble of 5 random-split trees (ET ensemble) */
    var etTrees = [
        makeSegs([1.95, 5.30, 8.10]),
        makeSegs([2.40, 4.60, 7.20]),
        makeSegs([1.60, 5.80, 8.50]),
        makeSegs([2.80, 5.10, 7.80]),
        makeSegs([2.10, 4.90, 7.50])
    ];

    /* Compute ensemble average from N random-split trees */
    function computeEnsemble(nTrees) {
        var resolution = 100;
        var step = 10.0 / resolution;
        var segments = [];
        var prevY = null;
        var segStart = 0;

        for (var i = 0; i < resolution; i++) {
            var xMid = (i + 0.5) * step;
            var sum = 0;
            for (var t = 0; t < nTrees; t++) {
                var segs = etTrees[t];
                for (var s = 0; s < segs.length; s++) {
                    if (xMid >= segs[s].xStart && xMid < segs[s].xEnd) {
                        sum += segs[s].y;
                        break;
                    }
                }
            }
            var avgY = Math.round((sum / nTrees) * 100) / 100;
            if (prevY !== null && Math.abs(avgY - prevY) > 0.005) {
                segments.push({ xStart: segStart, xEnd: i * step, y: prevY });
                segStart = i * step;
            }
            prevY = avgY;
        }
        segments.push({ xStart: segStart, xEnd: 10, y: prevY });
        return segments;
    }

    function makePredictFn(segments) {
        return function (x) {
            for (var i = 0; i < segments.length; i++) {
                if (x >= segments[i].xStart && x < segments[i].xEnd) return segments[i].y;
            }
            return segments[segments.length - 1].y;
        };
    }

    window.MLZoo = window.MLZoo || {};
    window.MLZoo.modelData = {
        config: {
            xDomain: [0, 10],
            yDomain: [0, 8],
            xLabel: 'x',
            yLabel: 'y'
        },
        points: points,
        bestSplits: bestSplits,
        bestSegments: bestSegments,
        randomSplits: randomSplits,
        randomSegments: randomSegments,
        etTrees: etTrees,
        computeEnsemble: computeEnsemble,
        makePredictFn: makePredictFn
    };
})();

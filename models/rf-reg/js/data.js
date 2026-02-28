/* ============================================================
   Random Forest Regressor — Data with individual tree
   predictions and ensemble averages for n_estimators 1-5
   ============================================================ */
(function () {
    'use strict';

    /* Same nonlinear data as dt-reg */
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

    /* 5 individual tree step-function predictions (each depth=3, different bootstrap/feature subsets) */
    var treePredictions = [
        /* Tree 1 */
        [
            { xStart: 0, xEnd: 1.80, y: 3.15 },
            { xStart: 1.80, xEnd: 3.20, y: 4.62 },
            { xStart: 3.20, xEnd: 5.10, y: 4.05 },
            { xStart: 5.10, xEnd: 6.50, y: 3.80 },
            { xStart: 6.50, xEnd: 8.00, y: 4.52 },
            { xStart: 8.00, xEnd: 10, y: 5.30 }
        ],
        /* Tree 2 */
        [
            { xStart: 0, xEnd: 2.30, y: 3.58 },
            { xStart: 2.30, xEnd: 4.00, y: 4.70 },
            { xStart: 4.00, xEnd: 5.50, y: 3.65 },
            { xStart: 5.50, xEnd: 7.20, y: 4.10 },
            { xStart: 7.20, xEnd: 8.60, y: 4.85 },
            { xStart: 8.60, xEnd: 10, y: 5.50 }
        ],
        /* Tree 3 */
        [
            { xStart: 0, xEnd: 1.50, y: 2.90 },
            { xStart: 1.50, xEnd: 3.50, y: 4.45 },
            { xStart: 3.50, xEnd: 4.80, y: 4.20 },
            { xStart: 4.80, xEnd: 6.80, y: 3.55 },
            { xStart: 6.80, xEnd: 8.40, y: 4.90 },
            { xStart: 8.40, xEnd: 10, y: 5.15 }
        ],
        /* Tree 4 */
        [
            { xStart: 0, xEnd: 2.00, y: 3.40 },
            { xStart: 2.00, xEnd: 3.80, y: 4.55 },
            { xStart: 3.80, xEnd: 5.30, y: 3.90 },
            { xStart: 5.30, xEnd: 7.00, y: 4.25 },
            { xStart: 7.00, xEnd: 8.50, y: 4.65 },
            { xStart: 8.50, xEnd: 10, y: 5.40 }
        ],
        /* Tree 5 */
        [
            { xStart: 0, xEnd: 1.60, y: 3.05 },
            { xStart: 1.60, xEnd: 3.00, y: 4.80 },
            { xStart: 3.00, xEnd: 4.60, y: 4.30 },
            { xStart: 4.60, xEnd: 6.20, y: 3.45 },
            { xStart: 6.20, xEnd: 7.80, y: 4.70 },
            { xStart: 7.80, xEnd: 10, y: 5.25 }
        ]
    ];

    /* Compute ensemble average step function for first N trees */
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
                var segs = treePredictions[t];
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

    /* Prediction function from segments */
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
        treePredictions: treePredictions,
        computeEnsemble: computeEnsemble,
        makePredictFn: makePredictFn
    };
})();

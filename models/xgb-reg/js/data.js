/* ============================================================
   XGBoost Regressor — Boosting rounds data showing
   progressive refinement over 5 rounds
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

    var globalMean = 0;
    for (var i = 0; i < points.length; i++) globalMean += points[i].y;
    globalMean = globalMean / points.length;

    /*
     * Simulate gradient boosting rounds with learning_rate=0.3
     * Each round fits a shallow tree (depth 2) to the residuals,
     * then adds lr * tree_prediction to the cumulative prediction.
     */
    var lr = 0.3;

    /* Round predictions: each round's individual weak learner contribution */
    var roundSegments = [
        /* Round 1: shallow tree on initial residuals */
        [
            { xStart: 0, xEnd: 2.50, y: -0.60 },
            { xStart: 2.50, xEnd: 5.00, y: 0.85 },
            { xStart: 5.00, xEnd: 7.50, y: -0.40 },
            { xStart: 7.50, xEnd: 10, y: 1.20 }
        ],
        /* Round 2: fits remaining residual pattern */
        [
            { xStart: 0, xEnd: 2.00, y: -0.50 },
            { xStart: 2.00, xEnd: 4.20, y: 0.55 },
            { xStart: 4.20, xEnd: 6.00, y: -0.65 },
            { xStart: 6.00, xEnd: 8.30, y: 0.30 },
            { xStart: 8.30, xEnd: 10, y: 0.70 }
        ],
        /* Round 3 */
        [
            { xStart: 0, xEnd: 1.50, y: -0.40 },
            { xStart: 1.50, xEnd: 3.50, y: 0.45 },
            { xStart: 3.50, xEnd: 5.50, y: -0.30 },
            { xStart: 5.50, xEnd: 7.00, y: -0.25 },
            { xStart: 7.00, xEnd: 8.80, y: 0.50 },
            { xStart: 8.80, xEnd: 10, y: 0.35 }
        ],
        /* Round 4 */
        [
            { xStart: 0, xEnd: 1.80, y: -0.20 },
            { xStart: 1.80, xEnd: 3.00, y: 0.60 },
            { xStart: 3.00, xEnd: 4.50, y: -0.15 },
            { xStart: 4.50, xEnd: 6.30, y: -0.35 },
            { xStart: 6.30, xEnd: 8.00, y: 0.45 },
            { xStart: 8.00, xEnd: 10, y: 0.25 }
        ],
        /* Round 5 */
        [
            { xStart: 0, xEnd: 1.20, y: -0.30 },
            { xStart: 1.20, xEnd: 2.80, y: 0.35 },
            { xStart: 2.80, xEnd: 4.80, y: 0.10 },
            { xStart: 4.80, xEnd: 6.50, y: -0.20 },
            { xStart: 6.50, xEnd: 8.50, y: 0.15 },
            { xStart: 8.50, xEnd: 10, y: 0.30 }
        ]
    ];

    /* Helper: get prediction from segments */
    function segPredict(segments, x) {
        for (var i = 0; i < segments.length; i++) {
            if (x >= segments[i].xStart && x < segments[i].xEnd) return segments[i].y;
        }
        return segments[segments.length - 1].y;
    }

    /* Compute cumulative prediction after N rounds */
    function computeCumulative(nRounds) {
        var resolution = 200;
        var step = 10.0 / resolution;
        var segments = [];
        var prevY = null;
        var segStart = 0;

        for (var i = 0; i < resolution; i++) {
            var xMid = (i + 0.5) * step;
            var pred = globalMean;
            for (var r = 0; r < nRounds; r++) {
                pred += lr * segPredict(roundSegments[r], xMid);
            }
            var roundedY = Math.round(pred * 100) / 100;

            if (prevY !== null && Math.abs(roundedY - prevY) > 0.005) {
                segments.push({ xStart: segStart, xEnd: i * step, y: prevY });
                segStart = i * step;
            }
            prevY = roundedY;
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
        globalMean: Math.round(globalMean * 100) / 100,
        learningRate: lr,
        roundSegments: roundSegments,
        computeCumulative: computeCumulative,
        makePredictFn: makePredictFn
    };
})();

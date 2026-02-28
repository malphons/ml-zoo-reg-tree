/* ============================================================
   LightGBM Regressor — Boosting data with leaf-wise growth
   concept and learning rate comparison
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

    /* Boosting round corrections (leaf-wise style: more asymmetric splits) */
    var roundSegments = [
        /* Round 1 */
        [
            { xStart: 0, xEnd: 2.20, y: -0.55 },
            { xStart: 2.20, xEnd: 3.80, y: 0.90 },
            { xStart: 3.80, xEnd: 5.60, y: 0.15 },
            { xStart: 5.60, xEnd: 7.40, y: -0.30 },
            { xStart: 7.40, xEnd: 10, y: 1.10 }
        ],
        /* Round 2 */
        [
            { xStart: 0, xEnd: 1.60, y: -0.45 },
            { xStart: 1.60, xEnd: 3.20, y: 0.50 },
            { xStart: 3.20, xEnd: 4.50, y: -0.40 },
            { xStart: 4.50, xEnd: 6.80, y: -0.25 },
            { xStart: 6.80, xEnd: 8.50, y: 0.55 },
            { xStart: 8.50, xEnd: 10, y: 0.40 }
        ],
        /* Round 3 */
        [
            { xStart: 0, xEnd: 1.30, y: -0.35 },
            { xStart: 1.30, xEnd: 2.60, y: 0.40 },
            { xStart: 2.60, xEnd: 4.00, y: 0.10 },
            { xStart: 4.00, xEnd: 5.20, y: -0.50 },
            { xStart: 5.20, xEnd: 7.10, y: 0.05 },
            { xStart: 7.10, xEnd: 8.80, y: 0.35 },
            { xStart: 8.80, xEnd: 10, y: 0.20 }
        ],
        /* Round 4 */
        [
            { xStart: 0, xEnd: 1.50, y: -0.15 },
            { xStart: 1.50, xEnd: 2.80, y: 0.30 },
            { xStart: 2.80, xEnd: 3.60, y: -0.10 },
            { xStart: 3.60, xEnd: 5.00, y: -0.25 },
            { xStart: 5.00, xEnd: 6.50, y: 0.15 },
            { xStart: 6.50, xEnd: 8.20, y: 0.30 },
            { xStart: 8.20, xEnd: 10, y: 0.10 }
        ],
        /* Round 5 */
        [
            { xStart: 0, xEnd: 1.20, y: -0.20 },
            { xStart: 1.20, xEnd: 2.40, y: 0.25 },
            { xStart: 2.40, xEnd: 3.80, y: 0.05 },
            { xStart: 3.80, xEnd: 5.30, y: -0.15 },
            { xStart: 5.30, xEnd: 6.80, y: 0.10 },
            { xStart: 6.80, xEnd: 8.40, y: 0.20 },
            { xStart: 8.40, xEnd: 10, y: 0.15 }
        ]
    ];

    function segPredict(segments, x) {
        for (var i = 0; i < segments.length; i++) {
            if (x >= segments[i].xStart && x < segments[i].xEnd) return segments[i].y;
        }
        return segments[segments.length - 1].y;
    }

    /* Compute cumulative prediction with given learning rate */
    function computeCumulative(nRounds, lr) {
        lr = lr || 0.3;
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
        roundSegments: roundSegments,
        computeCumulative: computeCumulative,
        makePredictFn: makePredictFn
    };
})();

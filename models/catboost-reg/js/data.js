/* ============================================================
   CatBoost Regressor — Boosting data with symmetric trees
   ============================================================ */
(function () {
    'use strict';

    var points = [];
    var rng = (function (s) {
        return function () { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    })(55);

    for (var i = 0; i < 40; i++) {
        var x = 0.25 + i * 9.5 / 39;
        var noise = (rng() - 0.5) * 2.0;
        var y = 2.0 * Math.sin(x * 0.8) + 0.35 * x + 2.0 + noise;
        points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }

    var globalMean = 0;
    for (var i = 0; i < points.length; i++) globalMean += points[i].y;
    globalMean /= points.length;

    /* Symmetric tree predictions per round */
    var roundSegments = [
        [
            { xStart: 0, xEnd: 5.0, y: -0.5 },
            { xStart: 5.0, xEnd: 10, y: 0.5 }
        ],
        [
            { xStart: 0, xEnd: 2.5, y: -0.4 },
            { xStart: 2.5, xEnd: 5.0, y: 0.6 },
            { xStart: 5.0, xEnd: 7.5, y: -0.3 },
            { xStart: 7.5, xEnd: 10, y: 0.8 }
        ],
        [
            { xStart: 0, xEnd: 1.25, y: -0.35 },
            { xStart: 1.25, xEnd: 2.5, y: 0.2 },
            { xStart: 2.5, xEnd: 3.75, y: 0.45 },
            { xStart: 3.75, xEnd: 5.0, y: -0.15 },
            { xStart: 5.0, xEnd: 6.25, y: -0.25 },
            { xStart: 6.25, xEnd: 7.5, y: 0.1 },
            { xStart: 7.5, xEnd: 8.75, y: 0.4 },
            { xStart: 8.75, xEnd: 10, y: 0.2 }
        ],
        [
            { xStart: 0, xEnd: 1.25, y: -0.2 },
            { xStart: 1.25, xEnd: 2.5, y: 0.15 },
            { xStart: 2.5, xEnd: 3.75, y: 0.3 },
            { xStart: 3.75, xEnd: 5.0, y: -0.1 },
            { xStart: 5.0, xEnd: 6.25, y: -0.15 },
            { xStart: 6.25, xEnd: 7.5, y: 0.1 },
            { xStart: 7.5, xEnd: 8.75, y: 0.25 },
            { xStart: 8.75, xEnd: 10, y: 0.1 }
        ],
        [
            { xStart: 0, xEnd: 1.25, y: -0.12 },
            { xStart: 1.25, xEnd: 2.5, y: 0.08 },
            { xStart: 2.5, xEnd: 3.75, y: 0.18 },
            { xStart: 3.75, xEnd: 5.0, y: -0.08 },
            { xStart: 5.0, xEnd: 6.25, y: -0.1 },
            { xStart: 6.25, xEnd: 7.5, y: 0.05 },
            { xStart: 7.5, xEnd: 8.75, y: 0.15 },
            { xStart: 8.75, xEnd: 10, y: 0.08 }
        ]
    ];

    function segPredict(segments, x) {
        for (var i = 0; i < segments.length; i++) {
            if (x >= segments[i].xStart && x < segments[i].xEnd) return segments[i].y;
        }
        return segments[segments.length - 1].y;
    }

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
        config: { xDomain: [0, 10], yDomain: [0, 8], xLabel: 'x', yLabel: 'y' },
        points: points,
        globalMean: Math.round(globalMean * 100) / 100,
        roundSegments: roundSegments,
        computeCumulative: computeCumulative,
        makePredictFn: makePredictFn
    };
})();

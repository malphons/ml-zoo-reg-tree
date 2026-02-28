/* ============================================================
   AdaBoost Regressor — Sequential weak learner data
   ============================================================ */
(function () {
    'use strict';

    var points = [];
    var rng = (function (s) {
        return function () { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    })(99);

    for (var i = 0; i < 35; i++) {
        var x = 0.25 + i * 9.5 / 34;
        var noise = (rng() - 0.5) * 2.5;
        var y = 1.5 * Math.sin(x * 0.7) + 0.4 * x + 1.5 + noise;
        points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }

    var globalMean = 0;
    for (var i = 0; i < points.length; i++) globalMean += points[i].y;
    globalMean /= points.length;

    /* Weak learner stumps per round */
    var roundSegments = [
        [{ xStart: 0, xEnd: 4.5, y: -0.6 }, { xStart: 4.5, xEnd: 10, y: 0.45 }],
        [{ xStart: 0, xEnd: 2.5, y: 0.4 }, { xStart: 2.5, xEnd: 6.0, y: -0.35 }, { xStart: 6.0, xEnd: 10, y: 0.5 }],
        [{ xStart: 0, xEnd: 3.5, y: -0.2 }, { xStart: 3.5, xEnd: 7.0, y: 0.3 }, { xStart: 7.0, xEnd: 10, y: -0.15 }],
        [{ xStart: 0, xEnd: 1.8, y: 0.25 }, { xStart: 1.8, xEnd: 5.0, y: -0.2 }, { xStart: 5.0, xEnd: 8.0, y: 0.15 }, { xStart: 8.0, xEnd: 10, y: 0.3 }],
        [{ xStart: 0, xEnd: 2.0, y: -0.1 }, { xStart: 2.0, xEnd: 4.0, y: 0.2 }, { xStart: 4.0, xEnd: 6.5, y: -0.15 }, { xStart: 6.5, xEnd: 10, y: 0.18 }]
    ];

    var roundWeights = [1.0, 0.85, 0.7, 0.55, 0.4];

    function segPredict(segments, x) {
        for (var i = 0; i < segments.length; i++) {
            if (x >= segments[i].xStart && x < segments[i].xEnd) return segments[i].y;
        }
        return segments[segments.length - 1].y;
    }

    function computeCumulative(nRounds) {
        var resolution = 200;
        var step = 10.0 / resolution;
        var segments = [];
        var prevY = null;
        var segStart = 0;

        for (var i = 0; i < resolution; i++) {
            var xMid = (i + 0.5) * step;
            var pred = globalMean;
            var totalWeight = 0;
            for (var r = 0; r < nRounds; r++) {
                pred += roundWeights[r] * segPredict(roundSegments[r], xMid);
                totalWeight += roundWeights[r];
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
        config: { xDomain: [0, 10], yDomain: [-1, 8], xLabel: 'x', yLabel: 'y' },
        points: points,
        globalMean: Math.round(globalMean * 100) / 100,
        roundSegments: roundSegments,
        roundWeights: roundWeights,
        computeCumulative: computeCumulative,
        makePredictFn: makePredictFn
    };
})();

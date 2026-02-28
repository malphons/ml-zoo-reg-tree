/* ============================================================
   Decision Tree Regressor — Data & Splits for depths 1-4
   1D regression: y = sin(x) + 0.3*x + noise
   ============================================================ */
(function () {
    'use strict';

    /* Generate 40 data points with nonlinear pattern */
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

    /* Helper: compute mean y for points in [lo, hi) */
    function meanY(pts, lo, hi) {
        var s = 0, c = 0;
        for (var i = 0; i < pts.length; i++) {
            if (pts[i].x >= lo && pts[i].x < hi) { s += pts[i].y; c++; }
        }
        return c > 0 ? s / c : 0;
    }

    /* Pre-computed splits and segments for depths 1-4 */
    var depths = {};

    /* Depth 1: single split */
    depths[1] = {
        splits: [4.85],
        segments: [
            { xStart: 0, xEnd: 4.85, y: Math.round(meanY(points, 0, 4.85) * 100) / 100 },
            { xStart: 4.85, xEnd: 10, y: Math.round(meanY(points, 4.85, 10) * 100) / 100 }
        ],
        tree: {
            label: 'x < 4.85',
            children: [
                { value: Math.round(meanY(points, 0, 4.85) * 10) / 10 },
                { value: Math.round(meanY(points, 4.85, 10) * 10) / 10 }
            ]
        }
    };

    /* Depth 2: 3 splits -> 4 regions */
    depths[2] = {
        splits: [2.68, 4.85, 7.60],
        segments: [
            { xStart: 0, xEnd: 2.68, y: Math.round(meanY(points, 0, 2.68) * 100) / 100 },
            { xStart: 2.68, xEnd: 4.85, y: Math.round(meanY(points, 2.68, 4.85) * 100) / 100 },
            { xStart: 4.85, xEnd: 7.60, y: Math.round(meanY(points, 4.85, 7.60) * 100) / 100 },
            { xStart: 7.60, xEnd: 10, y: Math.round(meanY(points, 7.60, 10) * 100) / 100 }
        ],
        tree: {
            label: 'x < 4.85',
            children: [
                { label: 'x < 2.68', children: [
                    { value: Math.round(meanY(points, 0, 2.68) * 10) / 10 },
                    { value: Math.round(meanY(points, 2.68, 4.85) * 10) / 10 }
                ]},
                { label: 'x < 7.60', children: [
                    { value: Math.round(meanY(points, 4.85, 7.60) * 10) / 10 },
                    { value: Math.round(meanY(points, 7.60, 10) * 10) / 10 }
                ]}
            ]
        }
    };

    /* Depth 3: 7 splits -> 8 regions */
    depths[3] = {
        splits: [1.47, 2.68, 3.80, 4.85, 6.20, 7.60, 8.80],
        segments: [
            { xStart: 0, xEnd: 1.47, y: Math.round(meanY(points, 0, 1.47) * 100) / 100 },
            { xStart: 1.47, xEnd: 2.68, y: Math.round(meanY(points, 1.47, 2.68) * 100) / 100 },
            { xStart: 2.68, xEnd: 3.80, y: Math.round(meanY(points, 2.68, 3.80) * 100) / 100 },
            { xStart: 3.80, xEnd: 4.85, y: Math.round(meanY(points, 3.80, 4.85) * 100) / 100 },
            { xStart: 4.85, xEnd: 6.20, y: Math.round(meanY(points, 4.85, 6.20) * 100) / 100 },
            { xStart: 6.20, xEnd: 7.60, y: Math.round(meanY(points, 6.20, 7.60) * 100) / 100 },
            { xStart: 7.60, xEnd: 8.80, y: Math.round(meanY(points, 7.60, 8.80) * 100) / 100 },
            { xStart: 8.80, xEnd: 10, y: Math.round(meanY(points, 8.80, 10) * 100) / 100 }
        ],
        tree: {
            label: 'x < 4.85',
            children: [
                { label: 'x < 2.68', children: [
                    { label: 'x < 1.47', children: [
                        { value: Math.round(meanY(points, 0, 1.47) * 10) / 10 },
                        { value: Math.round(meanY(points, 1.47, 2.68) * 10) / 10 }
                    ]},
                    { label: 'x < 3.80', children: [
                        { value: Math.round(meanY(points, 2.68, 3.80) * 10) / 10 },
                        { value: Math.round(meanY(points, 3.80, 4.85) * 10) / 10 }
                    ]}
                ]},
                { label: 'x < 7.60', children: [
                    { label: 'x < 6.20', children: [
                        { value: Math.round(meanY(points, 4.85, 6.20) * 10) / 10 },
                        { value: Math.round(meanY(points, 6.20, 7.60) * 10) / 10 }
                    ]},
                    { label: 'x < 8.80', children: [
                        { value: Math.round(meanY(points, 7.60, 8.80) * 10) / 10 },
                        { value: Math.round(meanY(points, 8.80, 10) * 10) / 10 }
                    ]}
                ]}
            ]
        }
    };

    /* Depth 4: 15 splits -> 16 regions */
    var d4splits = [0.85, 1.47, 2.10, 2.68, 3.25, 3.80, 4.35, 4.85, 5.50, 6.20, 6.90, 7.60, 8.20, 8.80, 9.40];
    var d4segs = [];
    var bounds = [0].concat(d4splits).concat([10]);
    for (var k = 0; k < bounds.length - 1; k++) {
        d4segs.push({
            xStart: bounds[k],
            xEnd: bounds[k + 1],
            y: Math.round(meanY(points, bounds[k], bounds[k + 1]) * 100) / 100
        });
    }

    depths[4] = {
        splits: d4splits,
        segments: d4segs,
        tree: {
            label: 'x < 4.85',
            children: [
                { label: 'x < 2.68', children: [
                    { label: 'x < 1.47', children: [
                        { label: 'x < 0.85', children: [
                            { value: Math.round(meanY(points, 0, 0.85) * 10) / 10 },
                            { value: Math.round(meanY(points, 0.85, 1.47) * 10) / 10 }
                        ]},
                        { label: 'x < 2.10', children: [
                            { value: Math.round(meanY(points, 1.47, 2.10) * 10) / 10 },
                            { value: Math.round(meanY(points, 2.10, 2.68) * 10) / 10 }
                        ]}
                    ]},
                    { label: 'x < 3.80', children: [
                        { label: 'x < 3.25', children: [
                            { value: Math.round(meanY(points, 2.68, 3.25) * 10) / 10 },
                            { value: Math.round(meanY(points, 3.25, 3.80) * 10) / 10 }
                        ]},
                        { label: 'x < 4.35', children: [
                            { value: Math.round(meanY(points, 3.80, 4.35) * 10) / 10 },
                            { value: Math.round(meanY(points, 4.35, 4.85) * 10) / 10 }
                        ]}
                    ]}
                ]},
                { label: 'x < 7.60', children: [
                    { label: 'x < 6.20', children: [
                        { label: 'x < 5.50', children: [
                            { value: Math.round(meanY(points, 4.85, 5.50) * 10) / 10 },
                            { value: Math.round(meanY(points, 5.50, 6.20) * 10) / 10 }
                        ]},
                        { label: 'x < 6.90', children: [
                            { value: Math.round(meanY(points, 6.20, 6.90) * 10) / 10 },
                            { value: Math.round(meanY(points, 6.90, 7.60) * 10) / 10 }
                        ]}
                    ]},
                    { label: 'x < 8.80', children: [
                        { label: 'x < 8.20', children: [
                            { value: Math.round(meanY(points, 7.60, 8.20) * 10) / 10 },
                            { value: Math.round(meanY(points, 8.20, 8.80) * 10) / 10 }
                        ]},
                        { label: 'x < 9.40', children: [
                            { value: Math.round(meanY(points, 8.80, 9.40) * 10) / 10 },
                            { value: Math.round(meanY(points, 9.40, 10) * 10) / 10 }
                        ]}
                    ]}
                ]}
            ]
        }
    };

    /* Prediction function factory */
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
        depths: depths,
        makePredictFn: makePredictFn
    };
})();

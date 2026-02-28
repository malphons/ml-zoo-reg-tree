/* ============================================================
   ML Zoo — Shared 1D Regression Diagram for Tree Models
   Shows a 1D scatter plot (x, y) with piecewise-constant
   step-function predictions, split lines, residuals, and
   a mini tree structure diagram.
   ============================================================ */
(function () {
    'use strict';

    var svg, g, width, height, xScale, yScale, zoom;
    var config = {};
    var margin = { top: 20, right: 30, bottom: 45, left: 55 };

    var COLORS = {
        point: '#58a6ff',
        step: '#f0883e',
        split: '#e3b341',
        residual: '#f85149',
        ensemble: '#58a6ff',
        faded: 'rgba(88,166,255,0.25)',
        node: '#56d364',
        leaf: '#7ee787'
    };

    /* ---------- init ---------- */

    function init(containerSelector, cfg) {
        config = cfg || {};
        var container = document.querySelector(containerSelector);
        if (!container) return;

        width  = config.width  || container.clientWidth || 800;
        height = config.height || 400;

        svg = d3.select(containerSelector)
            .append('svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('max-height', height + 'px');

        svg.append('defs')
            .append('clipPath')
            .attr('id', 'plot-clip')
            .append('rect')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom);

        g = svg.append('g').attr('clip-path', 'url(#plot-clip)');

        var xDomain = config.xDomain || [0, 10];
        var yDomain = config.yDomain || [0, 10];

        xScale = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
        yScale = d3.scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

        /* Grid lines */
        var xGrid = svg.append('g')
            .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
            .call(d3.axisBottom(xScale).ticks(8).tickSize(-(height - margin.top - margin.bottom)).tickFormat(''));
        xGrid.attr('opacity', 0.08).select('.domain').remove();

        var yGrid = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',0)')
            .call(d3.axisLeft(yScale).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''));
        yGrid.attr('opacity', 0.08).select('.domain').remove();

        var axisColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#6e7681';

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
            .call(d3.axisBottom(xScale).ticks(8))
            .selectAll('text,line,path').attr('stroke', axisColor).attr('fill', axisColor);

        svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + margin.left + ',0)')
            .call(d3.axisLeft(yScale).ticks(6))
            .selectAll('text,line,path').attr('stroke', axisColor).attr('fill', axisColor);

        if (config.xLabel) {
            svg.append('text').attr('x', width / 2).attr('y', height - 5)
                .attr('text-anchor', 'middle').attr('fill', axisColor).attr('font-size', '12px')
                .text(config.xLabel);
        }
        if (config.yLabel) {
            svg.append('text').attr('x', -height / 2).attr('y', 15)
                .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
                .attr('fill', axisColor).attr('font-size', '12px').text(config.yLabel);
        }

        zoom = d3.zoom().scaleExtent([0.5, 5])
            .on('zoom', function (event) { g.attr('transform', event.transform); });
        svg.call(zoom);
    }

    /* ---------- drawPoints: scatter of (x, y) regression data ---------- */

    function drawPoints(points, opts) {
        opts = opts || {};
        var radius = opts.radius || 5;
        var color = opts.color || COLORS.point;

        g.selectAll('.data-point').remove();

        var pts = g.selectAll('.data-point')
            .data(points)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', function (d) { return xScale(d.x); })
            .attr('cy', function (d) { return yScale(d.y); })
            .attr('r', 0)
            .attr('fill', color)
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        pts.transition().duration(400).delay(function (d, i) { return i * 15; })
            .attr('r', radius);

        pts.on('mouseover', function (event, d) {
                d3.select(this).attr('r', radius + 3).attr('opacity', 1);
                showTooltip(event, d);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', radius).attr('opacity', 0.8);
                hideTooltip();
            });
    }

    /* ---------- drawStepFunction: piecewise-constant step function ---------- */

    function drawStepFunction(segments, opts) {
        opts = opts || {};
        var color = opts.color || COLORS.step;
        var strokeWidth = opts.strokeWidth || 2.5;
        var opacity = opts.opacity || 0.9;
        var cls = opts.className || 'step-line';

        g.selectAll('.' + cls).remove();

        segments.forEach(function (seg, idx) {
            /* Each segment: { xStart, xEnd, y } */
            var line = g.append('line')
                .attr('class', cls)
                .attr('x1', xScale(seg.xStart))
                .attr('y1', yScale(seg.y))
                .attr('x2', xScale(seg.xStart))
                .attr('y2', yScale(seg.y))
                .attr('stroke', color)
                .attr('stroke-width', strokeWidth)
                .attr('opacity', opacity);

            line.transition().duration(350).delay(idx * 80)
                .attr('x2', xScale(seg.xEnd));
        });
    }

    /* ---------- drawSplits: vertical split lines at partition boundaries ---------- */

    function drawSplits(splitValues, opts) {
        opts = opts || {};
        var color = opts.color || COLORS.split;
        var yDomain = config.yDomain || [0, 10];

        g.selectAll('.split-line').remove();

        splitValues.forEach(function (val, idx) {
            var line = g.append('line')
                .attr('class', 'split-line')
                .attr('x1', xScale(val))
                .attr('y1', yScale(yDomain[0]))
                .attr('x2', xScale(val))
                .attr('y2', yScale(yDomain[0]))
                .attr('stroke', color)
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '6 3')
                .attr('opacity', 0.7);

            line.transition().duration(400).delay(idx * 120)
                .attr('y2', yScale(yDomain[1]));
        });
    }

    /* ---------- drawResiduals: dashed lines from point to step prediction ---------- */

    function drawResiduals(points, predictFn, opts) {
        opts = opts || {};
        var color = opts.color || COLORS.residual;

        g.selectAll('.residual-line').remove();

        points.forEach(function (pt, idx) {
            var predY = predictFn(pt.x);
            g.append('line')
                .attr('class', 'residual-line')
                .attr('x1', xScale(pt.x))
                .attr('y1', yScale(pt.y))
                .attr('x2', xScale(pt.x))
                .attr('y2', yScale(pt.y))
                .attr('stroke', color)
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3 2')
                .attr('opacity', 0.6)
                .transition().duration(300).delay(idx * 10)
                .attr('y2', yScale(predY));
        });
    }

    /* ---------- drawTree: mini tree structure diagram ---------- */

    function drawTree(treeData, container, opts) {
        opts = opts || {};
        var treeWidth = opts.width || 300;
        var treeHeight = opts.height || 200;
        var color = opts.color || COLORS.node;

        var treeSvg = d3.select(container)
            .append('svg')
            .attr('viewBox', '0 0 ' + treeWidth + ' ' + treeHeight)
            .style('width', '100%')
            .style('max-height', treeHeight + 'px');

        var root = d3.hierarchy(treeData);
        var treeLayout = d3.tree().size([treeWidth - 40, treeHeight - 50]);
        treeLayout(root);

        /* Links */
        treeSvg.selectAll('.tree-link')
            .data(root.links())
            .enter()
            .append('line')
            .attr('class', 'tree-link')
            .attr('x1', function (d) { return d.source.x + 20; })
            .attr('y1', function (d) { return d.source.y + 25; })
            .attr('x2', function (d) { return d.target.x + 20; })
            .attr('y2', function (d) { return d.target.y + 25; })
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.5);

        /* Nodes */
        var nodes = treeSvg.selectAll('.tree-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('transform', function (d) { return 'translate(' + (d.x + 20) + ',' + (d.y + 25) + ')'; });

        nodes.append('circle')
            .attr('r', function (d) { return d.children ? 8 : 6; })
            .attr('fill', function (d) {
                if (!d.children) return COLORS.leaf;
                return color;
            })
            .attr('opacity', function (d) { return d.children ? 0.6 : 0.9; });

        nodes.filter(function (d) { return d.data.label; })
            .append('text')
            .attr('dy', -12)
            .attr('text-anchor', 'middle')
            .attr('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#6e7681')
            .attr('font-size', '9px')
            .text(function (d) { return d.data.label; });

        /* Leaf values */
        nodes.filter(function (d) { return !d.children && d.data.value !== undefined; })
            .append('text')
            .attr('dy', 16)
            .attr('text-anchor', 'middle')
            .attr('fill', COLORS.leaf)
            .attr('font-size', '8px')
            .text(function (d) { return d.data.value.toFixed(1); });
    }

    /* ---------- Tooltip ---------- */

    var tooltipEl = null;

    function showTooltip(event, d) {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.style.cssText = 'position:fixed;padding:6px 10px;background:rgba(0,0,0,.85);' +
                'color:#fff;font-size:12px;border-radius:4px;pointer-events:none;z-index:999;';
            document.body.appendChild(tooltipEl);
        }
        tooltipEl.textContent = 'x=' + d.x.toFixed(2) + ', y=' + d.y.toFixed(2);
        tooltipEl.style.left = event.clientX + 12 + 'px';
        tooltipEl.style.top = event.clientY - 28 + 'px';
        tooltipEl.style.display = 'block';
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    /* ---------- Clear & reset ---------- */

    function clear() {
        if (g) g.selectAll('.data-point,.step-line,.step-line-faded,.step-line-ensemble,.split-line,.residual-line').remove();
    }

    function resetZoom() {
        if (svg && zoom) svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    }

    /* ---------- Public API ---------- */

    window.MLZoo = window.MLZoo || {};
    window.MLZoo.diagram = {
        init: init,
        drawPoints: drawPoints,
        drawStepFunction: drawStepFunction,
        drawSplits: drawSplits,
        drawResiduals: drawResiduals,
        drawTree: drawTree,
        clear: clear,
        resetZoom: resetZoom,
        COLORS: COLORS,
        getScales: function () { return { x: xScale, y: yScale }; },
        getGroup: function () { return g; },
        getSvg: function () { return svg; }
    };
})();

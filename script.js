// ================================
// Big Five: Progress Bars + Zoom Snap Fix + Bell Curves (Me/Men/Women markers)
// Requires Plotly loaded before this script.
// Bell curve containers should look like:
// <div class="bellCurve" data-title="Industriousness" data-me="99" data-men="51" data-women="49"></div>
// Backward-compatible: data-percentile will be used as Me if data-me is missing.
// ================================

document.addEventListener('DOMContentLoaded', () => {
  // ----------------
  // Progress bars
  // ----------------
  const bars = document.querySelectorAll('.progress-bar, .progress-bar-men, .progress-bar-women');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const bar = entry.target;
      let fill = bar.querySelector('[class^="progress-fill"]');

      if (!fill) {
        fill = bar.querySelector('div[class*="progress-fill"]');
      }

      const rightLabel = bar.querySelector('.progress-label');
      const progress = parseInt(bar.dataset.progress, 10);

      if (!isNaN(progress)) {
        if (fill) {
          fill.style.width = `${progress}%`;
        }

        if (rightLabel) {
          rightLabel.textContent = `${progress}${getOrdinalSuffix(progress)}`;
        }
      }

      observer.unobserve(bar);
    });
  }, { threshold: 0.1 });

  bars.forEach(bar => observer.observe(bar));

  // ----------------
  // Zoom disables snap (mobile pinch)
  // ----------------
  (function () {
    const scroller =
      document.querySelector('.snap-wrap') ||
      document.querySelector('.scroll-sections') ||
      document.scrollingElement ||
      document.documentElement;

    const EPS = 0.01;

    function isZoomed() {
      return window.visualViewport
        ? Math.abs(window.visualViewport.scale - 1) > EPS
        : false;
    }

    function syncZoomState() {
      scroller.classList.toggle('zoomed', isZoomed());
    }

    syncZoomState();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncZoomState);
      window.visualViewport.addEventListener('scroll', syncZoomState);
    }

    window.addEventListener('resize', syncZoomState);
  })();

  // ----------------
  // Bell curves (lazy render on view)
  // ----------------
  const curves = document.querySelectorAll(".bellCurve");

  const curveObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      renderPercentileBellCurveAnimated(entry.target);
      curveObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  curves.forEach(c => curveObserver.observe(c));
});

function getOrdinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// -------------------------------
// CSS var helpers for marker colors
// -------------------------------
function cssVar(name, fallback = "") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function hexToRgb(hex) {
  const h = (hex || "").replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function rgbaFromCssVar(varName, a, fallbackHex = "#ffffff") {
  const hex = cssVar(varName, fallbackHex);
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(255,255,255,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

// ================================
// Bell curves for Big Five (percentiles 0..100) - animated like HEXACO
// Adds 3 markers: Me (me-2), Men (men-1), Women (women-1)
// ================================
function renderPercentileBellCurveAnimated(el) {
  if (!el || el.dataset.rendered === "1") return;

  if (typeof Plotly === "undefined") {
    console.error("Plotly not found. Include plotly script before script.js");
    return;
  }

  const title = el.dataset.title || "Score";

  // Backward compatible: if data-me missing, use data-percentile as Me.
  const meValue = parseFloat(el.dataset.me ?? el.dataset.percentile);
  const menValue = parseFloat(el.dataset.men);
  const womenValue = parseFloat(el.dataset.women);

  if (Number.isNaN(meValue)) return;

  // Normal curve as familiar visualization for percentiles
  const mean = 50;
  const stdDev = 15;

  const isMobile = window.innerWidth <= 768;
  const minX = 0, maxX = 100, steps = isMobile ? 260 : 1000;

  const x = [];
  const y = [];

  const inv = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  for (let i = 0; i <= steps; i++) {
    const xi = minX + ((maxX - minX) * i) / steps;
    x.push(xi);
    const z = (xi - mean) / stdDev;
    y.push(inv * Math.exp(-0.5 * z * z));
  }

  // Cache yMax once
  let yMax = 0;
  for (let i = 0; i < y.length; i++) if (y[i] > yMax) yMax = y[i];

  // Curve theme gradient (already working for you)
  const colorStops = [
    { x: 10, color: [140, 24, 10] },   // low tail
    { x: 50, color: [10, 126, 140] },  // center (teal)
    { x: 90, color: [140, 24, 10] }    // high tail
  ];

  function getColorForX(xVal) {
    for (let i = 0; i < colorStops.length - 1; i++) {
      const a = colorStops[i], b = colorStops[i + 1];
      if (xVal >= a.x && xVal <= b.x) {
        const t = (xVal - a.x) / (b.x - a.x);
        const r = Math.round(a.color[0] + t * (b.color[0] - a.color[0]));
        const g = Math.round(a.color[1] + t * (b.color[1] - a.color[1]));
        const bb = Math.round(a.color[2] + t * (b.color[2] - a.color[2]));
        return `rgb(${r},${g},${bb})`;
      }
    }
    if (xVal < colorStops[0].x) return `rgb(${colorStops[0].color.join(",")})`;
    return `rgb(${colorStops[colorStops.length - 1].color.join(",")})`;
  }

  // Build segmented traces so we can reveal curve over time
  const traces = [];
  const traceStarts = [];
  const segmentSize = 5;

  for (let i = 0; i < x.length; i += segmentSize) {
    const segX = x.slice(i, i + segmentSize + 1);
    if (segX.length < 2) continue;

    const mid = (segX[0] + segX[segX.length - 1]) / 2;
    const color = getColorForX(mid);

    traceStarts.push(i);
    traces.push({
      x: segX,
      y: new Array(segX.length).fill(0),
      fill: "tozeroy",
      type: "scatter",
      mode: "lines",
      line: { color, width: 3 }
    });
  }

  // Band labels (kept simple; you can color them later if desired)
  const bandAnnotations = isMobile
    ? [
        { x: 5,  text: "<10th",   yOffset: -50 },
        { x: 30, text: "10–50th", yOffset: -35 },
        { x: 70, text: "50–90th", yOffset: -35 },
        { x: 95, text: ">90th",   yOffset: -50 }
      ].map(a => ({
        x: a.x, y: 0, xref: "x", yref: "paper",
        text: a.text, showarrow: false,
        yshift: a.yOffset,
        font: { size: 12 },
        align: "center"
      }))
    : [
        { x: 5,  text: "<10th" },
        { x: 30, text: "10–50th" },
        { x: 70, text: "50–90th" },
        { x: 95, text: ">90th" }
      ].map(a => ({
        x: a.x, y: -0.14, xref: "x", yref: "paper",
        text: a.text, showarrow: false,
        font: { size: 12 },
        align: "center"
      }));

  // Marker colors from your CSS variables
  const ME_COLOR_0 = rgbaFromCssVar("--me-2", 0, "#7E8C0A");
  const MEN_COLOR_0 = rgbaFromCssVar("--men-1", 0, "#8C3A0A");
  const WOMEN_COLOR_0 = rgbaFromCssVar("--women-1", 0, "#8C0A7E");

  // Base (invisible) marker annotations; stagger y to reduce overlap
  const meAnnBase = {
    x: meValue, y: 1.06, xref: "x", yref: "paper",
    text: `Me: ${Math.round(meValue)}${getOrdinalSuffix(Math.round(meValue))}`,
    showarrow: false,
    font: { color: ME_COLOR_0, size: 13 },
    align: "center"
  };

  const menAnnBase = !Number.isNaN(menValue) ? {
    x: menValue, y: 1.02, xref: "x", yref: "paper",
    text: `Men: ${Math.round(menValue)}${getOrdinalSuffix(Math.round(menValue))}`,
    showarrow: false,
    font: { color: MEN_COLOR_0, size: 13 },
    align: "center"
  } : null;

  const womenAnnBase = !Number.isNaN(womenValue) ? {
    x: womenValue, y: 0.98, xref: "x", yref: "paper",
    text: `Women: ${Math.round(womenValue)}${getOrdinalSuffix(Math.round(womenValue))}`,
    showarrow: false,
    font: { color: WOMEN_COLOR_0, size: 13 },
    align: "center"
  } : null;

  // Animate curve from center out
  const meanIdx = x.findIndex(v => v >= mean);
  const maxStep = Math.max(meanIdx, x.length - meanIdx);

  const stepIncrement = isMobile ? 5 : 18;
  const frames = [];

  for (let step = 0; step <= maxStep; step += stepIncrement) {
    const progress = step / maxStep;
    const opacity = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.1);

    const frameData = traces.map((trace, tIdx) => {
      const newY = trace.y.slice();
      const start = traceStarts[tIdx];

      for (let idx = 0; idx < trace.x.length; idx++) {
        const xiIdx = start + idx;
        if (xiIdx >= meanIdx - step && xiIdx <= meanIdx + step) {
          newY[idx] = y[xiIdx];
        }
      }
      return { y: newY };
    });

    const shapes = [
      {
        type: "line",
        x0: meValue, x1: meValue,
        y0: 0, y1: yMax,
        line: { color: rgbaFromCssVar("--me-2", opacity, "#7E8C0A"), width: 3, dash: "dot", layer: "above" }
      }
    ];

    if (!Number.isNaN(menValue)) {
      shapes.push({
        type: "line",
        x0: menValue, x1: menValue,
        y0: 0, y1: yMax,
        line: { color: rgbaFromCssVar("--men-1", opacity, "#8C3A0A"), width: 3, dash: "dot", layer: "above" }
      });
    }

    if (!Number.isNaN(womenValue)) {
      shapes.push({
        type: "line",
        x0: womenValue, x1: womenValue,
        y0: 0, y1: yMax,
        line: { color: rgbaFromCssVar("--women-1", opacity, "#8C0A7E"), width: 3, dash: "dot", layer: "above" }
      });
    }

    const frameAnns = [
      ...bandAnnotations,
      { ...meAnnBase, font: { ...meAnnBase.font, color: rgbaFromCssVar("--me-2", opacity, "#7E8C0A") } }
    ];

    if (menAnnBase) {
      frameAnns.push({ ...menAnnBase, font: { ...menAnnBase.font, color: rgbaFromCssVar("--men-1", opacity, "#8C3A0A") } });
    }
    if (womenAnnBase) {
      frameAnns.push({ ...womenAnnBase, font: { ...womenAnnBase.font, color: rgbaFromCssVar("--women-1", opacity, "#8C0A7E") } });
    }

    frames.push({
      data: frameData,
      layout: {
        shapes,
        annotations: frameAnns
      }
    });
  }

  // Initial layout: invisible markers (opacity 0), curve starts at y=0 and is animated via frames
  const initialShapes = [
    {
      type: "line",
      x0: meValue, x1: meValue,
      y0: 0, y1: yMax,
      line: { color: rgbaFromCssVar("--me-2", 0, "#7E8C0A"), width: 3, dash: "dot" }
    }
  ];

  if (!Number.isNaN(menValue)) {
    initialShapes.push({
      type: "line",
      x0: menValue, x1: menValue,
      y0: 0, y1: yMax,
      line: { color: rgbaFromCssVar("--men-1", 0, "#8C3A0A"), width: 3, dash: "dash" }
    });
  }

  if (!Number.isNaN(womenValue)) {
    initialShapes.push({
      type: "line",
      x0: womenValue, x1: womenValue,
      y0: 0, y1: yMax,
      line: { color: rgbaFromCssVar("--women-1", 0, "#8C0A7E"), width: 3, dash: "dash" }
    });
  }

  const initialAnnotations = [...bandAnnotations, meAnnBase];
  if (menAnnBase) initialAnnotations.push(menAnnBase);
  if (womenAnnBase) initialAnnotations.push(womenAnnBase);

  const layout = {
    title: { text: title, font: { size: 18 } },
    xaxis: {
      title: { text: "Percentile (th)", standoff: 30 },
      range: [0, 100],
      zeroline: false,
      showgrid: false,
      tickvals: [0,10,20,30,40,50,60,70,80,90,100]
    },
    yaxis: {
      title: "Population Likelihood",
      showticklabels: false,
      zeroline: false,
      showgrid: false
    },
    showlegend: false,
    annotations: initialAnnotations,
    shapes: initialShapes,
    margin: {
      l: isMobile ? 20 : 70,
      r: isMobile ? 20 : 70,
      t: isMobile ? 60 : 80,
      b: isMobile ? 75 : 85
    },
    autosize: true
  };

  Plotly.newPlot(el, traces, layout, {
    displayModeBar: false,
    responsive: true
  }).then(() => {
    Plotly.animate(el, frames, {
      frame: { duration: 10, redraw: true },
      transition: { duration: 0 }
    });
  });

  el.dataset.rendered = "1";
}

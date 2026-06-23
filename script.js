// ================================
// Big Five: Progress Bars + Zoom Snap Fix + Bell Curves (Me/Men/Women markers)
// Requires Plotly loaded before this script.
// Bell curve containers should look like:
// <div class="bellCurve" data-title="Industriousness" data-me="99" data-men="51" data-women="49"></div>
// Backward-compatible: data-percentile will be used as Me if data-me is missing.
// ================================

document.addEventListener('DOMContentLoaded', () => {
  // ----------------
  // Comparison page — population averages from openness section
  // ----------------
  function syncComparisonAverages() {
    const source = document.getElementById('openness');
    const comparison = document.querySelector('.page--comparison');
    if (!source || !comparison) return;

    function setBar(bar, progress) {
      if (!bar || isNaN(progress)) return;
      bar.dataset.progress = String(progress);
      const label = bar.querySelector('.progress-label');
      if (label) label.textContent = `${progress}${getOrdinalSuffix(progress)}`;
    }

    ['men', 'women'].forEach((gender) => {
      const cls = gender === 'men' ? 'progress-bar-men' : 'progress-bar-women';
      const intellectSrc = source.querySelector(`.${cls}[data-trait="intellect"]`);
      const aestheticsSrc = source.querySelector(`.${cls}[data-trait="aesthetics"]`);
      const intellect = parseInt(intellectSrc?.dataset.progress, 10);
      const aesthetics = parseInt(aestheticsSrc?.dataset.progress, 10);

      setBar(comparison.querySelector(`.comparison-avg.${cls}[data-trait="intellect"]`), intellect);
      setBar(comparison.querySelector(`.comparison-avg.${cls}[data-trait="aesthetics"]`), aesthetics);

      if (!isNaN(intellect) && !isNaN(aesthetics)) {
        setBar(
          comparison.querySelector(`.comparison-avg.${cls}[data-trait="overall"]`),
          Math.round((intellect + aesthetics) / 2)
        );
      }
    });
  }

  syncComparisonAverages();

  function fillBar(bar) {
    if (!bar || bar.dataset.filled === '1') return;

    const fill =
      bar.querySelector('[class^="progress-fill"]') ||
      bar.querySelector('div[class*="progress-fill"]');
    const rightLabel = bar.querySelector('.progress-label');
    const progress = parseInt(bar.dataset.progress, 10);

    if (!isNaN(progress)) {
      if (fill) fill.style.width = `${progress}%`;
      if (rightLabel) {
        rightLabel.textContent = `${progress}${getOrdinalSuffix(progress)}`;
      }
    }

    bar.dataset.filled = '1';
  }

  // ----------------
  // Progress bars
  // ----------------
  const bars = document.querySelectorAll('.progress-bar, .progress-bar-men, .progress-bar-women');

    // Prefill duplicates: if the same trait + bar type appears again, fill instantly
  const seenBars = new Set();

  function barKey(bar) {
    const trait = bar.dataset.trait || "";          // you add this in HTML
    const progress = bar.dataset.progress || "";
    // Use the first class (progress-bar / progress-bar-men / progress-bar-women)
    const type = (bar.classList.contains("progress-bar-men") && "men") ||
                (bar.classList.contains("progress-bar-women") && "women") ||
                "me";
    return `${trait}|${type}|${progress}`;
  }

  bars.forEach(bar => {
    const key = barKey(bar);
    if (!key.startsWith("|")) { // only works when data-trait is present
      if (seenBars.has(key)) {
        const progress = parseInt(bar.dataset.progress, 10);
        if (!isNaN(progress)) {
          const fill =
            bar.querySelector('[class^="progress-fill"]') ||
            bar.querySelector('div[class*="progress-fill"]');

          if (fill) fill.style.width = `${progress}%`;

          const rightLabel = bar.querySelector('.progress-label');
          if (rightLabel) rightLabel.textContent = `${progress}${getOrdinalSuffix(progress)}`;

          bar.dataset.filled = "1";
        }
      } else {
        seenBars.add(key);
      }
    }
  });

  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      fillBar(entry.target);
      barObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  bars.forEach(bar => {
    if (bar.closest('.trait-panel')) return;
    barObserver.observe(bar);
  });

  // Trait panels: bars first, bell curves deferred so Plotly doesn't fight CSS transitions
  const PANEL_BAR_LEAD_MS = 0;
  const CHART_CARD_STAGGER_MS = 550;

  const panelObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const panel = entry.target;
      panelObserver.unobserve(panel);

      const overview = panel.querySelector('.trait-panel__overview');
      if (overview) {
        setTimeout(() => {
          overview.querySelectorAll('.progress-bar, .progress-bar-men, .progress-bar-women')
            .forEach(fillBar);
        }, PANEL_BAR_LEAD_MS);
      }

      [...panel.querySelectorAll('.chart-card')].forEach((card, cardIndex) => {
        const cardDelay = 500 + cardIndex * CHART_CARD_STAGGER_MS;

        setTimeout(() => {
          const curve = card.querySelector('.bellCurve');
          if (curve && curve.dataset.rendered !== '1') {
            renderPercentileBellCurveAnimated(curve);
          }
        }, cardDelay);
      });
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.trait-panel').forEach((panel) => panelObserver.observe(panel));
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

function computeLabelYPositions({
  meX,
  menX,
  womenX,
  baseY,
  xThreshold = 4,
  bump = 0.06,
  extraMe = 0.10
}) {
  const y = { me: baseY, men: baseY, women: baseY };

  const isNum = (v) => typeof v === "number" && Number.isFinite(v);

  const close = (a, b) => {
    if (!isNum(a) || !isNum(b)) return false;
    return Math.abs(a - b) < xThreshold;
  };

  const womenOverlaps = close(womenX, meX) || close(womenX, menX);

  if (menOverlaps) y.men = baseY + bump;
  if (womenOverlaps) y.women = baseY + bump * 1.8;

  // Me goes higher than others when it overlaps either one
  if (meOverlaps) y.me = baseY + bump + extraMe;

  return y;
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
  const isCompact = !!el.closest('.chart-card');
  const minX = 0, maxX = 100, steps = isMobile || isCompact ? 260 : 1000;

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

  // Bottom band beneath the plot (same dark tone as the curve area)
  const bandStripHeight = isCompact ? 0.18 : 0.14;
  const plotBg = '#0e1211';

  function makeBandStrip() {
    return {
      type: 'rect',
      xref: 'paper',
      yref: 'paper',
      x0: 0,
      x1: 1,
      y0: 0,
      y1: bandStripHeight,
      fillcolor: plotBg,
      line: { width: 0 },
      layer: 'below',
    };
  }

  function makeBandAnnotations() {
    const bands = [
      { x: 5, text: '<10th' },
      { x: 30, text: '10–50th' },
      { x: 70, text: '50–90th' },
      { x: 95, text: '>90th' },
    ];
    const bandY = bandStripHeight * 0.52;

    return bands.map((a) => ({
      x: a.x,
      y: bandY,
      xref: 'x',
      yref: 'paper',
      text: a.text,
      showarrow: false,
      font: { size: isCompact ? 10 : 11, color: '#8a9699' },
      align: 'center',
      cliponaxis: false,
    }));
  }

  const bandAnnotations = makeBandAnnotations();

  function makeTitleAnnotation() {
    if (!isCompact) return null;

    return {
      x: 0.03,
      y: 1,
      xref: 'paper',
      yref: 'paper',
      xanchor: 'left',
      yanchor: 'top',
      text: `<b>${title}</b>`,
      showarrow: false,
      font: { size: 12, color: '#ffffff' },
      align: 'left',
    };
  }

  const titleAnnotation = makeTitleAnnotation();

  const ME_COLOR = rgbaFromCssVar('--me-2', 1, '#7E8C0A');
  const MEN_COLOR = rgbaFromCssVar('--men-1', 1, '#8C3A0A');
  const WOMEN_COLOR = rgbaFromCssVar('--women-1', 1, '#8C0A7E');

  const X_OVERLAP_DESKTOP = 9.5;
  const X_OVERLAP_MOBILE = 19.5;
  const labelSize = isCompact ? 10 : 13;
  const markerBaseY = yMax * (isCompact ? 1.04 : 1.06);
  const markerBump = yMax * (isCompact ? 0.07 : 0.05);
  const markerExtraMe = yMax * (isCompact ? 0.11 : 0.09);

  const labelY = computeLabelYPositions({
    meX: meValue,
    menX: menValue,
    womenX: womenValue,
    baseY: markerBaseY,
    xThreshold: isCompact ? 11 : (isMobile ? X_OVERLAP_MOBILE : X_OVERLAP_DESKTOP),
    bump: markerBump,
    extraMe: markerExtraMe,
  });

  function markerAnnotation(base, color) {
    return {
      ...base,
      cliponaxis: false,
      font: { color, size: labelSize },
    };
  }

  const meAnnBase = {
    x: meValue,
    y: labelY.me,
    xref: 'x',
    yref: 'y',
    yanchor: 'bottom',
    text: `Me: ${Math.round(meValue)}${getOrdinalSuffix(Math.round(meValue))}`,
    showarrow: false,
    align: 'center',
  };

  const menAnnBase = !Number.isNaN(menValue) ? {
    x: menValue,
    y: labelY.men,
    xref: 'x',
    yref: 'y',
    yanchor: 'bottom',
    text: `Men: ${Math.round(menValue)}${getOrdinalSuffix(Math.round(menValue))}`,
    showarrow: false,
    align: 'center',
  } : null;

  const womenAnnBase = !Number.isNaN(womenValue) ? {
    x: womenValue,
    y: labelY.women,
    xref: 'x',
    yref: 'y',
    yanchor: 'bottom',
    text: `Women: ${Math.round(womenValue)}${getOrdinalSuffix(Math.round(womenValue))}`,
    showarrow: false,
    align: 'center',
  } : null;

  function makeMarkerLines(opacity = 1) {
    const lines = [{
      type: 'line',
      x0: meValue,
      x1: meValue,
      y0: 0,
      y1: yMax,
      line: {
        color: rgbaFromCssVar('--me-2', opacity, '#7E8C0A'),
        width: isCompact ? 2 : 3,
        dash: 'longdashdot',
        layer: 'above',
      },
    }];

    if (!Number.isNaN(menValue)) {
      lines.push({
        type: 'line',
        x0: menValue,
        x1: menValue,
        y0: 0,
        y1: yMax,
        line: {
          color: rgbaFromCssVar('--men-1', opacity, '#8C3A0A'),
          width: isCompact ? 2 : 3,
          dash: 'longdashdot',
          layer: 'above',
        },
      });
    }

    if (!Number.isNaN(womenValue)) {
      lines.push({
        type: 'line',
        x0: womenValue,
        x1: womenValue,
        y0: 0,
        y1: yMax,
        line: {
          color: rgbaFromCssVar('--women-1', opacity, '#8C0A7E'),
          width: isCompact ? 2 : 3,
          dash: 'longdashdot',
          layer: 'above',
        },
      });
    }

    return lines;
  }

  function makeMarkerAnnotations(opacity = 1) {
    const anns = [
      markerAnnotation(meAnnBase, rgbaFromCssVar('--me-2', opacity, '#7E8C0A')),
    ];

    if (menAnnBase) {
      anns.push(markerAnnotation(menAnnBase, rgbaFromCssVar('--men-1', opacity, '#8C3A0A')));
    }

    if (womenAnnBase) {
      anns.push(markerAnnotation(womenAnnBase, rgbaFromCssVar('--women-1', opacity, '#8C0A7E')));
    }

    return anns;
  }

  function allAnnotations(markerOpacity = 1) {
    const anns = [...bandAnnotations, ...makeMarkerAnnotations(markerOpacity)];
    if (titleAnnotation) anns.unshift(titleAnnotation);
    return anns;
  }

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

    const shapes = [makeBandStrip(), ...makeMarkerLines(opacity)];

    const frameAnns = allAnnotations(opacity);

    frames.push({
      data: frameData,
      layout: {
        shapes,
        annotations: frameAnns
      }
    });
  }

  const finalShapes = [makeBandStrip(), ...makeMarkerLines(1)];
  const finalAnnotations = allAnnotations(1);

  const layout = {
    title: isCompact
      ? undefined
      : {
          text: title,
          font: { size: 18, color: '#ffffff' },
          x: 0,
          xref: 'paper',
          xanchor: 'left',
        },
    paper_bgcolor: plotBg,
    plot_bgcolor: plotBg,
    xaxis: {
      title: isCompact ? undefined : { text: 'Percentile (th)', standoff: 30 },
      range: [0, 100],
      zeroline: false,
      showgrid: false,
      tickvals: isCompact ? [0, 25, 50, 75, 100] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      tickfont: { size: isCompact ? 10 : 12, color: '#8a9699' },
      tickcolor: '#3a4548',
      linecolor: '#3a4548',
    },
    yaxis: {
      title: isCompact ? undefined : 'Population Likelihood',
      domain: [bandStripHeight, 1],
      showticklabels: false,
      zeroline: false,
      showgrid: false,
    },
    showlegend: false,
    margin: isCompact
      ? { l: 28, r: 28, t: 28, b: 2 }
      : {
          l: isMobile ? 20 : 70,
          r: isMobile ? 20 : 70,
          t: isMobile ? 88 : 80,
          b: isMobile ? 8 : 12,
        },
    autosize: true,
  };

  function markCurveReady() {
    requestAnimationFrame(() => el.classList.add('is-ready'));
  }

  if (isCompact) {
    const staticTraces = traceStarts.map((start, tIdx) => ({
      ...traces[tIdx],
      y: traces[tIdx].x.map((_, idx) => y[start + idx])
    }));

    Plotly.newPlot(el, staticTraces, {
      ...layout,
      annotations: finalAnnotations,
      shapes: finalShapes
    }, {
      displayModeBar: false,
      responsive: true
    }).then(() => {
      Plotly.Plots.resize(el);
      markCurveReady();
    });

    el.dataset.rendered = "1";
    return;
  }

  const layoutAnimated = {
    ...layout,
    annotations: allAnnotations(0),
    shapes: [makeBandStrip(), ...makeMarkerLines(0)],
  };

  Plotly.newPlot(el, traces, layoutAnimated, {
    displayModeBar: false,
    responsive: true
  }).then(() => {
    Plotly.animate(el, frames, {
      frame: { duration: 16, redraw: true },
      transition: { duration: 0 }
    }).then(markCurveReady);
  });

  el.dataset.rendered = "1";
}

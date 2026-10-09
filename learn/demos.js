// Small, deterministic teaching models. All calculations run locally in the browser.
let instance = 0;
const colors = ['#267d68', '#c48730', '#8770b7'];
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, digits = 2) => Number.isFinite(n) ? Number(n).toFixed(digits) : 'n/a';
const sum = (values) => values.reduce((total, value) => total + value, 0);
const average = (values) => sum(values) / values.length;
const line = (x1, y1, x2, y2, options = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${options}/>`;
const label = (x, y, text, options = '') => `<text x="${x}" y="${y}" ${options}>${esc(text)}</text>`;
const dot = (x, y, r = 5, options = '') => `<circle cx="${x}" cy="${y}" r="${r}" ${options}/>`;
const path = (points, options = '') => `<path d="${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}" fill="none" ${options}/>`;
const grid = (x = 54, y = 26, width = 510, height = 230) => Array.from({ length: 6 }, (_, i) => line(x, y + height * i / 5, x + width, y + height * i / 5, 'class="lg-gridline"')).join('') + line(x, y, x, y + height, 'class="lg-axis"') + line(x, y + height, x + width, y + height, 'class="lg-axis"');

function shell(container, reducedMotion) {
  const abort = new AbortController();
  const id = `lg-demo-${++instance}`;
  container.innerHTML = `<section class="lg-demo${reducedMotion ? ' lg-demo-static' : ''}"><div class="lg-demo-controls"></div><div class="lg-demo-stage"></div><div class="lg-demo-readout" role="status" aria-live="polite" aria-atomic="true"></div><p class="lg-demo-caption"></p></section>`;
  const root = container.firstElementChild;
  const controls = root.querySelector('.lg-demo-controls');
  const stage = root.querySelector('.lg-demo-stage');
  const readout = root.querySelector('.lg-demo-readout');
  const caption = root.querySelector('.lg-demo-caption');
  let count = 0;
  const listen = (element, event, fn) => element.addEventListener(event, fn, { signal: abort.signal });
  return {
    id, root,
    range(name, min, max, step, value, onChange, format = (v) => fmt(v)) {
      const controlId = `${id}-control-${++count}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'lg-demo-control';
      wrapper.innerHTML = `<label for="${controlId}">${esc(name)} <output for="${controlId}">${esc(format(value))}</output></label><input id="${controlId}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
      const input = wrapper.querySelector('input');
      const output = wrapper.querySelector('output');
      listen(input, 'input', () => { output.textContent = format(Number(input.value)); onChange(Number(input.value)); });
      controls.append(wrapper);
      return input;
    },
    select(name, options, value, onChange) {
      const controlId = `${id}-control-${++count}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'lg-demo-control';
      wrapper.innerHTML = `<label for="${controlId}">${esc(name)}</label><select id="${controlId}">${options.map(([v, text]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(text)}</option>`).join('')}</select>`;
      const input = wrapper.querySelector('select');
      listen(input, 'change', () => onChange(input.value));
      controls.append(wrapper);
      return input;
    },
    button(name, onClick, secondary = false) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `lg-demo-button${secondary ? ' lg-demo-button-secondary' : ''}`;
      button.textContent = name;
      listen(button, 'click', onClick);
      controls.append(button);
      return button;
    },
    render(markup, summary, stats, note) {
      stage.innerHTML = `<svg viewBox="0 0 600 300" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">Interactive concept illustration</title><desc id="${id}-desc">${esc(summary)}</desc>${markup}</svg>`;
      readout.innerHTML = stats.map(([name, value]) => `<div><span>${esc(name)}</span><strong>${esc(value)}</strong></div>`).join('');
      caption.textContent = note;
    },
    cleanup() { abort.abort(); container.replaceChildren(); },
  };
}

function regression(ui) {
  const data = [[1, 2.1], [2, 2.8], [3, 4.2], [4, 4.6], [5, 6.2], [6, 6.5], [7, 8.0], [8, 8.2], [9, 10.1]];
  let slope = 0.7, intercept = 1.5;
  const x = (v) => 54 + v * 51;
  const y = (v) => 256 - v * 15.33;
  function render() {
    const mse = average(data.map(([a, b]) => (slope * a + intercept - b) ** 2));
    const residuals = data.map(([a, b]) => line(x(a), y(b), x(a), y(slope * a + intercept), 'stroke="#c48730" stroke-width="2" stroke-dasharray="4 4"') + dot(x(a), y(b), 6, 'fill="#267d68" stroke="#fffdf6" stroke-width="2"')).join('');
    ui.render(grid() + residuals + line(x(0), y(intercept), x(10), y(slope * 10 + intercept), 'stroke="#8770b7" stroke-width="3"') + label(54, 282, '0') + label(550, 282, 'x = 10') + label(14, 30, '15') + label(20, 257, '0') + label(370, 24, 'points = observed values'), `Line slope ${fmt(slope)}, intercept ${fmt(intercept)}, mean squared error ${fmt(mse)}. Dashed lines connect predictions to observations.`, [['Slope', fmt(slope)], ['Intercept', fmt(intercept)], ['Mean squared error', fmt(mse, 3)]], 'Move the line closer to the points. Squaring residuals makes large errors count more strongly.');
  }
  ui.range('Slope', 0, 1.2, 0.02, slope, (v) => { slope = v; render(); });
  ui.range('Intercept', 0, 3, 0.05, intercept, (v) => { intercept = v; render(); });
  render();
}

function gradient(ui) {
  let rate = 0.2, w = -2, history = [w];
  function render() {
    const minimum = Math.min(-3, ...history) - 0.5;
    const maximum = Math.max(8, ...history) + 0.5;
    const maximumLoss = Math.max((minimum - 3) ** 2, (maximum - 3) ** 2);
    const x = (v) => 54 + (v - minimum) / (maximum - minimum) * 510;
    const y = (v) => 256 - v / maximumLoss * 224;
    const curve = Array.from({ length: 121 }, (_, i) => { const v = minimum + (maximum - minimum) * i / 120; return [x(v), y((v - 3) ** 2)]; });
    const points = history.map((v) => [x(v), y((v - 3) ** 2)]);
    const stopped = history.length > 30 || Math.abs(w) > 100000;
    step.disabled = stopped;
    ui.render(grid() + path(curve, 'stroke="#267d68" stroke-width="3"') + path(points, 'stroke="#c48730" stroke-width="2" stroke-dasharray="5 4"') + points.map(([px, py], i) => dot(px, py, i === points.length - 1 ? 7 : 3, `fill="${i === points.length - 1 ? '#c48730' : '#8770b7'}"`)).join('') + label(x(3), 282, 'minimum: w = 3', 'text-anchor="middle"') + label(54, 20, 'L(w) = (w − 3)²') + label(390, 20, `step ${history.length - 1}`), `At step ${history.length - 1}, w is ${fmt(w, 3)} and loss is ${fmt((w - 3) ** 2, 3)}. Learning rate is ${fmt(rate)}.`, [['Parameter w', fmt(w, 3)], ['Loss', fmt((w - 3) ** 2, 3)], ['Gradient', fmt(2 * (w - 3), 3)]], stopped ? 'The demonstration stops after 30 steps or a large divergence. Reset to try another learning rate.' : rate >= 1 ? 'At rate 1 this quadratic oscillates. Above 1, each error grows. The plot rescales to keep every step visible.' : 'Each click applies w ← w − learning rate × 2(w − 3). Try 0.5 to reach the minimum in one step.');
  }
  ui.range('Learning rate', 0.05, 1.2, 0.05, rate, (v) => { rate = v; render(); });
  const step = ui.button('Take one step', () => { w -= rate * 2 * (w - 3); history.push(w); render(); });
  ui.button('Reset', () => { w = -2; history = [w]; render(); }, true);
  render();
}

function classification(ui) {
  const data = [{ score: 0.08, yes: false }, { score: 0.18, yes: false }, { score: 0.27, yes: true }, { score: 0.34, yes: false }, { score: 0.43, yes: true }, { score: 0.48, yes: false }, { score: 0.56, yes: true }, { score: 0.63, yes: false }, { score: 0.72, yes: true }, { score: 0.79, yes: false }, { score: 0.87, yes: true }, { score: 0.95, yes: true }];
  let threshold = 0.5;
  function render() {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    data.forEach(({ score, yes }) => { if (score >= threshold) { if (yes) tp++; else fp++; } else if (yes) fn++; else tn++; });
    const precision = tp + fp ? tp / (tp + fp) : NaN;
    const recall = tp / (tp + fn);
    const f1 = 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : NaN;
    const x = (v) => 70 + v * 465;
    const boundary = x(threshold);
    let markup = `<rect x="70" y="48" width="465" height="154" rx="14" fill="#eee9dd"/><rect x="${boundary}" y="48" width="${535 - boundary}" height="154" fill="#dcebe1"/>`;
    markup += line(boundary, 40, boundary, 210, 'stroke="#8770b7" stroke-width="3" stroke-dasharray="5 4"');
    markup += label(70, 25, 'ACTUAL POSITIVES: GOLD') + label(332, 25, 'ACTUAL NEGATIVES: GREEN');
    markup += data.map(({ score, yes }) => dot(x(score), yes ? 94 : 160, 8, `fill="${yes ? '#c48730' : '#267d68'}" stroke="#fffdf6" stroke-width="2"`) + label(x(score), yes ? 118 : 184, fmt(score), 'text-anchor="middle" font-size="11"')).join('');
    markup += label(70, 230, '0') + label(535, 230, '1', 'text-anchor="end"') + label(300, 251, 'Score ≥ threshold → predict positive', 'text-anchor="middle"') + label(300, 280, `TP ${tp}    FP ${fp}    TN ${tn}    FN ${fn}`, 'text-anchor="middle"');
    ui.render(markup, `At threshold ${fmt(threshold)}: ${tp} true positives, ${fp} false positives, ${tn} true negatives and ${fn} false negatives. Precision ${fmt(precision)}, recall ${fmt(recall)}, F1 ${fmt(f1)}.`, [['Precision', Number.isFinite(precision) ? `${fmt(100 * precision, 0)}%` : 'n/a'], ['Recall', `${fmt(100 * recall, 0)}%`], ['F1 score', fmt(f1)]], 'Lower thresholds catch more positives but may create more false alarms. The underlying scores stay fixed.');
  }
  ui.range('Decision threshold', 0, 1, 0.01, threshold, (v) => { threshold = v; render(); });
  render();
}

function clustering(ui) {
  const points = [[1, 1.5], [1.8, 2.2], [2.5, 1.3], [2, 3.1], [3, 2.3], [1.1, 3.5], [3.1, 3.6], [5.5, 7.1], [6.1, 8.3], [7, 7.3], [7.4, 8.8], [5.3, 8.8], [6.3, 6.4], [8, 7.5], [7.8, 2.2], [8.9, 2.9], [9.1, 1.2], [7.1, 1.1], [8.1, 4], [6.9, 3], [9.3, 4]];
  const initial = [[2, 6], [4, 4], [6, 2]];
  let centers = initial.map((p) => [...p]), rounds = 0, converged = false;
  const distance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const assign = () => points.map((p) => { const ds = centers.map((c) => distance(p, c)); return ds.indexOf(Math.min(...ds)); });
  let assignments = assign();
  function render() {
    const x = (v) => 54 + v * 51, y = (v) => 256 - v * 23;
    const cost = sum(points.map((p, i) => distance(p, centers[assignments[i]])));
    const markup = grid() + points.map((p, i) => line(x(p[0]), y(p[1]), x(centers[assignments[i]][0]), y(centers[assignments[i]][1]), `stroke="${colors[assignments[i]]}" opacity="0.2"`) + dot(x(p[0]), y(p[1]), 6, `fill="${colors[assignments[i]]}"`)).join('') + centers.map((p, i) => `<rect x="${x(p[0]) - 9}" y="${y(p[1]) - 9}" width="18" height="18" rx="3" fill="${colors[i]}" stroke="#fffdf6" stroke-width="3"/>` + label(x(p[0]), y(p[1]) - 15, `C${i + 1}`, 'text-anchor="middle"')).join('') + label(54, 283, 'Circles: samples') + label(368, 283, 'Squares: cluster centers');
    next.disabled = converged;
    ui.render(markup, `K-means with three clusters, ${rounds} completed iterations. Within-cluster sum of squared distances is ${fmt(cost)}. ${converged ? 'Centers have converged.' : 'Ready for another assignment and center update.'}`, [['Clusters', '3'], ['Iterations', rounds], ['Squared-distance cost', fmt(cost)]], converged ? 'The centers stopped moving for this initialization. A different starting point can converge to a different solution.' : 'One iteration assigns every point to its nearest center, then moves each center to its cluster mean.');
  }
  const next = ui.button('Run one iteration', () => {
    assignments = assign();
    const updated = centers.map((center, k) => { const group = points.filter((_, i) => assignments[i] === k); return group.length ? [average(group.map((p) => p[0])), average(group.map((p) => p[1]))] : center; });
    converged = updated.every((center, i) => distance(center, centers[i]) < 1e-10);
    centers = updated; rounds++; render();
  });
  ui.button('Reset centers', () => { centers = initial.map((p) => [...p]); rounds = 0; converged = false; assignments = assign(); render(); }, true);
  render();
}

function solve(matrix, target) {
  const a = matrix.map((row, i) => [...row, target[i]]);
  const n = target.length;
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    [a[c], a[pivot]] = [a[pivot], a[c]];
    const scale = a[c][c];
    if (Math.abs(scale) < 1e-15) return Array(n).fill(0);
    for (let j = c; j <= n; j++) a[c][j] /= scale;
    for (let r = 0; r < n; r++) if (r !== c) {
      const factor = a[r][c];
      for (let j = c; j <= n; j++) a[r][j] -= factor * a[c][j];
    }
  }
  return a.map((row) => row[n]);
}

function overfit(ui) {
  const truth = (x) => 1.1 * Math.sin(2.6 * x) + 0.25 * x;
  const train = Array.from({ length: 12 }, (_, i) => { const x = -0.95 + i * 1.9 / 11; return [x, truth(x) + 0.32 * Math.sin(i * 8.1 + 1)]; });
  const validation = Array.from({ length: 30 }, (_, i) => { const x = -1 + i * 2 / 29; return [x, truth(x) + 0.15 * Math.cos(i * 5.3)]; });
  let degree = 3;
  function render() {
    const n = degree + 1;
    const matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => sum(train.map(([x]) => x ** (i + j))) + (i === j ? 1e-9 : 0)));
    const target = Array.from({ length: n }, (_, i) => sum(train.map(([x, y]) => x ** i * y)));
    const weights = solve(matrix, target);
    const predict = (x) => sum(weights.map((w, i) => w * x ** i));
    const error = (data) => average(data.map(([x, y]) => (predict(x) - y) ** 2));
    const x = (v) => 54 + (v + 1) * 255, y = (v) => 142 - v * 57;
    const curve = Array.from({ length: 201 }, (_, i) => { const v = -1 + i / 100; return [x(v), y(predict(v))]; });
    const clip = `${ui.id}-plot-clip`;
    const markup = `<defs><clipPath id="${clip}"><rect x="54" y="26" width="510" height="230"/></clipPath></defs>` + grid() + `<g clip-path="url(#${clip})">` + validation.map(([a, b]) => dot(x(a), y(b), 4, 'fill="none" stroke="#c48730" stroke-width="1.7"')).join('') + path(curve, 'stroke="#8770b7" stroke-width="3"') + train.map(([a, b]) => dot(x(a), y(b), 5, 'fill="#267d68" stroke="#fffdf6" stroke-width="1.5"')).join('') + '</g>' + label(54, 280, '● training points', 'fill="#267d68"') + label(305, 280, '○ held-out points', 'fill="#956422"') + label(54, 19, `Polynomial degree ${degree}`);
    ui.render(markup, `A degree ${degree} polynomial has training mean squared error ${fmt(error(train), 4)} and held-out mean squared error ${fmt(error(validation), 4)}.`, [['Degree', degree], ['Training MSE', fmt(error(train), 4)], ['Holdout MSE', fmt(error(validation), 4)]], 'Both datasets contain fixed noise around the same hidden curve. Very flexible polynomials can fit the training noise; parts outside the plot are clipped, but the error uses all values.');
  }
  ui.range('Polynomial degree', 1, 10, 1, degree, (v) => { degree = v; render(); }, (v) => String(v));
  render();
}

function network(ui) {
  let x1 = 0.6, x2 = -0.2, activation = 'relu';
  const weights = [[0.9, -0.5], [-0.4, 0.8], [0.6, 0.6]], biases = [0.1, 0.2, -0.3], outgoing = [0.7, -0.4, 0.8];
  function render() {
    const z = weights.map(([a, b], i) => a * x1 + b * x2 + biases[i]);
    const hidden = z.map((v) => activation === 'relu' ? Math.max(0, v) : Math.tanh(v));
    const result = sum(hidden.map((v, i) => v * outgoing[i])) + 0.1;
    const inputs = [[90, 95], [90, 205]], middle = [[300, 55], [300, 150], [300, 245]], end = [510, 150];
    let markup = label(90, 24, 'INPUTS', 'text-anchor="middle"') + label(300, 24, `${activation.toUpperCase()} HIDDEN LAYER`, 'text-anchor="middle"') + label(510, 24, 'LINEAR OUTPUT', 'text-anchor="middle"');
    inputs.forEach(([x, y], i) => middle.forEach(([mx, my], j) => { markup += line(x + 29, y, mx - 29, my, `stroke="${weights[j][i] >= 0 ? colors[0] : colors[2]}" stroke-width="${1 + Math.abs(weights[j][i]) * 3}" opacity="0.5"`); }));
    middle.forEach(([x, y], i) => { markup += line(x + 29, y, end[0] - 34, end[1], `stroke="${outgoing[i] >= 0 ? colors[0] : colors[2]}" stroke-width="${1 + Math.abs(hidden[i] * outgoing[i]) * 4}" opacity="0.55"`); });
    inputs.forEach(([x, y], i) => { markup += dot(x, y, 29, 'fill="#e4eddf" stroke="#267d68" stroke-width="2"') + label(x, y + 5, fmt(i ? x2 : x1), 'text-anchor="middle"'); });
    middle.forEach(([x, y], i) => { markup += dot(x, y, 29, `fill="${Math.abs(hidden[i]) > 0.05 ? '#e4ddf1' : '#f2eee5'}" stroke="#8770b7" stroke-width="2"`) + label(x, y + 5, fmt(hidden[i]), 'text-anchor="middle"'); });
    markup += dot(end[0], end[1], 34, 'fill="#f3e4c4" stroke="#c48730" stroke-width="2"') + label(end[0], end[1] + 5, fmt(result), 'text-anchor="middle"') + label(300, 294, 'Green connections: positive weights · violet: negative weights', 'text-anchor="middle" font-size="12"');
    ui.render(markup, `With inputs ${fmt(x1)} and ${fmt(x2)} using ${activation}, hidden activations are ${hidden.map((v) => fmt(v)).join(', ')} and the linear output is ${fmt(result)}.`, [['Hidden unit 1', fmt(hidden[0], 3)], ['Hidden unit 2', fmt(hidden[1], 3)], ['Output', fmt(result, 3)]], 'Fixed weights: hidden rows [0.9, −0.5], [−0.4, 0.8], [0.6, 0.6]; biases [0.1, 0.2, −0.3]. Output weights [0.7, −0.4, 0.8], bias 0.1.');
  }
  ui.range('Input one', -1, 1, 0.05, x1, (v) => { x1 = v; render(); });
  ui.range('Input two', -1, 1, 0.05, x2, (v) => { x2 = v; render(); });
  ui.select('Hidden activation', [['relu', 'ReLU'], ['tanh', 'Tanh']], activation, (v) => { activation = v; render(); });
  render();
}

function convolution(ui) {
  const pixels = [[0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], [0, 0, 1, 1, 1, 1], [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0]];
  const kernels = { vertical: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], horizontal: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], average: Array.from({ length: 3 }, () => [1 / 9, 1 / 9, 1 / 9]) };
  let position = 1, choice = 'vertical';
  function render() {
    const row = Math.floor(position / 4), col = position % 4, kernel = kernels[choice];
    const valueAt = (r, c) => sum(kernel.flatMap((values, dy) => values.map((v, dx) => v * pixels[r + dy][c + dx])));
    const result = valueAt(row, col);
    let markup = label(103, 24, '6 × 6 INPUT', 'text-anchor="middle"') + label(302, 24, '3 × 3 KERNEL', 'text-anchor="middle"') + label(492, 24, '4 × 4 OUTPUT', 'text-anchor="middle"');
    pixels.forEach((values, r) => values.forEach((v, c) => { const active = r >= row && r < row + 3 && c >= col && c < col + 3; markup += `<rect x="${19 + c * 28}" y="${47 + r * 28}" width="27" height="27" rx="3" fill="${v ? '#267d68' : '#e7ece0'}"${active ? ' stroke="#c48730" stroke-width="2"' : ''}/>` + label(32.5 + c * 28, 65 + r * 28, v, `text-anchor="middle" fill="${v ? '#ffffff' : '#34463b'}" font-size="12"`); }));
    kernel.forEach((values, r) => values.forEach((v, c) => { markup += `<rect x="${254 + c * 32}" y="${84 + r * 32}" width="30" height="30" rx="5" fill="#e9e1f3"/>` + label(269 + c * 32, 104 + r * 32, choice === 'average' ? '1/9' : v, 'text-anchor="middle" font-size="12"'); }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = valueAt(r, c); markup += `<rect x="${433 + c * 30}" y="${68 + r * 30}" width="28" height="28" rx="4" fill="${v > 0 ? '#dceade' : v < 0 ? '#e8dff1' : '#eee9df'}"${r === row && c === col ? ' stroke="#c48730" stroke-width="3"' : ''}/>` + label(447 + c * 30, 86 + r * 30, choice === 'average' ? fmt(v, 1) : v, 'text-anchor="middle" font-size="11"'); }
    markup += label(218, 137, '×', 'text-anchor="middle" font-size="24"') + label(393, 137, '→', 'text-anchor="middle" font-size="24"') + label(300, 254, `Selected patch: row ${row + 1}, column ${col + 1}`, 'text-anchor="middle"') + label(300, 281, `Sum of 9 products = ${fmt(result, choice === 'average' ? 3 : 0)}`, 'text-anchor="middle"');
    ui.render(markup, `${choice} kernel at row ${row + 1}, column ${col + 1} produces ${fmt(result, 3)}. Input is six by six, kernel three by three, and output four by four.`, [['Patch row', row + 1], ['Patch column', col + 1], ['Filter response', fmt(result, 3)]], 'Gold outlines connect the current input patch to its output cell. This follows the unflipped-kernel convention used by common deep-learning layers.');
  }
  ui.select('Filter', [['vertical', 'Vertical edge'], ['horizontal', 'Horizontal edge'], ['average', 'Local average']], choice, (v) => { choice = v; render(); });
  ui.range('Patch position', 0, 15, 1, position, (v) => { position = v; render(); }, (v) => `${v + 1} / 16`);
  render();
}

function attention(ui) {
  let temperature = 1, rainScore = 1.1;
  const names = ['roots', 'rain', 'sun', 'bees'], values = [0.2, 0.9, 0.6, 0.3];
  function render() {
    const scores = [2.4, rainScore, 0.3, -0.5];
    const scaled = scores.map((v) => v / temperature), max = Math.max(...scaled);
    const exps = scaled.map((v) => Math.exp(v - max)), total = sum(exps), weights = exps.map((v) => v / total);
    const mixed = sum(weights.map((v, i) => v * values[i]));
    let markup = label(24, 24, 'KEY') + label(150, 24, 'SOFTMAX WEIGHT') + label(465, 24, 'VALUE') + label(552, 24, 'SCORE', 'text-anchor="middle"');
    weights.forEach((w, i) => { const y = 48 + i * 49; markup += label(24, y + 20, names[i]) + `<rect x="150" y="${y}" width="255" height="28" rx="9" fill="#e9e9df"/><rect x="150" y="${y}" width="${255 * w}" height="28" rx="9" fill="${colors[i % 3]}"/>` + label(415, y + 20, `${fmt(w * 100, 0)}%`, 'font-size="12"') + label(486, y + 20, fmt(values[i], 1), 'text-anchor="middle"') + label(551, y + 20, fmt(scores[i], 1), 'text-anchor="middle"'); });
    markup += label(300, 270, `Weighted value = Σ(weight × value) = ${fmt(mixed, 3)}`, 'text-anchor="middle"');
    ui.render(markup, `Temperature ${fmt(temperature)}. Attention weights for ${names.join(', ')} are ${weights.map((w) => `${fmt(w * 100, 1)}%`).join(', ')}. Weighted value ${fmt(mixed, 3)}.`, [['Weight sum', fmt(sum(weights), 3)], ['Largest weight', `${fmt(Math.max(...weights) * 100, 1)}%`], ['Mixed value', fmt(mixed, 3)]], 'The scores are illustrative, not learned language-model scores. Softmax makes the weights positive and normalizes them to sum to one.');
  }
  ui.range('Temperature', 0.2, 2.5, 0.1, temperature, (v) => { temperature = v; render(); });
  ui.range('Score for rain', -2, 4, 0.1, rainScore, (v) => { rainScore = v; render(); });
  render();
}

function embeddings(ui) {
  let angle = 35, length = 1;
  const anchors = [{ name: 'A', angle: 20, color: colors[0] }, { name: 'B', angle: 115, color: colors[1] }, { name: 'C', angle: 230, color: colors[2] }];
  function render() {
    const center = [245, 145], radius = 92;
    const point = (degrees, scale = 1) => [center[0] + Math.cos(degrees * Math.PI / 180) * radius * scale, center[1] - Math.sin(degrees * Math.PI / 180) * radius * scale];
    const end = point(angle, length);
    let markup = line(75, 145, 405, 145, 'class="lg-axis"') + line(245, 15, 245, 279, 'class="lg-axis"') + dot(...center, radius, 'fill="none" stroke="#d7ddd0" stroke-dasharray="4 5"');
    anchors.forEach((anchor) => { const [x, y] = point(anchor.angle); markup += line(...center, x, y, `stroke="${anchor.color}" stroke-width="2"`) + dot(x, y, 5, `fill="${anchor.color}"`) + label(x + 9, y - 6, anchor.name, `fill="${anchor.color}"`); });
    markup += line(...center, ...end, 'stroke="#283c32" stroke-width="4"') + dot(...end, 7, 'fill="#283c32"') + label(end[0] + 10, end[1] + 17, 'query') + label(430, 47, 'COSINE SIMILARITY');
    const similarities = anchors.map((anchor) => Math.cos((angle - anchor.angle) * Math.PI / 180));
    similarities.forEach((v, i) => { markup += label(431, 90 + i * 49, `${anchors[i].name}  ${fmt(v, 3)}`, `fill="${anchors[i].color}"`) + line(430, 101 + i * 49, 430 + (v + 1) / 2 * 116, 101 + i * 49, `stroke="${anchors[i].color}" stroke-width="5" stroke-linecap="round"`); });
    markup += label(245, 295, 'Same direction: 1 · perpendicular: 0 · opposite: −1', 'text-anchor="middle" font-size="12"');
    const nearest = anchors[similarities.indexOf(Math.max(...similarities))].name;
    ui.render(markup, `Query angle ${angle} degrees and length ${fmt(length)}. Cosine similarities: ${anchors.map((a, i) => `${a.name} ${fmt(similarities[i], 3)}`).join(', ')}. Closest direction: ${nearest}.`, [['Closest direction', nearest], ['Query norm', fmt(length)], ['Best cosine', fmt(Math.max(...similarities), 3)]], 'Changing the vector’s length changes its coordinates, but not its cosine similarity. These hand-built vectors illustrate geometry, not real semantic meaning.');
  }
  ui.range('Query angle', 0, 360, 1, angle, (v) => { angle = v; render(); }, (v) => `${v}°`);
  ui.range('Query length', 0.3, 1.3, 0.05, length, (v) => { length = v; render(); });
  render();
}

function retrieval(ui) {
  const documents = [
    { title: 'Orchid watering', text: 'Orchids need water when roots dry. Water the roots and let excess water drain.' },
    { title: 'A home for bees', text: 'Bees visit flowers for pollen and nectar. Native flowers help bees find food.' },
    { title: 'Plants in shade', text: 'Shade plants grow in low light. Keep soil moist but let extra water drain.' },
    { title: 'Compost basics', text: 'Compost mixes dry leaves and green scraps. Air and water help the mix break down.' },
    { title: 'Healthy roots', text: 'Healthy roots need air and water. Soil that stays wet can damage roots.' },
  ];
  const queries = ['water orchid roots', 'bees flowers nectar', 'plants low light', 'compost dry leaves'];
  const tokens = (text) => new Set(text.toLowerCase().match(/[a-z]+/g) || []);
  let query = queries[0], topK = 2;
  function render() {
    const queryTokens = tokens(query);
    const ranked = documents.map((doc) => {
      const words = tokens(`${doc.title} ${doc.text}`);
      const matches = [...queryTokens].filter((word) => words.has(word));
      const union = new Set([...queryTokens, ...words]);
      return { ...doc, matches, score: matches.length / union.size };
    }).sort((a, b) => b.score - a.score);
    let markup = label(25, 25, 'RANKED PASSAGES') + label(535, 25, 'OVERLAP', 'text-anchor="end"');
    ranked.forEach((doc, i) => { const y = 43 + i * 46; markup += `<rect x="20" y="${y}" width="555" height="38" rx="9" fill="${i < topK ? '#e1ecdf' : '#f1ede4'}"/>` + `<rect x="20" y="${y}" width="${Math.max(0, doc.score) * 555}" height="38" rx="9" fill="#b8d6bc"/>` + label(35, y + 24, `${i + 1}. ${doc.title}`) + label(443, y + 24, i < topK ? 'selected' : '', 'font-size="11"') + label(555, y + 24, fmt(doc.score, 3), 'text-anchor="end" font-size="12"'); });
    const matches = ranked.slice(0, topK).flatMap((d) => d.matches);
    ui.render(markup, `Query ${query}. The top ${topK} selected documents are ${ranked.slice(0, topK).map((d) => d.title).join(', ')}. Highest Jaccard score ${fmt(ranked[0].score, 3)}.`, [['Passages selected', topK], ['Best overlap', fmt(ranked[0].score, 3)], ['Query terms matched', new Set(matches).size]], `Top passage: “${ranked[0].text}” Score = shared unique words ÷ all unique words. Exact word matching cannot recognize synonyms or word forms; “orchid” and “orchids” are different here.`);
  }
  ui.select('Question keywords', queries.map((q) => [q, q]), query, (v) => { query = v; render(); });
  ui.range('Top-k passages', 1, 5, 1, topK, (v) => { topK = v; render(); }, (v) => String(v));
  render();
}

const demos = { regression, gradient, classification, clustering, overfit, network, convolution, attention, embeddings, retrieval };

export function mountDemo(container, demoName, { reducedMotion = false } = {}) {
  if (!container || !demos[demoName]) return () => {};
  const ui = shell(container, reducedMotion);
  demos[demoName](ui);
  return () => ui.cleanup();
}

export const demoNames = Object.keys(demos);

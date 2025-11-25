// stats.js

// ==== MATRIX STATS ====
document.addEventListener('DOMContentLoaded', () => {
  const screenerData = window.screenerData || [];

  const MIN_BUBBLE_SIZE = 18;
  const MAX_BUBBLE_SIZE = 70;

  const diffSlider = document.getElementById('diffSlider');
  const timeSlider = document.getElementById('timeSlider');
  const diffValueLabel = document.getElementById('diffValue');
  const timeValueLabel = document.getElementById('timeValue');
  const matrixTable = document.getElementById('matrixTable');

  if (!diffSlider || !timeSlider || !diffValueLabel || !timeValueLabel || !matrixTable) {
    return;
  }

  const exchangesSet = new Set();
  for (const row of screenerData) {
    exchangesSet.add(row.first_exchange);
    exchangesSet.add(row.second_exchange);
  }
  const exchanges = Array.from(exchangesSet).sort();

  function exchangeIconSrc(exchange) {
    return `img/${(exchange || '').toLowerCase()}_icon.png`;
  }

  const cellMap = new Map(); // key "ex1|ex2" -> bubble element

  function buildMatrixSkeleton() {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const cornerTh = document.createElement('th');
    cornerTh.classList.add('corner');
    headerRow.appendChild(cornerTh);

    for (const ex of exchanges) {
      const th = document.createElement('th');

      const label = document.createElement('div');
      label.className = 'exchange-label';

      const img = document.createElement('img');
      img.className = 'exchange-icon';
      img.src = exchangeIconSrc(ex);
      img.alt = ex;

      const span = document.createElement('span');
      span.textContent = ex;

      label.appendChild(img);
      label.appendChild(span);
      th.appendChild(label);
      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');

    for (const rowEx of exchanges) {
      const tr = document.createElement('tr');

      const rowTh = document.createElement('th');
      rowTh.className = 'row-header';
      const label = document.createElement('div');
      label.className = 'exchange-label';
      const img = document.createElement('img');
      img.className = 'exchange-icon';
      img.src = exchangeIconSrc(rowEx);
      img.alt = rowEx;
      const span = document.createElement('span');
      span.textContent = rowEx;
      label.appendChild(img);
      label.appendChild(span);
      rowTh.appendChild(label);
      tr.appendChild(rowTh);

      for (const colEx of exchanges) {
        const td = document.createElement('td');
        const wrapper = document.createElement('div');
        wrapper.className = 'bubble-wrapper';
        const bubble = document.createElement('div');
        bubble.className = 'bubble empty';

        wrapper.appendChild(bubble);
        td.appendChild(wrapper);
        tr.appendChild(td);

        const [ex1, ex2] = [rowEx, colEx].sort();
        const key = `${ex1}|${ex2}`;
        cellMap.set(key, bubble);
      }

      tbody.appendChild(tr);
    }

    matrixTable.innerHTML = '';
    matrixTable.appendChild(thead);
    matrixTable.appendChild(tbody);
  }

  function computeCounts(diffThresholdPercent, timeThresholdMinutes) {
    const diffThreshold = diffThresholdPercent / 100;

    const counts = new Map();
    let maxCount = 0;

    for (const row of screenerData) {
      const diff = Number(row.diff ?? row.price_difference ?? 0);
      const durationCount = Number(row.count ?? 0);

      if (diff < diffThreshold) continue;
      if (durationCount <= timeThresholdMinutes) continue;

      const [ex1, ex2] = [row.first_exchange, row.second_exchange].sort();
      const key = `${ex1}|${ex2}`;

      const current = counts.get(key) ?? 0;
      const next = current + 1;
      counts.set(key, next);
      if (next > maxCount) maxCount = next;
    }

    return { counts, maxCount };
  }

  function updateMatrix(skip_metrika = false) {
    if (!skip_metrika) {
      ym(105484818,'reachGoal','exchange-stat-play');
    }

    const diffThreshold = Number(diffSlider.value);
    const timeThreshold = Number(timeSlider.value);

    diffValueLabel.innerHTML = `${diffThreshold.toFixed(1)}&nbsp;%`;
    timeValueLabel.innerHTML = `${timeThreshold}&nbsp;мин`;

    const { counts, maxCount } = computeCounts(diffThreshold, timeThreshold);

    for (const [key, bubble] of cellMap.entries()) {
      const count = counts.get(key) ?? 0;

      if (!count || maxCount === 0) {
        bubble.textContent = '';
        bubble.classList.add('empty');
        bubble.style.width = `${MIN_BUBBLE_SIZE}px`;
        bubble.style.height = `${MIN_BUBBLE_SIZE}px`;
        bubble.style.fontSize = `10px`;
        continue;
      }

      bubble.classList.remove('empty');
      bubble.textContent = count;

      const ratio = maxCount > 0 ? count / maxCount : 0;
      const size = MIN_BUBBLE_SIZE + ratio * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      const minFont = 10;
      const maxFont = 18;
      const fontSize = minFont + ratio * (maxFont - minFont);
      bubble.style.fontSize = `${fontSize}px`;
    }
  }

  if (exchanges.length > 0) {
    buildMatrixSkeleton();
    updateMatrix(true);
    diffSlider.addEventListener('input', () => updateMatrix(false));
    timeSlider.addEventListener('input', () => updateMatrix(false));
  }
});

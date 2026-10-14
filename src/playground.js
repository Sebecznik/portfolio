(() => {
  'use strict';
  const DIRECTIONS = [1, 2, 4, 8]; // north, east, south, west
  const OPPOSITE = [4, 8, 1, 2];
  function neighbor(index, direction) {
    const row = Math.floor(index / 3), col = index % 3;
    if (direction === 0) return row > 0 ? index - 3 : -1;
    if (direction === 1) return col < 2 ? index + 1 : -1;
    if (direction === 2) return row < 2 ? index + 3 : -1;
    return col > 0 ? index - 1 : -1;
  }
  function rotate(mask) { return ((mask << 1) & 15) | (mask >> 3); }
  function directionBetween(a, b) {
    return b === a - 3 ? 1 : b === a + 1 ? 2 : b === a + 3 ? 4 : 8;
  }
  const routes = [];
  function findRoutes(path) {
    const last = path[path.length - 1];
    if (last === 5) { if (path.length >= 7) routes.push(path); return; }
    for (let direction = 0; direction < 4; direction++) {
      const next = neighbor(last, direction);
      if (next >= 0 && !path.includes(next)) findRoutes([...path, next]);
    }
  }
  findRoutes([3]);

  class NetworkPuzzle {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      const path = routes[Math.floor(this.random() * routes.length)];
      this.solution = Array.from({ length: 9 }, () => [3, 5, 6, 9][Math.floor(this.random() * 4)]);
      path.forEach((cell, index) => {
        const entry = index === 0 ? 8 : directionBetween(cell, path[index - 1]);
        const exit = index === path.length - 1 ? 2 : directionBetween(cell, path[index + 1]);
        this.solution[cell] = entry | exit;
      });
      this.cells = this.solution.map(mask => {
        for (let turns = Math.floor(this.random() * 4); turns > 0; turns--) mask = rotate(mask);
        return mask;
      });
      this.moves = 0;
      this.update();
      // A new puzzle always starts disconnected, even with a constant random source.
      if (this.won) { this.cells[3] = rotate(this.cells[3]); this.update(); }
      if (this.won) { this.cells[3] = rotate(this.cells[3]); this.update(); }
    }
    update() {
      this.powered = new Set();
      if (this.cells[3] & 8) {
        const queue = [3]; this.powered.add(3);
        for (let i = 0; i < queue.length; i++) {
          const cell = queue[i];
          DIRECTIONS.forEach((bit, direction) => {
            const next = neighbor(cell, direction);
            if (next >= 0 && (this.cells[cell] & bit) && (this.cells[next] & OPPOSITE[direction]) && !this.powered.has(next)) {
              this.powered.add(next); queue.push(next);
            }
          });
        }
      }
      this.won = this.powered.has(5) && !!(this.cells[5] & 2);
    }
    turn(index) {
      if (this.won || !Number.isInteger(index) || index < 0 || index > 8) return;
      this.cells[index] = rotate(this.cells[index]); this.moves++; this.update();
    }
  }

  class BytePuzzle {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.cells = Array(16).fill(0); this.moves = 0; this.status = 'playing'; this.spawn(); this.spawn(); }
    spawn() {
      const empty = this.cells.map((value, index) => value ? -1 : index).filter(index => index >= 0);
      if (empty.length) this.cells[empty[Math.floor(this.random() * empty.length)]] = this.random() < .9 ? 2 : 4;
    }
    canMove() {
      return this.cells.some((value, i) => !value || (i % 4 < 3 && value === this.cells[i + 1]) || (i < 12 && value === this.cells[i + 4]));
    }
    move(direction) {
      if (this.status !== 'playing' || !['left', 'right', 'up', 'down'].includes(direction)) return false;
      const before = [...this.cells];
      for (let line = 0; line < 4; line++) {
        let indices = Array.from({ length: 4 }, (_, i) => direction === 'left' || direction === 'right' ? line * 4 + i : i * 4 + line);
        if (direction === 'right' || direction === 'down') indices.reverse();
        const values = indices.map(index => this.cells[index]).filter(Boolean), merged = [];
        for (let i = 0; i < values.length; i++) {
          if (values[i] === values[i + 1]) { merged.push(values[i] * 2); i++; }
          else merged.push(values[i]);
        }
        indices.forEach((index, i) => { this.cells[index] = merged[i] || 0; });
      }
      const changed = this.cells.some((value, i) => value !== before[i]);
      if (changed) {
        this.moves++;
        if (Math.max(...this.cells) >= 128) this.status = 'won';
        else this.spawn();
      }
      if (this.status === 'playing' && !this.canMove()) this.status = 'lost';
      return changed;
    }
  }

  class PacketRunner {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.status = 'ready'; this.y = 0; this.velocity = 0; this.time = 0; this.distance = 0; this.next = 1; this.obstacles = []; }
    get score() { return Math.floor(this.distance / 10); }
    start() { this.reset(); this.status = 'running'; }
    jump() { if (this.status === 'running' && this.y === 0) this.velocity = 590; }
    pause() { if (this.status === 'running') this.status = 'paused'; }
    resume() { if (this.status === 'paused') this.status = 'running'; }
    advance(seconds) {
      // Small physics steps prevent skipped collisions on slower devices.
      let remaining = Math.min(.1, Math.max(0, seconds));
      while (remaining > 0 && this.status === 'running') {
        const dt = Math.min(1 / 120, remaining); remaining -= dt;
        this.time += dt;
        const speed = Math.min(340, 210 + this.time * 2.5);
        this.distance += speed * dt;
        this.velocity -= 1700 * dt;
        this.y = Math.max(0, this.y + this.velocity * dt);
        if (this.y === 0) this.velocity = 0;
        if (this.time >= this.next) {
          this.obstacles.push({ x: 610, width: 20 + this.random() * 10, height: 26 + this.random() * 13 });
          this.next = this.time + 1.35 + this.random() * .5;
        }
        for (const obstacle of this.obstacles) {
          obstacle.x -= speed * dt;
          if (obstacle.x < 78 && obstacle.x + obstacle.width > 58 && this.y + 3 < obstacle.height) this.status = 'over';
        }
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { NetworkPuzzle, BytePuzzle, PacketRunner, rotate };
  if (typeof document === 'undefined') return;
  const root = document.querySelector('#playground');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => Array.from(root.querySelectorAll(selector));
  const network = new NetworkPuzzle(), bytes = new BytePuzzle(), runner = new PacketRunner();
  let active = 'network', frame = null, previousTime = null, runnerBest = 0;
  let swipeStart = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const text = (key, values = {}) => {
    const entry = window.PORTFOLIO_COPY?.[`play.${key}`];
    return (entry?.[document.documentElement.lang] || entry?.en || '').replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  };
  const write = (element, value) => { if (element.textContent !== String(value)) element.textContent = String(value); };
  try { const value = Number(localStorage.getItem('sp-packet-run-best-v1')); if (Number.isSafeInteger(value) && value >= 0) runnerBest = value; } catch (_) { /* Optional record. */ }

  const networkTiles = Array.from({ length: 9 }, (_, index) => {
    const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'wire-tile';
    tile.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path class="wire-path"/><circle cx="32" cy="32" r="3"/></svg>';
    tile.addEventListener('click', () => { network.turn(index); renderNetwork(); });
    tile.addEventListener('keydown', event => {
      const direction = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(event.key);
      if (direction < 0) return;
      event.preventDefault(); const next = neighbor(index, direction); if (next >= 0) networkTiles[next].focus();
    });
    $('#network-grid').appendChild(tile); return tile;
  });
  const byteTiles = Array.from({ length: 16 }, () => {
    const tile = document.createElement('span'); tile.className = 'byte-tile'; tile.setAttribute('role', 'gridcell');
    return tile;
  });
  for (let row = 0; row < 4; row++) {
    const element = document.createElement('div'); element.className = 'byte-row'; element.setAttribute('role', 'row');
    byteTiles.slice(row * 4, row * 4 + 4).forEach(tile => element.appendChild(tile)); $('#byte-grid').appendChild(element);
  }

  function renderNetwork() {
    networkTiles.forEach((tile, index) => {
      const ends = [[32, 0], [64, 32], [32, 64], [0, 32]];
      const directions = [];
      const path = DIRECTIONS.flatMap((bit, direction) => {
        if (!(network.cells[index] & bit)) return [];
        directions.push(text(['north', 'east', 'south', 'west'][direction]));
        return [`M32 32L${ends[direction][0]} ${ends[direction][1]}`];
      }).join(' ');
      tile.querySelector('path').setAttribute('d', path);
      tile.dataset.powered = String(network.powered.has(index));
      tile.setAttribute('aria-label', text('network.tile', { n: index + 1, directions: directions.join(', ') }));
      tile.setAttribute('aria-disabled', String(network.won));
    });
    $('#network-stage').dataset.won = String(network.won);
    write($('#network-moves'), network.moves);
    write($('#network-message'), text(network.won ? 'network.won' : 'network.hint'));
    write($('#network-new'), text(network.won ? 'network.next' : 'network.new'));
  }

  function renderBytes() {
    byteTiles.forEach((tile, index) => {
      write(tile, bytes.cells[index] || ''); tile.dataset.value = bytes.cells[index];
      tile.setAttribute('aria-label', text('bytes.cell', { n: index + 1, value: bytes.cells[index] || text('bytes.empty') }));
    });
    $('#byte-grid').dataset.state = bytes.status;
    write($('#byte-moves'), bytes.moves);
    write($('#byte-highest'), Math.max(...bytes.cells));
    write($('#byte-message'), text(`bytes.${bytes.status}`));
    $$('[data-byte-direction]').forEach(button => { button.disabled = bytes.status !== 'playing'; });
  }
  function moveBytes(direction) { bytes.move(direction); renderBytes(); }

  const player = $('#packet-player'), obstacleGroup = $('#packet-obstacles');
  const svgNS = 'http://www.w3.org/2000/svg';
  function drawRunner() {
    player.setAttribute('transform', `translate(56 ${166 - runner.y})`);
    // No continuous decorative animation: only the actual round moves.
    while (obstacleGroup.children.length > runner.obstacles.length) obstacleGroup.lastElementChild.remove();
    runner.obstacles.forEach((obstacle, index) => {
      let rect = obstacleGroup.children[index];
      if (!rect) { rect = document.createElementNS(svgNS, 'rect'); rect.setAttribute('rx', '3'); obstacleGroup.appendChild(rect); }
      rect.setAttribute('x', obstacle.x); rect.setAttribute('y', 190 - obstacle.height);
      rect.setAttribute('width', obstacle.width); rect.setAttribute('height', obstacle.height);
    });
    write($('#packet-distance'), `${runner.score} m`);
  }
  function renderRunner() {
    const running = runner.status === 'running';
    $('#packet-stage').dataset.state = runner.status;
    $('#packet-overlay').hidden = running;
    write($('#packet-state-title'), text(`runner.title.${runner.status}`));
    write($('#packet-state-copy'), text(`runner.body.${runner.status}`, { score: runner.score }));
    write($('#packet-start'), text(runner.status === 'paused' ? 'resume' : runner.status === 'over' ? 'again' : 'start'));
    $('#packet-jump').disabled = !running; $('#packet-pause').disabled = !running;
    write($('#packet-best'), `${runnerBest} m`);
    write($('#packet-message'), runner.status === 'over' ? text('runner.result', { score: runner.score }) : text(`runner.message.${runner.status}`));
    drawRunner();
  }
  function stopFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null; previousTime = null; }
  function pauseRunner() { runner.pause(); stopFrame(); renderRunner(); }
  function animate(timestamp) {
    if (runner.status !== 'running') return;
    if (previousTime !== null) runner.advance((timestamp - previousTime) / 1000);
    previousTime = timestamp; drawRunner();
    if (runner.status === 'over') {
      if (runner.score > runnerBest) {
        runnerBest = runner.score;
        try { localStorage.setItem('sp-packet-run-best-v1', String(runnerBest)); } catch (_) { /* Optional record. */ }
      }
      stopFrame(); renderRunner();
    } else frame = requestAnimationFrame(animate);
  }

  function choose(name, focusTab = false) {
    if (!['network', 'runner', 'bytes'].includes(name)) return;
    if (name !== active && runner.status === 'running') pauseRunner();
    active = name;
    $$('[data-play-tab]').forEach(tab => {
      const selected = tab.dataset.playTab === name; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });
    $$('[data-play-panel]').forEach(panel => { panel.hidden = panel.dataset.playPanel !== name; });
  }
  const tabs = $$('[data-play-tab]');
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => choose(tab.dataset.playTab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % 3;
      else if (event.key === 'ArrowLeft') next = (index + 2) % 3;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = 2;
      else return;
      event.preventDefault(); choose(tabs[next].dataset.playTab, true);
    });
  });
  $('#network-new').addEventListener('click', () => { network.reset(); renderNetwork(); networkTiles[3].focus({ preventScroll: true }); });
  $('#byte-new').addEventListener('click', () => { bytes.reset(); renderBytes(); $('#byte-grid').focus({ preventScroll: true }); });
  const keyDirections = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  $('#byte-grid').addEventListener('keydown', event => {
    if (!keyDirections[event.key] || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault(); moveBytes(keyDirections[event.key]);
  });
  $$('[data-byte-direction]').forEach(button => button.addEventListener('click', () => moveBytes(button.dataset.byteDirection)));
  $('#byte-grid').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    $('#byte-grid').setPointerCapture(event.pointerId); $('#byte-grid').focus({ preventScroll: true });
  });
  $('#byte-grid').addEventListener('pointerup', event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y; swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    moveBytes(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
  });
  $('#byte-grid').addEventListener('pointercancel', () => { swipeStart = null; });
  $('#packet-start').addEventListener('click', () => {
    if (document.hidden || active !== 'runner') return;
    stopFrame(); runner.status === 'paused' ? runner.resume() : runner.start();
    renderRunner(); $('#packet-field').focus({ preventScroll: true }); frame = requestAnimationFrame(animate);
  });
  $('#packet-jump').addEventListener('click', () => runner.jump());
  $('#packet-pause').addEventListener('click', () => { pauseRunner(); $('#packet-start').focus({ preventScroll: true }); });
  $('#packet-field').addEventListener('pointerdown', event => {
    if (event.target.closest('button') || runner.status !== 'running' || !event.isPrimary) return;
    event.preventDefault(); $('#packet-field').focus({ preventScroll: true }); runner.jump();
  });
  $('#packet-field').addEventListener('keydown', event => {
    if (event.target.closest('button') || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (event.key === ' ' || event.key === 'ArrowUp') { event.preventDefault(); runner.jump(); }
    if (event.key === 'Escape' && runner.status === 'running') { event.preventDefault(); pauseRunner(); $('#packet-start').focus(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && runner.status === 'running') pauseRunner(); });
  window.addEventListener('blur', () => { if (runner.status === 'running') pauseRunner(); });
  window.addEventListener('pagehide', () => { if (runner.status === 'running') pauseRunner(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { if (!entries[0].isIntersecting && runner.status === 'running') pauseRunner(); }).observe($('#packet-field'));
  }
  document.addEventListener('portfolio:languagechange', () => { renderNetwork(); renderBytes(); renderRunner(); });
  // Old shared links now land at the replacement games near the top.
  if (window.location.hash === '#cloud-rescue') {
    try { history.replaceState(null, '', `${window.location.pathname}${window.location.search}#playground`); } catch (_) { /* Local preview. */ }
    root.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }
  renderNetwork(); renderBytes(); renderRunner(); choose('network');
})();

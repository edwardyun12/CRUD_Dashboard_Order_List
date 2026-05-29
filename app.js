// Default Mock Data
const DEFAULT_NODES = [
  { id: 'ND-1049', name: 'Archangel Core', type: 'Core Reactor', efficiency: 92, power: 850, status: 'online', lastUpdated: Date.now() },
  { id: 'ND-2401', name: 'Nebula Firewall', type: 'Quantum Shield', efficiency: 78, power: 420, status: 'online', lastUpdated: Date.now() },
  { id: 'ND-5830', name: 'Blackhole Repository', type: 'Data Array', efficiency: 45, power: 180, status: 'dormant', lastUpdated: Date.now() },
  { id: 'ND-7711', name: 'Ares Accelerator', type: 'Tachyon Relay', efficiency: 99, power: 950, status: 'overloaded', lastUpdated: Date.now() },
  { id: 'ND-8849', name: 'Titan Grid', type: 'Core Reactor', efficiency: 15, power: 120, status: 'overloaded', lastUpdated: Date.now() }
];

// App State
let nodes = [];
let currentFilter = 'all';
let searchKeyword = '';
let viewMode = 'deck'; // 'deck' or 'table'
let chartInstance = null;

// Sound System Config
let audioCtx = null;
let soundEnabled = false;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initData();
  initLucide();
  initViewToggles();
  initFilters();
  initSearch();
  initModal();
  initAudio();
  refreshUI();
});

// Load/Initialize Local Storage Data
function initData() {
  const saved = localStorage.getItem('nexus_grid_nodes');
  if (saved) {
    try {
      nodes = JSON.parse(saved);
    } catch (e) {
      nodes = [...DEFAULT_NODES];
    }
  } else {
    nodes = [...DEFAULT_NODES];
    localStorage.setItem('nexus_grid_nodes', JSON.stringify(nodes));
  }
}

function saveData() {
  localStorage.setItem('nexus_grid_nodes', JSON.stringify(nodes));
}

// Icon renderer helper
function initLucide() {
  lucide.createIcons();
}

// Setup View Mode Toggles
function initViewToggles() {
  const viewDeck = document.getElementById('viewDeck');
  const viewTable = document.getElementById('viewTable');
  const cardDeck = document.getElementById('cardDeck');
  const tablePanel = document.getElementById('tablePanel');

  viewDeck.addEventListener('click', () => {
    playAudioClick();
    viewMode = 'deck';
    viewDeck.classList.add('active');
    viewTable.classList.remove('active');
    cardDeck.style.display = 'grid';
    tablePanel.style.display = 'none';
    renderContent();
  });

  viewTable.addEventListener('click', () => {
    playAudioClick();
    viewMode = 'table';
    viewTable.classList.add('active');
    viewDeck.classList.remove('active');
    cardDeck.style.display = 'none';
    tablePanel.style.display = 'block';
    renderContent();
  });
}

// Setup Status Filter Sidebar Buttons
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playAudioClick();
      filterBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      currentFilter = targetBtn.dataset.filter;
      renderContent();
    });
  });
}

// Setup Search
function initSearch() {
  const searchInput = document.getElementById('nodeSearch');
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.toLowerCase();
    renderContent();
  });
}

// Setup Dialog and Forms
function initModal() {
  const modal = document.getElementById('nodeModal');
  const btnSpawn = document.getElementById('btnSpawnNode');
  const btnCancel = document.getElementById('btnCancelModal');
  const btnAbort = document.getElementById('btnAbortNode');
  const nodeForm = document.getElementById('nodeForm');
  const efficiencySlider = document.getElementById('nodeEfficiency');
  const efficiencyVal = document.getElementById('efficiencyVal');

  // Slide/val updater
  efficiencySlider.addEventListener('input', (e) => {
    efficiencyVal.textContent = `${e.target.value}%`;
  });

  const openModal = (editId = null) => {
    playAudioClick();
    modal.classList.add('open');
    if (editId) {
      document.getElementById('modalTitle').textContent = 'Configure Cyber Node';
      const node = nodes.find(n => n.id === editId);
      if (node) {
        document.getElementById('editNodeId').value = node.id;
        document.getElementById('nodeName').value = node.name;
        document.getElementById('nodeType').value = node.type;
        document.getElementById('nodeEfficiency').value = node.efficiency;
        document.getElementById('efficiencyVal').textContent = `${node.efficiency}%`;
        document.getElementById('nodePower').value = node.power;
        
        // Status radios
        document.getElementById('statusOnline').checked = node.status === 'online';
        document.getElementById('statusDormant').checked = node.status === 'dormant';
        document.getElementById('statusOverloaded').checked = node.status === 'overloaded';
      }
    } else {
      document.getElementById('modalTitle').textContent = 'Spawn Cyber Node';
      document.getElementById('editNodeId').value = '';
      nodeForm.reset();
      document.getElementById('nodeEfficiency').value = 85;
      document.getElementById('efficiencyVal').textContent = '85%';
      document.getElementById('statusOnline').checked = true;
    }
  };

  const closeModal = () => {
    playAudioClick();
    modal.classList.remove('open');
  };

  btnSpawn.addEventListener('click', () => openModal());
  btnCancel.addEventListener('click', closeModal);
  btnAbort.addEventListener('click', closeModal);

  // Form Submit
  nodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editNodeId').value;
    const name = document.getElementById('nodeName').value;
    const type = document.getElementById('nodeType').value;
    const efficiency = parseInt(document.getElementById('nodeEfficiency').value);
    const power = parseInt(document.getElementById('nodePower').value);
    const status = document.querySelector('input[name="nodeStatus"]:checked').value;

    if (id) {
      // Edit
      const index = nodes.findIndex(n => n.id === id);
      if (index !== -1) {
        nodes[index] = { ...nodes[index], name, type, efficiency, power, status, lastUpdated: Date.now() };
      }
    } else {
      // Add
      const newId = `ND-${Math.floor(1000 + Math.random() * 9000)}`;
      nodes.push({ id: newId, name, type, efficiency, power, status, lastUpdated: Date.now() });
    }

    saveData();
    playAudioSuccess();
    closeModal();
    refreshUI();
  });
}

// Render Content Deck and Lists
function renderContent() {
  const filtered = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchKeyword) || node.id.toLowerCase().includes(searchKeyword);
    const matchesFilter = currentFilter === 'all' || node.status === currentFilter;
    return matchesSearch && matchesFilter;
  });

  if (viewMode === 'deck') {
    renderDeck(filtered);
  } else {
    renderTable(filtered);
  }

  updateFilterCounts();
}

// 3D Parallax Mouse Tracking Engine
function apply3DTilt(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates around zero (-0.5 to 0.5)
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;

    // Rotation bounds (max 15 degrees)
    const rx = py * -20;
    const ry = px * 20;

    card.style.setProperty('--rx', rx);
    card.style.setProperty('--ry', ry);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.15s ease, box-shadow 0.15s ease';
    card.style.setProperty('--rx', 0);
    card.style.setProperty('--ry', 0);
    
    setTimeout(() => {
      card.style.transition = 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease';
    }, 500);
  });
  
  card.addEventListener('mouseenter', () => {
    playAudioHover();
  });
}

function renderDeck(nodeList) {
  const cardDeck = document.getElementById('cardDeck');
  cardDeck.innerHTML = '';

  if (nodeList.length === 0) {
    cardDeck.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-glow); border-radius: 12px;">
        <p style="font-family: var(--font-header);">NO CHANNELS FOUND IN MATRIX</p>
      </div>
    `;
    return;
  }

  nodeList.forEach(node => {
    const card = document.createElement('div');
    card.className = `node-card-3d ${node.status}`;
    card.innerHTML = `
      <div class="card-scanner"></div>
      
      <div class="card-top">
        <span class="node-id">${node.id}</span>
        <span class="node-badge ${node.status}">${node.status}</span>
      </div>

      <div class="card-mid">
        <h3 class="node-name" title="${node.name}">${node.name}</h3>
        <p class="node-type">${node.type}</p>
        
        <div class="node-metric-bar">
          <div class="metric-header">
            <span>Efficiency</span>
            <span>${node.efficiency}%</span>
          </div>
          <div class="metric-bar-bg">
            <div class="metric-bar-fill" style="width: ${node.efficiency}%;"></div>
          </div>
        </div>
      </div>

      <div class="card-bottom">
        <div class="node-power">
          <span class="power-label">Output Load</span>
          <span class="power-value">${node.power} MW</span>
        </div>
        <div class="card-actions">
          <button class="card-action-btn edit" data-id="${node.id}" title="Modify System">
            <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
          </button>
          <button class="card-action-btn delete" data-id="${node.id}" title="Purge Core">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>
    `;

    apply3DTilt(card);
    cardDeck.appendChild(card);
  });

  initLucide();
  bindCardActions();
}

function renderTable(nodeList) {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  if (nodeList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); font-family: var(--font-header); padding: 40px 0;">
          NO CHANNELS FOUND IN MATRIX
        </td>
      </tr>
    `;
    return;
  }

  nodeList.forEach(node => {
    const row = document.createElement('tr');
    row.id = `row-${node.id}`;
    row.innerHTML = `
      <td>${node.id}</td>
      <td class="table-node-name">${node.name}</td>
      <td>${node.type}</td>
      <td>
        <div class="table-efficiency-indicator">
          <span class="table-efficiency-num">${node.efficiency}%</span>
          <div class="metric-bar-bg" style="flex:1;">
            <div class="metric-bar-fill" style="width: ${node.efficiency}%;"></div>
          </div>
        </div>
      </td>
      <td style="font-weight: 700; color: var(--text-bright);">${node.power} MW</td>
      <td>
        <span class="node-badge ${node.status}">${node.status}</span>
      </td>
      <td style="text-align: right;">
        <div class="card-actions" style="justify-content: flex-end;">
          <button class="card-action-btn edit" data-id="${node.id}" title="Modify System">
            <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
          </button>
          <button class="card-action-btn delete" data-id="${node.id}" title="Purge Core">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </td>
    `;
    
    row.querySelectorAll('.card-action-btn').forEach(btn => {
      btn.addEventListener('mouseenter', playAudioHover);
    });
    tableBody.appendChild(row);
  });

  initLucide();
  bindCardActions();
}

// Bind Action Clicks inside dynamically rendered elements
function bindCardActions() {
  // Edit Action
  document.querySelectorAll('.card-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const modal = document.getElementById('nodeModal');
      // Set to edit state
      const triggerForm = document.getElementById('btnSpawnNode');
      
      // Select the target node
      const node = nodes.find(n => n.id === id);
      if (node) {
        document.getElementById('modalTitle').textContent = 'Configure Cyber Node';
        document.getElementById('editNodeId').value = node.id;
        document.getElementById('nodeName').value = node.name;
        document.getElementById('nodeType').value = node.type;
        document.getElementById('nodeEfficiency').value = node.efficiency;
        document.getElementById('efficiencyVal').textContent = `${node.efficiency}%`;
        document.getElementById('nodePower').value = node.power;
        
        // Status radios
        document.getElementById('statusOnline').checked = node.status === 'online';
        document.getElementById('statusDormant').checked = node.status === 'dormant';
        document.getElementById('statusOverloaded').checked = node.status === 'overloaded';
        
        playAudioClick();
        modal.classList.add('open');
      }
    });
  });

  // Delete Action
  document.querySelectorAll('.card-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      playAudioWarning();

      // Trigger disintegration animation
      if (viewMode === 'deck') {
        const card = btn.closest('.node-card-3d');
        if (card) {
          card.classList.add('disintegrating');
          setTimeout(() => {
            performDelete(id);
          }, 600);
        }
      } else {
        const row = document.getElementById(`row-${id}`);
        if (row) {
          row.classList.add('disintegrating');
          setTimeout(() => {
            performDelete(id);
          }, 600);
        }
      }
    });
  });
}

function performDelete(id) {
  nodes = nodes.filter(n => n.id !== id);
  saveData();
  refreshUI();
}

// Update Top Dashboard stats and Left Sidebar numbers
function updateStats() {
  const activeNodesCount = nodes.filter(n => n.status === 'online').length;
  const criticalCount = nodes.filter(n => n.status === 'overloaded').length;
  const totalPower = nodes.filter(n => n.status === 'online' || n.status === 'overloaded').reduce((acc, curr) => acc + curr.power, 0);

  document.getElementById('statTotalOutput').textContent = `${totalPower} MW`;
  document.getElementById('statActiveNodes').textContent = `${activeNodesCount} / ${nodes.length}`;
  document.getElementById('statCriticalNodes').textContent = criticalCount;
}

function updateFilterCounts() {
  document.getElementById('countAll').textContent = nodes.length;
  document.getElementById('countOnline').textContent = nodes.filter(n => n.status === 'online').length;
  document.getElementById('countDormant').textContent = nodes.filter(n => n.status === 'dormant').length;
  document.getElementById('countOverloaded').textContent = nodes.filter(n => n.status === 'overloaded').length;
}

// Setup Charts via Chart.js
function renderCharts() {
  const canvas = document.getElementById('efficiencyChart');
  if (!canvas) return;

  // Aggregate average power by type
  const types = ['Core Reactor', 'Quantum Shield', 'Data Array', 'Tachyon Relay'];
  const dataValues = types.map(t => {
    const list = nodes.filter(n => n.type === t);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.efficiency, 0);
    return Math.round(sum / list.length);
  });

  if (chartInstance) {
    chartInstance.data.datasets[0].data = dataValues;
    chartInstance.update();
    return;
  }

  const ctx = canvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: types,
      datasets: [{
        label: 'Efficiency Vector %',
        data: dataValues,
        backgroundColor: 'rgba(0, 242, 254, 0.15)',
        borderColor: '#00f2fe',
        borderWidth: 2,
        pointBackgroundColor: '#ff007f',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ff007f'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        r: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.08)'
          },
          pointLabels: {
            color: '#64748b',
            font: {
              family: 'Rajdhani',
              size: 11,
              weight: 'bold'
            }
          },
          ticks: {
            display: false,
            stepSize: 20
          },
          min: 0,
          max: 100
        }
      }
    }
  });
}

function refreshUI() {
  updateStats();
  renderContent();
  renderCharts();
}

// -------------------------------------------------------------
// FX Synthesizer Sound Engine (Web Audio API)
// -------------------------------------------------------------
function initAudio() {
  const toggle = document.getElementById('audioToggle');
  
  toggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      toggle.classList.add('enabled');
      toggle.innerHTML = '<i data-lucide="volume-2"></i>';
      initLucide();
      
      // Play a quick chime to show it's active
      playAudioSuccess();
    } else {
      toggle.classList.remove('enabled');
      toggle.innerHTML = '<i data-lucide="volume-x"></i>';
      initLucide();
    }
  });

  // Resume Web Audio Context if suspended (due to browser autoplay policies)
  document.body.addEventListener('click', () => {
    if (soundEnabled && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
}

function playOscillator(freqStart, freqEnd, duration, type = 'sine', volumeVal = 0.05) {
  if (!soundEnabled || !audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
    }
    
    gainNode.gain.setValueAtTime(volumeVal, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (error) {
    console.error('Synth sound failure:', error);
  }
}

// FX Sound Presets
function playAudioHover() {
  playOscillator(1600, 2400, 0.04, 'sine', 0.015);
}

// Click Trigger
function playAudioClick() {
  playOscillator(600, 150, 0.08, 'triangle', 0.08);
}

function playAudioSuccess() {
  if (!soundEnabled || !audioCtx) return;
  // A rapid double-chirp arpeggio
  setTimeout(() => playOscillator(523.25, 783.99, 0.12, 'sine', 0.05), 0); // C5 -> G5
  setTimeout(() => playOscillator(783.99, 1046.50, 0.15, 'sine', 0.05), 60); // G5 -> C6
}

function playAudioWarning() {
  if (!soundEnabled || !audioCtx) return;
  // Low resonant frequency buzz
  playOscillator(110, 80, 0.25, 'sawtooth', 0.07);
}

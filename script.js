import { addressForms, binaryBits, classifyIp, equalSubnets, intToIp, parseCidr, parseIp, vlsmSubnets } from './subnet.js';

const $ = id => document.getElementById(id);
const cidrInput = $('cidr'), error = $('error'), results = $('results'), binary = $('binary'), prefix = $('prefix'), subnets = $('subnets');
const normalization = $('normalization'), legend = $('legend'), ipTypeBadge = $('ip-type'), addressFormatsElement = $('address-forms');
const containsIp = $('contains-ip'), containsResult = $('contains-result'), splitMode = $('split-mode'), equalControls = $('equal-controls');
const vlsmControls = $('vlsm-controls'), hostCounts = $('host-counts'), vlsmHelp = $('vlsm-help'), exportCsv = $('export-csv'), copyTable = $('copy-table');
let current = null, binaryVisible = true, lastRows = [];
const labels = [['network', 'Network address'], ['broadcast', 'Broadcast address'], ['first', 'First usable'], ['last', 'Last usable'], ['mask', 'Subnet mask'], ['wildcard', 'Wildcard mask'], ['total', 'Total addresses'], ['hosts', 'Usable hosts'], ['prefix', 'Prefix']];

function copyText(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const original = button.textContent;
    button.textContent = 'Copied ✓';
    setTimeout(() => { button.textContent = original; }, 1200);
  });
}
function updateExportButtons() { exportCsv.disabled = !lastRows.length; copyTable.disabled = !lastRows.length; }
function binaryFor(value, networkBits) {
  return binaryBits(value, networkBits).map(({ bit, network }, index) => `${index && index % 8 === 0 ? '<b> . </b>' : ''}<span class="${network ? 'network' : 'host'}">${bit}</span>`).join('');
}
function binaryRow(label, value, networkBits) {
  return `<div class="binary-row"><span class="binary-label">${label}</span><div class="binary-value"><div class="binary-line">${binaryFor(value, networkBits)}</div><div class="binary-decimal">${intToIp(value)}</div></div></div>`;
}
function renderTable(rows) {
  lastRows = rows; updateExportButtons();
  subnets.innerHTML = `<table><thead><tr><th>#</th><th>CIDR</th><th>Network</th><th>First usable</th><th>Last usable</th><th>Broadcast</th><th>Usable hosts</th></tr></thead><tbody>${rows.map((row, i) => `<tr><td>${i + 1}</td><td>${intToIp(row.network)}/${row.bits}</td><td>${intToIp(row.network)}</td><td>${intToIp(row.first)}</td><td>${intToIp(row.last)}</td><td>${intToIp(row.broadcast)}</td><td>${row.hosts.toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
}
function renderVlsm() {
  if (!current) return;
  const raw = hostCounts.value.split(',').map(value => value.trim()).filter(Boolean);
  if (!raw.length) { subnets.innerHTML = ''; lastRows = []; updateExportButtons(); return; }
  if (raw.some(value => !/^\d+$/.test(value))) { subnets.innerHTML = '<p class="status bad">Use whole-number host counts separated by commas.</p>'; lastRows = []; updateExportButtons(); return; }
  try { renderTable(vlsmSubnets(current, raw.map(Number))); } catch (e) { subnets.innerHTML = `<p class="status bad">${e.message}</p>`; lastRows = []; updateExportButtons(); }
}
function renderEqual(newBits) { if (current) renderTable(equalSubnets(current, newBits)); }
function containsCheck() {
  if (!current) return;
  const value = containsIp.value.trim();
  if (!value) { containsResult.textContent = ''; containsResult.className = 'status'; return; }
  try {
    const inside = (() => { const address = parseIp(value); return address >= current.network && address <= current.broadcast; })();
    containsResult.textContent = inside ? `✓ Inside ${intToIp(current.network)}/${current.bits}` : `✗ Outside ${intToIp(current.network)}/${current.bits}`;
    containsResult.className = `status ${inside ? 'good' : 'bad'}`;
  } catch (e) { containsResult.textContent = `✗ ${e.message}`; containsResult.className = 'status bad'; }
}
function render() {
  try { current = parseCidr(cidrInput.value); cidrInput.classList.remove('invalid'); error.textContent = ''; }
  catch (e) { current = null; cidrInput.classList.add('invalid'); error.textContent = e.message; results.innerHTML = ''; binary.innerHTML = ''; subnets.innerHTML = ''; lastRows = []; updateExportButtons(); normalization.textContent = ''; prefix.innerHTML = ''; addressFormatsElement.innerHTML = ''; ipTypeBadge.textContent = ''; legend.hidden = true; return; }
  results.innerHTML = labels.map(([key, title]) => {
    const value = key === 'mask' ? intToIp(current.mask) : key === 'wildcard' ? intToIp((~current.mask) >>> 0) : key === 'hosts' || key === 'total' ? current[key].toLocaleString() : key === 'prefix' ? `/${current.bits}` : intToIp(current[key]);
    return `<div class="result ${key === 'prefix' ? 'prefix-result' : ''}"><div><small>${title}</small><span class="value">${value}</span></div><button class="copy" data-copy="${value}" aria-label="Copy ${title}">Copy</button></div>`;
  }).join('');
  ipTypeBadge.textContent = classifyIp(current.address);
  normalization.textContent = current.address === current.network ? '' : `${intToIp(current.address)} is inside network ${intToIp(current.network)}/${current.bits}.`;
  addressFormatsElement.innerHTML = [current.address, current.network, current.broadcast].map((value, index) => {
    const forms = addressForms(value), name = ['input IP', 'network', 'broadcast'][index];
    return `<div class="form-row"><small>${name}</small><span class="form-value">Hex: ${forms.hex} <button class="copy" data-copy="${forms.hex}">Copy</button></span><span class="form-value">Integer: ${forms.integer} <button class="copy" data-copy="${forms.integer}">Copy</button></span></div>`;
  }).join('');
  binary.innerHTML = binaryVisible ? [binaryRow('IP', current.address, current.bits), binaryRow('Network', current.network, current.bits), binaryRow('Mask', current.mask, current.bits)].join('') : '<div class="empty">Binary view is hidden.</div>';
  legend.hidden = !binaryVisible;
  prefix.innerHTML = Array.from({ length: 32 - current.bits }, (_, i) => `<option value="${current.bits + i + 1}">/${current.bits + i + 1} (${2 ** (i + 1)} subnets)</option>`).join('');
  subnets.innerHTML = ''; lastRows = []; updateExportButtons(); containsCheck();
  if (current.bits < 32 && splitMode.value === 'equal') renderEqual(current.bits + 1);
}
function csvText() { return ['#,CIDR,Network,First usable,Last usable,Broadcast,Usable hosts', ...lastRows.map((r, i) => `${i + 1},${intToIp(r.network)}/${r.bits},${intToIp(r.network)},${intToIp(r.first)},${intToIp(r.last)},${intToIp(r.broadcast)},${r.hosts}`)].join('\n'); }
cidrInput.addEventListener('input', render);
containsIp.addEventListener('input', containsCheck);
prefix.addEventListener('change', e => renderEqual(Number(e.target.value)));
splitMode.addEventListener('change', () => { const vlsm = splitMode.value === 'vlsm'; equalControls.hidden = vlsm; vlsmControls.hidden = !vlsm; vlsmHelp.hidden = !vlsm; subnets.innerHTML = ''; lastRows = []; updateExportButtons(); if (vlsm) renderVlsm(); else if (current && current.bits < 32) renderEqual(Number(prefix.value)); });
hostCounts.addEventListener('input', renderVlsm);
exportCsv.addEventListener('click', () => { if (!lastRows.length) return; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csvText()], { type: 'text/csv' })); link.download = 'subnets.csv'; link.click(); URL.revokeObjectURL(link.href); });
copyTable.addEventListener('click', e => { if (lastRows.length) copyText(csvText(), e.target); });
$('sample').addEventListener('click', () => { cidrInput.value = '192.168.10.37/26'; render(); });
$('binary-toggle').addEventListener('click', e => { binaryVisible = !binaryVisible; e.target.textContent = binaryVisible ? 'Hide' : 'Show'; e.target.setAttribute('aria-pressed', binaryVisible); render(); });
results.addEventListener('click', e => { if (e.target.dataset.copy) copyText(e.target.dataset.copy, e.target); });
addressFormatsElement.addEventListener('click', e => { if (e.target.dataset.copy) copyText(e.target.dataset.copy, e.target); });
$('theme').addEventListener('click', () => { document.documentElement.classList.toggle('light'); $('theme').textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀️'; });
render();

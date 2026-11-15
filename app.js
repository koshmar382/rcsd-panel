const ADMIN_PIN = "2026";
let isAdmin = false;
let currentFilter = 'ALL';

const RANKS = {
  1: "Cadet", 2: "Deputy I", 3: "Deputy II", 4: "Senior Deputy",
  5: "Sergeant", 6: "Lieutenant", 7: "Captain", 8: "Major", 9: "Undersheriff", 10: "Sheriff"
};

const defaultStaff = [
  { id: 1, nick: "Connor_Vance", rank: 10, dept: "Leadership", warns: 0, preds: 0, bonus: 0 },
  { id: 2, nick: "Marcus_Holloway", rank: 9, dept: "Leadership", warns: 0, preds: 1, bonus: 500000 },
  { id: 3, nick: "Alex_Mercer", rank: 7, dept: "Detective Bureau", warns: 1, preds: 0, bonus: 1200000 },
  { id: 4, nick: "Liam_Kensington", rank: 4, dept: "Patrol Division", warns: 0, preds: 0, bonus: 350000 },
  { id: 5, nick: "Ethan_Hunt", rank: 1, dept: "Academy", warns: 0, preds: 1, bonus: 0 }
];

let staff = JSON.parse(localStorage.getItem('rcsd_staff')) || defaultStaff;
let logs = JSON.parse(localStorage.getItem('rcsd_logs')) || ["Система запущена. Пин-код 9-10: 2026"];

function save() {
  localStorage.setItem('rcsd_staff', JSON.stringify(staff));
  localStorage.setItem('rcsd_logs', JSON.stringify(logs));
  render();
}

function addLog(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  logs.unshift(`[${time}] ${text}`);
  if (logs.length > 30) logs.pop();
}

function toggleAdmin() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('roleBadge').textContent = "Просмотр";
    document.getElementById('adminBtn').textContent = "Вход 9-10";
    render();
    return;
  }
  const pin = prompt("Введите пин-код руководства (2026):");
  if (pin === ADMIN_PIN) {
    isAdmin = true;
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('roleBadge').textContent = "Руководство (9-10)";
    document.getElementById('adminBtn').textContent = "Выйти";
    render();
  } else if (pin !== null) {
    alert("Неверный пин-код!");
  }
}

function setFilter(dept, btn) {
  currentFilter = dept;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
  btn.classList.add('active-filter');
  render();
}

function addStaff() {
  const nick = document.getElementById('newNick').value.trim();
  const rank = parseInt(document.getElementById('newRank').value);
  const dept = document.getElementById('newDept').value;
  if (!nick) return alert("Введите ник!");
  staff.push({ id: Date.now(), nick, rank, dept, warns: 0, preds: 0, bonus: 0 });
  addLog(`Принят ${nick} [${rank}] в ${dept}`);
  document.getElementById('newNick').value = '';
  save();
}

function changeRank(id, delta) {
  const emp = staff.find(s => s.id === id);
  if (!emp || emp.rank + delta < 1 || emp.rank + delta > 10) return;
  emp.rank += delta;
  addLog(`${delta > 0 ? 'Повышен' : 'Понижен'} ${emp.nick} до [${emp.rank}] ${RANKS[emp.rank]}`);
  save();
}

function changeWarn(id, delta) {
  const emp = staff.find(s => s.id === id);
  if (!emp) return;
  const reason = delta > 0 ? prompt(`Причина выговора для ${emp.nick}:`) : "Снятие";
  if (delta > 0 && !reason) return;
  emp.warns = Math.max(0, Math.min(3, emp.warns + delta));
  addLog(`${delta > 0 ? 'Выговор' : 'Снят выговор'} (${emp.warns}/3) — ${emp.nick} (${reason})`);
  save();
}

function changePred(id, delta) {
  const emp = staff.find(s => s.id === id);
  if (!emp) return;
  emp.preds = Math.max(0, Math.min(2, emp.preds + delta));
  addLog(`${delta > 0 ? 'Предупреждение' : 'Снят пред'} (${emp.preds}/2) — ${emp.nick}`);
  save();
}

function addBonus(id) {
  const emp = staff.find(s => s.id === id);
  if (!emp) return;
  const sum = parseInt(prompt(`Сумма премии для ${emp.nick}:`));
  if (!sum || isNaN(sum)) return;
  emp.bonus += sum;
  addLog(`Премия +$${sum.toLocaleString()} для ${emp.nick}`);
  save();
}

function clearBonus(id) {
  const emp = staff.find(s => s.id === id);
  if (!emp || emp.bonus === 0) return;
  addLog(`Выплачено $${emp.bonus.toLocaleString()} — ${emp.nick}`);
  emp.bonus = 0;
  save();
}

function fireStaff(id) {
  const emp = staff.find(s => s.id === id);
  if (!emp || !confirm(`Уволить ${emp.nick}?`)) return;
  staff = staff.filter(s => s.id !== id);
  addLog(`Уволен ${emp.nick}`);
  save();
}

function resetDemo() {
  if (!confirm("Сбросить список к начальному?")) return;
  staff = defaultStaff;
  save();
}

function render() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const tbody = document.getElementById('staffTable');
  tbody.innerHTML = '';

  document.querySelectorAll('.admin-col').forEach(el => el.classList.toggle('hidden', !isAdmin));

  let totalWarns = 0, totalBonus = 0, seniorCount = 0;
  staff.forEach(s => {
    totalWarns += s.warns;
    totalBonus += s.bonus;
    if (s.rank >= 7) seniorCount++;
  });

  document.getElementById('statTotal').textContent = staff.length;
  document.getElementById('statSenior').textContent = seniorCount;
  document.getElementById('statWarns').textContent = totalWarns;
  document.getElementById('statBonus').textContent = '$' + totalBonus.toLocaleString();

  [...staff].sort((a, b) => b.rank - a.rank).filter(s => {
    return (currentFilter === 'ALL' || s.dept === currentFilter) && s.nick.toLowerCase().includes(search);
  }).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-3 px-4 font-medium text-white">${s.nick}</td>
      <td class="py-3 px-4"><span class="text-blue-400 font-semibold">[${s.rank}]</span> ${RANKS[s.rank]}</td>
      <td class="py-3 px-4 text-slate-300">${s.dept}</td>
      <td class="py-3 px-4 space-x-1">
        <span class="px-2 py-0.5 rounded text-xs ${s.warns > 0 ? 'badge-warn' : 'badge-ok'}">Выг: ${s.warns}/3</span>
        <span class="px-2 py-0.5 rounded text-xs ${s.preds > 0 ? 'badge-pred' : 'bg-slate-800 text-slate-400'}">Пред: ${s.preds}/2</span>
      </td>
      <td class="py-3 px-4 text-emerald-400 font-medium">$${s.bonus.toLocaleString()}</td>
      <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap ${isAdmin ? '' : 'hidden'}">
        <button onclick="changeRank(${s.id}, 1)" class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">+Ранг</button>
        <button onclick="changeRank(${s.id}, -1)" class="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">-Ранг</button>
        <button onclick="changeWarn(${s.id}, 1)" class="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">+Выг</button>
        <button onclick="changeWarn(${s.id}, -1)" class="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">-Выг</button>
        <button onclick="changePred(${s.id}, 1)" class="px-2 py-1 bg-amber-600/20 text-amber-400 rounded text-xs">+Пред</button>
        <button onclick="changePred(${s.id}, -1)" class="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">-Пред</button>
        <button onclick="addBonus(${s.id})" class="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs">+Премия</button>
        <button onclick="clearBonus(${s.id})" class="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">Выплатить</button>
        <button onclick="fireStaff(${s.id})" class="px-2 py-1 bg-red-950 text-red-400 rounded text-xs">Уволить</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('actionLogs').innerHTML = logs.map(l => `<div class="border-b border-slate-800/50 pb-1">${l}</div>`).join('');
}

render();

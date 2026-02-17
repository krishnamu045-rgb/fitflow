const KEY = "ZESTUP_PRO_V17_5";
let state = null;
try { state = JSON.parse(localStorage.getItem(KEY)); } catch(e) { localStorage.removeItem(KEY); }

// --- 1. EMBEDDED DATABASE (Guaranteed to Load) ---
const MEGA_DB = [
  { "name": "idli", "variants": [ { "name": "Single Idli", "cal": 39, "unit": "pc", "type": "good", "desc": "Steamed" }, { "name": "Plate Idli (2+Sambar)", "cal": 220, "unit": "plate", "type": "good", "desc": "Standard" } ] },
  { "name": "dosa", "variants": [ { "name": "Plain Dosa", "cal": 180, "unit": "pc", "type": "good", "desc": "Less Oil" }, { "name": "Masala Dosa", "cal": 380, "unit": "pc", "type": "bad", "desc": "Potato" } ] },
  { "name": "rice", "variants": [ { "name": "White Rice", "cal": 150, "unit": "cup", "type": "ok", "desc": "Boiled" }, { "name": "Brown Rice", "cal": 111, "unit": "cup", "type": "good", "desc": "Fiber" } ] },
  { "name": "sambar", "cal": 100, "unit": "bowl", "type": "good", "desc": "Lentil" },
  { "name": "dal", "variants": [ { "name": "Dal Fry", "cal": 160, "unit": "bowl", "type": "good", "desc": "Protein" } ] },
  { "name": "roti", "variants": [ { "name": "Tandoori Roti", "cal": 110, "unit": "pc", "type": "good", "desc": "Wheat" }, { "name": "Chapati", "cal": 80, "unit": "pc", "type": "good", "desc": "Home made" } ] },
  { "name": "paneer", "variants": [ { "name": "Paneer Butter Masala", "cal": 400, "unit": "bowl", "type": "bad", "desc": "Creamy" }, { "name": "Paneer Tikka", "cal": 180, "unit": "plate", "type": "good", "desc": "Grilled" } ] },
  { "name": "chicken", "variants": [ { "name": "Grilled Chicken", "cal": 165, "unit": "breast", "type": "good", "desc": "Lean" }, { "name": "Chicken Biryani", "cal": 350, "unit": "cup", "type": "bad", "desc": "Rich" } ] },
  { "name": "egg", "variants": [ { "name": "Boiled Egg", "cal": 70, "unit": "pc", "type": "good", "desc": "Protein" }, { "name": "Omelette", "cal": 140, "unit": "pc", "type": "ok", "desc": "Fried" } ] },
  { "name": "tea", "cal": 60, "unit": "cup", "type": "ok", "desc": "Milk Sugar" },
  { "name": "coffee", "cal": 80, "unit": "cup", "type": "ok", "desc": "Milk Sugar" },
  { "name": "sandwich", "cal": 250, "unit": "pc", "type": "ok", "desc": "Veg Grilled" },
  { "name": "apple", "cal": 52, "unit": "pc", "type": "good", "desc": "Fruit" },
  { "name": "f1 shake", "cal": 242, "unit": "glass", "type": "good", "desc": "Herbalife" }
];

// --- 2. LIFESTYLE PRESETS ---
const PRESETS = {
    'south': ['idli', 'dosa', 'rice', 'sambar', 'vada', 'curd', 'coffee', 'f1 shake'],
    'north': ['roti', 'dal', 'paneer', 'tea', 'paratha', 'rice', 'rajma', 'f1 shake'],
    'modern': ['sandwich', 'egg', 'oats', 'chicken', 'salad', 'coffee', 'f1 shake'],
    'custom': ['rice', 'dal', 'f1 shake']
};

let foodDB = {};
// Populate DB instantly
MEGA_DB.forEach(item => { foodDB[item.name.toLowerCase()] = item; });
// Try load larger DB in background (fail-safe)
fetch('food.json').then(r=>r.json()).then(d=>d.forEach(i=>foodDB[i.name.toLowerCase()]=i)).catch(e=>console.log("Using core DB"));

let currentMenuMode = 'user';
let currentSlot = '';

const COACH_PLAN = {
    "Monday": { sn1: "5 Soaked Almonds", lun: "Brown Rice + Dal + Salad", sn2: "Green Tea + Roasted Chana", vCal: 340, t: "Body Basics", vid: "b9ztxh-cTHI" },
    "Tuesday": { sn1: "Apple Slices", lun: "Ragi Mudde + Veg Saaru", sn2: "Buttermilk", vCal: 320, t: "Core Strength", vid: "ELpVLwrDR_g" },
    "Wednesday": { sn1: "Boiled Egg / Sprouts", lun: "Millet Rice + Rasam + Veg", sn2: "Papaya Bowl", vCal: 310, t: "Metabolism", vid: "VsAXZ34AJ-k" },
    "Thursday": { sn1: "Cucumber Sticks", lun: "2 Jowar Roti + Palak Paneer", sn2: "Black Coffee (No Sugar)", vCal: 330, t: "Lower Body", vid: "rmmWuI5Jinc" },
    "Friday": { sn1: "Guava with Salt", lun: "Curd Rice + Pomegranate", sn2: "Protein Bar", vCal: 300, t: "Cardio Kick", vid: "8r4Z-ghDI4k" },
    "Saturday": { sn1: "Coconut Water", lun: "Veg Biryani (Less Oil)", sn2: "Roasted Makhana", vCal: 400, t: "Stability", vid: "uKXcLBjWqas" },
    "Sunday": { sn1: "Watermelon Bowl", lun: "Grilled Chicken + Salad", sn2: "Tea + 2 Marie Biscuits", vCal: 280, t: "Mindfulness", vid: "inpok4MKVLM" }
};

window.onload = () => {
    // If state exists, go to App. If not, go to Setup.
    if (!state) { 
        document.getElementById('setup-screen').classList.remove('hide'); 
    } else { 
        if(state.customFoods) foodDB = { ...foodDB, ...state.customFoods }; 
        init(); 
    }
};

// --- SETUP LOGIC ---
function goToLifestyle() {
    const n = document.getElementById('setupName').value;
    const h = parseFloat(document.getElementById('setupH').value);
    const w = parseFloat(document.getElementById('setupW').value);
    if(!n || !h || !w) return alert("Please fill details");
    document.getElementById('setup-screen').classList.add('hide');
    document.getElementById('lifestyle-screen').classList.remove('hide');
}

function finishSetup(style) {
    const n = document.getElementById('setupName').value;
    const h = parseFloat(document.getElementById('setupH').value);
    const w = parseFloat(document.getElementById('setupW').value);
    const g = document.getElementById('setupGender').value;
    const dob = document.getElementById('setupDOB').value;

    let age = 30; 
    if (dob) { const birthDate = new Date(dob); const today = new Date(); age = today.getFullYear() - birthDate.getFullYear(); }
    
    // Calc Goals
    let bmr = (10 * w) + (6.25 * h) - (5 * age) + (g === 'male' ? 5 : -161);
    let dailyGoal = Math.max(1200, Math.round(bmr * 1.2 - 300));
    let idealW = g === 'male' ? (h - 100) - ((h - 150) / 4) : (h - 100) - ((h - 150) / 2);

    state = { 
        name: n, weight: w, height: h, age: age, startW: w, goal: idealW.toFixed(1), 
        waterG: Math.round(w * 35), waterC: 0, calGoal: dailyGoal, consumed: [], 
        startDate: Date.now(), history: {}, todayTasks: {}, 
        lastLogin: new Date().toISOString().split('T')[0], customFoods: {},
        myMenu: PRESETS[style] || PRESETS['custom']
    };
    save();
    location.reload();
}

// --- CORE APP ---
function init() { 
    ['setup-screen','lifestyle-screen'].forEach(id => document.getElementById(id).classList.add('hide')); 
    document.getElementById('main-app').classList.remove('hide'); 
    document.getElementById('userDisp').innerText = state.name; 
    checkNewDay(); 
    updateUI(); 
    renderMeals(); 
}

function updateUI() {
    // 1. Weight Logic (Days to Goal)
    document.getElementById('curW').innerText = state.weight;
    document.getElementById('targetW').innerText = state.goal;
    
    // Progress Bar
    let lost = state.startW - state.weight;
    let totalToLose = state.startW - state.goal;
    let progress = totalToLose > 0 ? (lost / totalToLose) * 100 : 0;
    document.getElementById('wBar').style.width = Math.max(0, Math.min(100, progress)) + '%';
    document.getElementById('lossText').innerText = lost > 0 ? `${lost.toFixed(1)} kg lost` : "Let's start!";

    // Days Remaining Calculation
    let diff = state.weight - state.goal;
    if (diff <= 0) {
        document.getElementById('daysToGoal').innerText = "Done!";
    } else {
        // Estimate: Assume 0.1kg loss per day if no history, else calculate real rate
        let daysPassed = Math.max(1, (Date.now() - state.startDate) / (1000 * 60 * 60 * 24));
        let rate = lost > 0 ? (lost / daysPassed) : 0.05; // Fallback rate
        let daysLeft = Math.ceil(diff / rate);
        document.getElementById('daysToGoal').innerText = daysLeft > 365 ? "> 1 Yr" : daysLeft + " Days";
    }

    // 2. Water Logic
    document.getElementById('watV').innerText = state.waterC;
    document.getElementById('watGoal').innerText = state.waterG;
    document.getElementById('watBar').style.width = Math.min(100, (state.waterC / state.waterG) * 100) + '%';
    
    updateInfoUI();
}

function updateInfoUI() {
    const total = state.consumed.reduce((sum, item) => sum + item.cal, 0);
    document.getElementById('headerCal').innerText = total;
    document.getElementById('headerGoal').innerText = state.calGoal;
    document.getElementById('dispRemaining').innerText = Math.max(0, state.calGoal - total);
    document.getElementById('dispGoal').innerText = state.calGoal + " kcal";
    const offset = (2 * Math.PI * 40) - (Math.min(total, state.calGoal) / state.calGoal) * (2 * Math.PI * 40);
    document.getElementById('calRing').style.strokeDashoffset = offset;
    renderLog();
}

// --- MEALS & MENU ---
function renderMeals() {
    const d = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const p = COACH_PLAN[d] || COACH_PLAN["Monday"];
    document.getElementById('wTitle').innerText = p.t; 
    document.getElementById('wThumb').src = `https://img.youtube.com/vi/${p.vid}/maxresdefault.jpg`;

    if (currentMenuMode === 'user') {
        document.getElementById('mealContainer').innerHTML = `
            ${renderSearchSlot('Breakfast', 'Tap to add...')}
            ${renderSearchSlot('Mid-Snack', 'Tap to add...')}
            ${renderSearchSlot('Lunch', 'Tap to add...')}
            ${renderSearchSlot('Eve-Snack', 'Tap to add...')}
            ${renderSearchSlot('Dinner', 'Tap to add...')}`;
    } else {
        document.getElementById('mealContainer').innerHTML = `<div class="bg-green-50 p-4 rounded-[2rem] flex items-center gap-4 border border-green-100 shadow-sm"><div class="text-green-600 text-xl w-8 text-center"><i class="fas fa-leaf"></i></div><div><p class="text-[9px] font-bold text-green-800 uppercase mb-0.5">Breakfast</p><p class="font-extrabold text-sm text-marine">Formula 1 Shake</p></div><button onclick="quickLog('Coach Breakfast', 242)" class="ml-auto text-lg text-green-500"><i class="fas fa-plus-circle"></i></button></div>`;
    }
}

function renderSearchSlot(title, ph) {
    const found = state.consumed.find(i => i.slot === title);
    if (found) {
        return `<div class="bg-green-50 p-4 rounded-[2rem] flex justify-between items-center border border-green-100 shadow-sm"><div class="flex items-center gap-4"><div class="bg-white w-10 h-10 rounded-full flex items-center justify-center text-green-500 shadow-sm"><i class="fas fa-check"></i></div><div><p class="text-[9px] font-bold text-green-800 uppercase mb-0.5">${title}</p><p class="font-extrabold text-sm text-marine">${found.name}</p></div></div><span class="text-xs font-black text-green-600">${found.cal} kcal</span></div>`;
    } else {
        return `<div class="bg-mist p-4 rounded-[2rem] flex justify-between items-center border border-slate-50 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors" onclick="openMyMenuDropdown('${title}')"><div class="flex items-center gap-4"><div class="bg-white w-10 h-10 rounded-full flex items-center justify-center text-slate-300 shadow-sm"><i class="fas fa-plus"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">${title}</p><p class="font-extrabold text-sm text-marine">${ph}</p></div></div></div>`;
    }
}

function openMyMenuDropdown(slot) {
    currentSlot = slot;
    const grid = document.getElementById('myMenuGrid');
    grid.innerHTML = state.myMenu.map(key => {
        const item = foodDB[key] || { variants: [{type:'ok'}] };
        return `<div onclick="selectFood('${key}'); document.getElementById('myMenuModal').classList.add('hide')" class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-50 hover:border-punch bg-mist cursor-pointer"><div class="w-10 h-10 rounded-full bg-white text-marine flex items-center justify-center text-lg shadow-sm"><i class="fas fa-utensils"></i></div><span class="text-xs font-bold text-marine capitalize">${key}</span></div>`;
    }).join('');
    document.getElementById('myMenuModal').classList.remove('hide');
}

function selectFood(name) {
    if(!foodDB[name]) { showFinalModal(name, 100, "Standard", "ok"); return; }
    const item = foodDB[name];
    if(item.variants) {
        document.getElementById('prepOptions').innerHTML = item.variants.map((v, i) => `<div onclick="selectVariant('${name}', ${i})" class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center cursor-pointer shadow-sm mb-2"><div><p class="font-bold text-marine text-sm">${v.name}</p><p class="text-[10px] text-slate-400">${v.desc}</p></div><p class="text-xs font-black text-punch">${v.cal}</p></div>`).join('');
        document.getElementById('prepModal').classList.remove('hide');
    } else {
        showFinalModal(item.name, item.cal, item.desc, item.type);
    }
}
function selectVariant(p, i) { const v = foodDB[p].variants[i]; document.getElementById('prepModal').classList.add('hide'); showFinalModal(v.name, v.cal, v.desc, v.type); }
function showFinalModal(n, c, d, t) {
    let tempFood = { name: n, calPerUnit: c, slot: currentSlot };
    document.getElementById('resName').innerText = n; document.getElementById('resCal').innerText = c;
    document.getElementById('analysisResult').classList.remove('hide');
    document.querySelector('#analysisResult button').onclick = () => {
        const qty = document.getElementById('resQty').value;
        state.consumed.unshift({ ...tempFood, cal: Math.round(c*qty), qty: qty, time: Date.now() });
        save(); updateUI(); renderMeals();
        document.getElementById('analysisResult').classList.add('hide');
    };
}

// --- UTILS ---
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function selectGender(g) { document.getElementById('setupGender').value = g; document.getElementById('btnMale').className = g==='male'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; document.getElementById('btnFemale').className = g==='female'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; }
function addW(v) { state.waterC += v; updateUI(); save(); }
function openW() { document.getElementById('wModal').classList.remove('hide'); }
function closeW() { document.getElementById('wModal').classList.add('hide'); }
function saveW() { const v = parseFloat(document.getElementById('wIn').value); if(v) { state.weight = v; updateUI(); save(); closeW(); } }
function showT(t) { ['home','workout','info'].forEach(id=>document.getElementById(id+'-section').classList.add('hide')); document.getElementById(t+'-section').classList.remove('hide'); }
function switchMenu(m) { currentMenuMode = m; renderMeals(); }
function checkNewDay() { const t = new Date().toISOString().split('T')[0]; if(state.lastLogin!==t) { state.lastLogin=t; state.waterC=0; state.consumed=[]; save(); } }
function renderLog() { document.getElementById('logContainer').innerHTML = state.consumed.map((i,x) => `<div class="bg-white p-4 rounded-2xl border border-slate-50 flex justify-between items-center"><div><h4 class="font-bold text-marine text-sm">${i.name}</h4><p class="text-[10px] text-slate-400">${i.cal} kcal</p></div><button onclick="state.consumed.splice(${x},1);save();updateUI();" class="text-slate-300"><i class="fas fa-trash"></i></button></div>`).join(''); }
function shareWhatsApp() {
    const total = state.consumed.reduce((sum, i) => sum + i.cal, 0);
    const diff = (state.weight - state.goal).toFixed(1);
    const text = `*ZestUp Pro Update* 🚀%0a🔥 Calories: ${total}/${state.calGoal}%0a⚖️ Weight: ${state.weight}kg (Target: ${state.goal}kg)%0a💧 Water: ${state.waterC}ml%0a%0aTrack with me: https://krishnamu045-rgb.github.io/fitflow/`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
}
function showSuggestions(val) {
    const list = document.getElementById('suggestions');
    if (val.length < 1) { list.classList.add('hide'); return; }
    list.classList.remove('hide');
    const matches = Object.keys(foodDB).filter(k => k.includes(val.toLowerCase()));
    list.innerHTML = matches.map(f => `<div onclick="selectFood('${f}')" class="p-3 border-b border-slate-50 hover:bg-mist cursor-pointer"><span class="font-bold text-marine capitalize text-sm">${f}</span></div>`).join('');
}
// --- TASKS TOGGLE ---
function toggleTask(task) {
    state.todayTasks[task] = !state.todayTasks[task];
    const btn = document.getElementById('task-' + task);
    if(state.todayTasks[task]) {
        btn.classList.add('border-green-200', 'bg-green-50');
        btn.querySelector('div').classList.replace('border-slate-200', 'bg-green-500');
        btn.querySelector('div').classList.replace('border-slate-200', 'border-green-500');
        btn.querySelector('i').classList.remove('opacity-0');
        btn.querySelector('i').classList.add('text-white');
    } else {
        btn.classList.remove('border-green-200', 'bg-green-50');
        btn.querySelector('div').classList.replace('bg-green-500', 'border-slate-200');
        btn.querySelector('div').classList.replace('border-green-500', 'border-slate-200');
        btn.querySelector('i').classList.add('opacity-0');
    }
    save();
}
function launchWorkout() { const d = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]; const p = COACH_PLAN[d] || COACH_PLAN["Monday"]; window.open(`https://www.youtube.com/watch?v=${p.vid}`, '_blank'); }

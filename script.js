const KEY = "ZESTUP_PRO_V17_0";
let state = null;
try { state = JSON.parse(localStorage.getItem(KEY)); } catch(e) { console.error("Data Reset"); localStorage.removeItem(KEY); }

let foodDB = {}; 
let tempFood = null; 
let currentMenuMode = 'user'; 
let currentSlot = ''; 

// --- LIFESTYLE PRESETS (AUTO-LOAD LISTS) ---
// These allow the app to work INSTANTLY without waiting for the database
const LIFESTYLES = {
    'south': ['idli', 'dosa', 'vada', 'sambar', 'rice', 'curd rice', 'chicken', 'fish', 'egg', 'tea', 'coffee', 'f1 shake', 'afresh', 'upma', 'pongal', 'biryani'],
    'north': ['roti', 'dal', 'paneer', 'rice', 'rajma', 'chana', 'parotta', 'chicken', 'egg', 'tea', 'coffee', 'f1 shake', 'afresh', 'poha', 'samosa'],
    'modern': ['oats', 'sandwich', 'salad', 'grilled chicken', 'f1 shake', 'afresh', 'protein bar', 'apple', 'banana', 'egg', 'juice', 'pasta', 'burger', 'coffee']
};

// --- APP INIT (IMMEDIATE) ---
if (!state) { 
    document.getElementById('setup-screen').classList.remove('hide'); 
} else { 
    if(state.customFoods) foodDB = { ...foodDB, ...state.customFoods }; 
    init(); 
}

// Load Data in Background
fetch('food.json?v=17.0')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => { foodDB[item.name.toLowerCase()] = item; });
        console.log("DB Loaded");
    })
    .catch(err => console.warn("DB Failed (Offline Mode)"));

const CATEGORIES = {
    'tiffin': ['idli', 'dosa', 'vada', 'puri', 'upma', 'pongal', 'poha', 'parotta', 'oats', 'chapati'],
    'indian': ['rice', 'biryani', 'curry', 'dal', 'sambar', 'rasam', 'chicken', 'fish', 'mutton', 'paneer', 'mushroom', 'roti', 'naan', 'egg', 'rajma', 'chana'],
    'chinese': ['noodles', 'fried rice', 'momos', 'manchurian', 'spring roll', 'soup', 'schezwan'],
    'western': ['pizza', 'burger', 'kfc', 'pasta', 'taco', 'nachos', 'sandwich', 'fries', 'subway'],
    'bakery': ['puff', 'roll', 'cake', 'samosa', 'chips', 'donut', 'biscuit', 'bun', 'dilpasand', 'tea', 'coffee', 'milkshake', 'coke', 'soft drink', 'ice cream'],
    'fresh': ['apple', 'banana', 'mango', 'grapes', 'papaya', 'watermelon', 'pomegranate', 'salad', 'corn', 'cucumber', 'carrot', 'sprouts', 'avocado', 'coconut', 'juice'],
    'sweets': ['jamun', 'rasgulla', 'mysore pak', 'laddu', 'jalebi', 'kaju', 'payasam', 'cake', 'donut', 'brownie', 'ice cream', 'kulfi', 'chocolate']
};

const COACH_PLAN = {
    "Monday": { sn1: "5 Soaked Almonds", lun: "Brown Rice + Dal + Salad", sn2: "Green Tea + Roasted Chana", vCal: 340, t: "Body Basics", vid: "b9ztxh-cTHI" },
    "Tuesday": { sn1: "Apple Slices", lun: "Ragi Mudde + Veg Saaru", sn2: "Buttermilk", vCal: 320, t: "Core Strength", vid: "ELpVLwrDR_g" },
    "Wednesday": { sn1: "Boiled Egg / Sprouts", lun: "Millet Rice + Rasam + Veg", sn2: "Papaya Bowl", vCal: 310, t: "Metabolism", vid: "VsAXZ34AJ-k" },
    "Thursday": { sn1: "Cucumber Sticks", lun: "2 Jowar Roti + Palak Paneer", sn2: "Black Coffee (No Sugar)", vCal: 330, t: "Lower Body", vid: "rmmWuI5Jinc" },
    "Friday": { sn1: "Guava with Salt", lun: "Curd Rice + Pomegranate", sn2: "Protein Bar", vCal: 300, t: "Cardio Kick", vid: "8r4Z-ghDI4k" },
    "Saturday": { sn1: "Coconut Water", lun: "Veg Biryani (Less Oil)", sn2: "Roasted Makhana", vCal: 400, t: "Stability", vid: "uKXcLBjWqas" },
    "Sunday": { sn1: "Watermelon Bowl", lun: "Grilled Chicken + Salad", sn2: "Tea + 2 Marie Biscuits", vCal: 280, t: "Mindfulness", vid: "inpok4MKVLM" }
};

let surveySelections = []; 

// --- SETUP FLOW ---
function goToLifestyle() {
    const n = document.getElementById('setupName').value;
    const h = parseFloat(document.getElementById('setupH').value);
    const w = parseFloat(document.getElementById('setupW').value);
    if(!n || !h || !w) return alert("Please fill all details");
    document.getElementById('setup-screen').classList.add('hide');
    document.getElementById('lifestyle-screen').classList.remove('hide');
}

function selectLifestyle(style) {
    surveySelections = LIFESTYLES[style] || LIFESTYLES['modern'];
    finishSetup();
}

function finishSetup() {
    const n = document.getElementById('setupName').value;
    const h = parseFloat(document.getElementById('setupH').value);
    const w = parseFloat(document.getElementById('setupW').value);
    const g = document.getElementById('setupGender').value;
    const dob = document.getElementById('setupDOB').value;
    let age = 30; if (dob) { const birthDate = new Date(dob); const today = new Date(); age = today.getFullYear() - birthDate.getFullYear(); }
    let bmr = (10 * w) + (6.25 * h) - (5 * age) + (g === 'male' ? 5 : -161);
    let dailyGoal = Math.max(1200, Math.round(bmr * 1.2 - 300));
    let idealW = g === 'male' ? (h - 100) - ((h - 150) / 4) : (h - 100) - ((h - 150) / 2);
    
    // Safety check for invalid goal
    if (idealW < 40) idealW = w - 5; 

    state = { 
        name: n, weight: w, height: h, age: age, startW: w, goal: idealW.toFixed(1), 
        waterG: Math.round(w * 35), waterC: 0, calGoal: dailyGoal, consumed: [], 
        startDate: Date.now(), history: {}, todayTasks: {}, 
        lastLogin: new Date().toISOString().split('T')[0], customFoods: {}, 
        myMenu: surveySelections 
    };
    save(); 
    location.reload();
}

// --- HOME & MENU LOGIC ---
function openMyMenuDropdown(slotName) {
    currentSlot = slotName; 
    const grid = document.getElementById('myMenuGrid');
    const myItems = state.myMenu || []; 
    if(myItems.length === 0) { grid.innerHTML = `<div class="col-span-2 text-center text-slate-400 text-xs font-bold py-4">No items.<br>Use "Search Database" below.</div>`; } 
    else { grid.innerHTML = myItems.map(itemKey => {
        const dbItem = foodDB[itemKey] || { variants: [{ type: 'ok' }] }; 
        const isBad = (dbItem.variants && dbItem.variants[0].type === 'bad') || dbItem.type === 'bad';
        const colorClass = isBad ? 'text-orange-500 bg-orange-50' : 'text-green-500 bg-green-50';
        return `<div onclick="selectFood('${itemKey}'); document.getElementById('myMenuModal').classList.add('hide')" class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-50 hover:border-punch transition-all cursor-pointer bg-mist"><div class="w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-lg"><i class="fas fa-utensils"></i></div><span class="text-xs font-bold text-marine capitalize">${itemKey}</span></div>`;
    }).join(''); }
    document.getElementById('myMenuModal').classList.remove('hide');
}

function selectFood(name) { 
    if(!foodDB[name]) { showFinalModal(name, 100, "Standard", "ok"); return; }
    const item = foodDB[name]; 
    const searchBar = document.getElementById('foodName'); if(searchBar) searchBar.value = ""; 
    const sugg = document.getElementById('suggestions'); if(sugg) sugg.classList.add('hide');
    const prepDiv = document.getElementById('prepOptions'); if(prepDiv) prepDiv.innerHTML = ""; 
    if (item.variants) { 
        if(prepDiv) { prepDiv.innerHTML = item.variants.map((v, i) => `<div onclick="selectVariant('${name}', ${i})" class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center cursor-pointer shadow-sm hover:border-punch transition-all"><div><p class="font-bold text-marine text-sm">${v.name}</p><p class="text-[10px] text-slate-400">${v.desc}</p></div><p class="text-xs font-black text-punch">${v.cal} kcal</p></div>`).join(''); }
        document.getElementById('prepModal').classList.remove('hide'); 
    } else { showFinalModal(item.name, item.cal, item.desc || "Standard portion", item.type); } 
}
function selectVariant(parentName, index) { const item = foodDB[parentName].variants[index]; document.getElementById('prepModal').classList.add('hide'); showFinalModal(item.name, item.cal, item.desc, item.type); }
function showFinalModal(name, cal, desc, type) { 
    tempFood = { name: name, calPerUnit: cal, desc: desc, type: type, slot: currentSlot }; 
    document.getElementById('resName').innerText = name; document.getElementById('resCal').innerText = cal + " kcal"; document.getElementById('resDesc').innerText = desc; 
    const badge = document.getElementById('resBadge'); 
    if(type === 'good') { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600"; badge.innerText = "Good Choice"; } 
    else if(type === 'bad') { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600"; badge.innerText = "Limit This"; } 
    else { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600"; badge.innerText = "Moderate"; } 
    document.getElementById('analysisResult').classList.remove('hide'); document.getElementById('resQty').value = 1; 
}
function confirmAdd() { 
    if(!tempFood) return; 
    const qty = parseFloat(document.getElementById('resQty').value); 
    const totalCal = Math.round(tempFood.calPerUnit * qty); 
    state.consumed.unshift({ name: tempFood.name, cal: totalCal, qty: qty, time: Date.now(), slot: tempFood.slot }); 
    save(); updateInfoUI(); renderMeals(); 
    document.getElementById('analysisResult').classList.add('hide'); 
    currentSlot = ''; 
}

// --- APP UTILS ---
function init() { document.getElementById('setup-screen').classList.add('hide'); document.getElementById('lifestyle-screen').classList.add('hide'); document.getElementById('main-app').classList.remove('hide'); document.getElementById('userDisp').innerText = state.name; checkNewDay(); checkHomeDisclaimer(); updateUI(); updateInfoUI(); renderMeals(); renderTasks(); renderHistory(); }
function switchMenu(mode) { currentMenuMode = mode; const userBtn = document.getElementById('tab-user'); const coachBtn = document.getElementById('tab-coach'); if(mode === 'user') { userBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white shadow-sm text-marine transition-all"; coachBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 transition-all"; } else { coachBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-punch text-white shadow-sm transition-all"; userBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 transition-all"; } renderMeals(); }

function renderMeals() {
    const d = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const p = COACH_PLAN[d] || COACH_PLAN["Monday"];
    document.getElementById('wTitle').innerText = p.t; document.getElementById('wThumb').src = `https://img.youtube.com/vi/${p.vid}/maxresdefault.jpg`;
    if (currentMenuMode === 'user') {
        document.getElementById('mealContainer').innerHTML = `${renderSearchSlot('Breakfast', 'Tap to pick...')}${renderSearchSlot('Mid-Snack', 'Tap to pick...')}${renderSearchSlot('Lunch', 'Tap to pick...')}${renderSearchSlot('Eve-Snack', 'Tap to pick...')}${renderSearchSlot('Dinner', 'Tap to pick...')}`;
    } else {
        document.getElementById('mealContainer').innerHTML = `<div class="bg-green-50 p-4 rounded-[2rem] flex items-center gap-4 border border-green-100 shadow-sm"><div class="text-green-600 text-xl w-8 text-center"><i class="fas fa-leaf"></i></div><div><p class="text-[9px] font-bold text-green-800 uppercase mb-0.5">Breakfast (Fixed)</p><p class="font-extrabold text-sm text-marine">Formula 1 Shake + Afresh</p></div><button onclick="quickLog('Coach Breakfast', 242)" class="ml-auto text-lg text-green-500"><i class="fas fa-plus-circle"></i></button></div><div class="bg-mist p-4 rounded-[2rem] flex items-center gap-4 border border-slate-50"><div class="text-orange-400 text-xl w-8 text-center"><i class="fas fa-apple-alt"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Mid-Snack Idea</p><p class="font-extrabold text-sm text-marine">${p.sn1}</p></div></div><div class="bg-mist p-4 rounded-[2rem] flex items-center gap-4 border border-slate-50"><div class="text-blue-400 text-xl w-8 text-center"><i class="fas fa-utensils"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Lunch Suggestion</p><p class="font-extrabold text-sm text-marine">${p.lun}</p></div></div><div class="bg-mist p-4 rounded-[2rem] flex items-center gap-4 border border-slate-50"><div class="text-purple-400 text-xl w-8 text-center"><i class="fas fa-mug-hot"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Evening Snack</p><p class="font-extrabold text-sm text-marine">${p.sn2}</p></div></div><div class="bg-green-50 p-4 rounded-[2rem] flex items-center gap-4 border border-green-100 shadow-sm"><div class="text-green-600 text-xl w-8 text-center"><i class="fas fa-moon"></i></div><div><p class="text-[9px] font-bold text-green-800 uppercase mb-0.5">Dinner (Fixed)</p><p class="font-extrabold text-sm text-marine">Formula 1 Shake</p></div><button onclick="quickLog('Coach Dinner', 242)" class="ml-auto text-lg text-green-500"><i class="fas fa-plus-circle"></i></button></div>`;
    }
}

function renderSearchSlot(title, ph) {
    const found = state.consumed.find(i => i.slot === title);
    if (found) {
        return `<div class="bg-green-50 p-4 rounded-[2rem] flex justify-between items-center border border-green-100 shadow-sm"><div class="flex items-center gap-4"><div class="bg-white w-10 h-10 rounded-full flex items-center justify-center text-green-500 shadow-sm"><i class="fas fa-check"></i></div><div><p class="text-[9px] font-bold text-green-800 uppercase mb-0.5">${title}</p><p class="font-extrabold text-sm text-marine">${found.name}</p></div></div><span class="text-xs font-black text-green-600">${found.cal} kcal</span></div>`;
    } else {
        let swapBtn = (title === 'Breakfast' || title === 'Dinner') ? `<button onclick="triggerHerbalifeUpsell('${title}')" class="text-[9px] font-black bg-white border border-green-100 text-green-500 px-3 py-2 rounded-xl shadow-sm hover:bg-green-50 animate-pulse"><i class="fas fa-sync-alt mr-1"></i>Swap</button>` : '';
        return `<div class="bg-mist p-4 rounded-[2rem] flex justify-between items-center border border-slate-50 shadow-sm relative overflow-hidden group"><div class="flex items-center gap-4 cursor-pointer" onclick="openMyMenuDropdown('${title}')"><div class="bg-white w-10 h-10 rounded-full flex items-center justify-center text-slate-400 shadow-sm"><i class="fas fa-plus"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">${title}</p><p class="font-extrabold text-sm text-marine">${ph}</p></div></div>${swapBtn}</div>`;
    }
}

function triggerHerbalifeUpsell(mealType) {
    const modalHTML = `<div id="upsellModal" class="fixed inset-0 z-[600] bg-marine/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in"><div class="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-4 animate-slide-up relative"><button onclick="closeUpsell()" class="absolute top-4 right-4 text-slate-300 hover:text-punch"><i class="fas fa-times text-xl"></i></button><div class="text-center"><div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-500 text-2xl shadow-sm"><i class="fas fa-leaf"></i></div><h3 class="text-xl font-black uppercase tracking-tight text-marine">Smart Swap</h3><p class="text-xs font-bold text-slate-400 mt-1">Upgrade your ${mealType} with Nutrition.</p></div><div class="space-y-2"><button onclick="confirmShake(242, 'Formula 1 Shake')" class="w-full p-3 rounded-xl border border-slate-100 bg-mist flex justify-between items-center hover:border-green-400 transition-all"><span class="font-bold text-marine text-xs">Standard (F1)</span><span class="text-[10px] font-black text-slate-400">242 kcal</span></button><button onclick="confirmShake(360, 'Shake + Protein (PDM)')" class="w-full p-3 rounded-xl border border-slate-100 bg-mist flex justify-between items-center hover:border-green-400 transition-all"><span class="font-bold text-marine text-xs">Shake + Protein (PDM)</span><span class="text-[10px] font-black text-slate-400">360 kcal</span></button><button onclick="confirmShake(260, 'Power Combo (F1+F2+PPP)')" class="w-full p-3 rounded-xl border-2 border-green-200 bg-green-50 flex justify-between items-center relative overflow-hidden"><div class="absolute top-0 left-0 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-br-lg">BEST</div><div class="flex flex-col text-left ml-1"><span class="font-black text-marine text-xs">Power Combo</span><span class="text-[9px] font-bold text-slate-500">F1 + Multivit + PPP</span></div><span class="text-[10px] font-black text-green-600">~260 kcal</span></button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
function closeUpsell() { const m = document.getElementById('upsellModal'); if(m) m.remove(); }
function confirmShake(cal, name) { quickLog(name, cal); closeUpsell(); }
function closePrep() { document.getElementById('prepModal').classList.add('hide'); }
function cancelAdd() { document.getElementById('analysisResult').classList.add('hide'); }
function quickLog(name, cal) { state.consumed.unshift({ name: name, cal: cal, qty: 1, time: Date.now() }); save(); updateInfoUI(); alert(`Added ${name}`); }
function deleteItem(index) { state.consumed.splice(index, 1); save(); updateInfoUI(); renderMeals(); }
function renderLog() { const list = document.getElementById('logContainer'); if(state.consumed.length === 0) { list.innerHTML = `<div class="text-center py-8 text-slate-300 text-xs font-bold">No meals logged yet.</div>`; return; } list.innerHTML = state.consumed.map((item, i) => `<div class="bg-white p-4 rounded-2xl border flex justify-between items-center"><div><h4 class="font-bold text-marine text-sm">${item.name}</h4><p class="text-[10px] text-slate-400 font-bold">${item.cal} kcal</p></div><button onclick="deleteItem(${i})" class="text-slate-300 p-2"><i class="fas fa-trash-alt"></i></button></div>`).join(''); }
function checkHomeDisclaimer() { if (state.lastDisclaimerDate !== new Date().toISOString().split('T')[0]) document.getElementById('homeDisclaimerModal').classList.remove('hide'); }
function acceptHomeDisclaimer() { state.lastDisclaimerDate = new Date().toISOString().split('T')[0]; save(); document.getElementById('homeDisclaimerModal').classList.add('hide'); }
function checkFoodDisclaimer() { if (state.lastFoodDisclaimerDate !== new Date().toISOString().split('T')[0]) document.getElementById('foodDisclaimerModal').classList.remove('hide'); }

// --- FIXED: GOAL & TARGET LOGIC ---
function updateUI() { 
    document.getElementById('curW').innerText = state.weight; 
    document.getElementById('targetW').innerText = state.goal;
    
    // Calculate Days to Goal (Simple Estimate: 0.5kg/week = ~0.07kg/day)
    const diff = state.weight - state.goal;
    if (diff <= 0) {
        document.getElementById('daysToGoal').innerText = "DONE!";
        document.getElementById('wBar').style.width = '100%';
    } else {
        const estDays = Math.ceil(diff / 0.07);
        document.getElementById('daysToGoal').innerText = estDays;
        const totalLossNeeded = state.startW - state.goal;
        const currentLoss = state.startW - state.weight;
        const percent = Math.max(0, Math.min(100, (currentLoss / totalLossNeeded) * 100));
        document.getElementById('wBar').style.width = percent + '%';
    }

    // Water Update
    document.getElementById('watV').innerText = state.waterC; 
    document.getElementById('watGoal').innerText = state.waterG;
    document.getElementById('watBar').style.width = Math.min(100, (state.waterC / state.waterG) * 100) + '%'; 
}

function updateInfoUI() { const total = state.consumed.reduce((sum, item) => sum + item.cal, 0); document.getElementById('headerCal').innerText = total; document.getElementById('headerGoal').innerText = state.calGoal; document.getElementById('dispRemaining').innerText = Math.max(0, state.calGoal - total); document.getElementById('dispGoal').innerText = state.calGoal + " kcal"; const offset = (2 * Math.PI * 40) - (total / state.calGoal) * (2 * Math.PI * 40); document.getElementById('calRing').style.strokeDashoffset = offset; renderLog(); }
function browseCategory(cat) { const items = CATEGORIES[cat]; const listContainer = document.getElementById('catListContent'); document.getElementById('catGrid').classList.add('hide'); document.getElementById('catView').classList.remove('hide'); let html = ''; let foundCount = 0; items.forEach(keyword => { const matchKey = Object.keys(foodDB).find(k => k.includes(keyword)); if(matchKey) { foundCount++; const food = foodDB[matchKey]; let badgeColor = food.variants && food.variants[0].type === 'bad' ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'; html += `<div onclick="selectFood('${matchKey}')" class="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center cursor-pointer mb-2 btn-click"><div><p class="font-bold text-marine capitalize text-sm">${matchKey}</p><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tap to add</p></div><div class="w-8 h-8 rounded-full ${badgeColor} flex items-center justify-center"><i class="fas fa-plus"></i></div></div>`; } }); if (foundCount === 0) html = `<div class="text-center py-10 text-slate-400 font-bold text-xs">Loading items...</div>`; listContainer.innerHTML = html; }
function closeCategory() { document.getElementById('catView').classList.add('hide'); document.getElementById('catGrid').classList.remove('hide'); }
function showSuggestions(val) { val = val.toLowerCase(); const list = document.getElementById('suggestions'); if(val.length < 1) { list.classList.add('hide'); return; } const matches = Object.keys(foodDB).filter(k => k.includes(val)); if(matches.length === 0) { list.innerHTML = `<div class="p-3 text-center text-xs text-slate-400">No results. Try Fuel tab.</div>`; list.classList.remove('hide'); return; } list.innerHTML = matches.map(f => `<div onclick="selectFood('${f}')" class="p-3 border-b border-slate-50 hover:bg-mist cursor-pointer flex justify-between items-center transition-all"><span class="font-bold text-marine capitalize text-sm">${f}</span></div>`).join(''); list.classList.remove('hide'); }
function shareWhatsApp() { const total = state.consumed.reduce((sum, item) => sum + item.cal, 0); const remainingWeight = (state.weight - state.goal).toFixed(1); const daysPassed = Math.max(1, Math.floor((Date.now() - state.startDate) / 86400000)); const rate = (state.startW - state.weight) > 0 ? (state.startW - state.weight) / daysPassed : 0.071; let estDays = Math.ceil(remainingWeight / rate); let timeStr = remainingWeight <= 0 ? "Goal Reached! 🎉" : (estDays > 30 ? (estDays / 30).toFixed(1) + " Months" : estDays + " Days"); const text = `*ZestUp Pro Update* 🚀%0a%0a*Status:*%0a🔥 Calories: ${total}/${state.calGoal}%0a⚖️ Current: ${state.weight}kg%0a🎯 Target Weight: ${state.goal}kg%0a⏳ Est. Time: ${timeStr}%0a%0a🔗 *Open App:* https://krishnamu045-rgb.github.io/fitflow/`; window.open(`https://wa.me/?text=${text}`, '_blank'); }
function showT(tab) { ['home','workout','info'].forEach(t => document.getElementById(`${t}-section`).classList.add('hide')); ['nav-home','nav-workout','nav-info'].forEach(t => document.getElementById(t).className = 'flex flex-col items-center gap-1 text-slate-300'); document.getElementById(`${tab}-section`).classList.remove('hide'); document.getElementById(`nav-${tab}`).className = 'flex flex-col items-center gap-1 nav-active'; if(tab === 'workout') { renderW(); } if(tab === 'info') checkFoodDisclaimer(); }
function selectGender(g) { document.getElementById('setupGender').value = g; document.getElementById('btnMale').className = g==='male'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; document.getElementById('btnFemale').className = g==='female'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; }
function addW(v) { state.waterC = Math.max(0, state.waterC + v); updateUI(); save(); }
function openW() { document.getElementById('wModal').classList.remove('hide'); }
function closeW() { document.getElementById('wModal').classList.add('hide'); }
function saveW() { const v = parseFloat(document.getElementById('wIn').value); if(v) { state.weight = v; updateUI(); save(); closeW(); } }
function toggleTask(task) { state.todayTasks[task] = !state.todayTasks[task]; const today = new Date().toISOString().split('T')[0]; let score = 0; if (state.todayTasks.mShake) score++; if (state.todayTasks.nShake) score++; if (state.todayTasks.water) score++; if (state.todayTasks.workout) score++; state.history[today] = score; renderTasks(); renderHistory(); save(); }
function renderTasks() { ['mShake','nShake','water','workout'].forEach(k => { const b = document.getElementById('task-'+k); if(state.todayTasks[k]) b.classList.add('check-active'); else b.classList.remove('check-active'); }); }
function renderHistory() { const container = document.getElementById('historyContainer'); let html = ''; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().split('T')[0]; const s = state.history && state.history[k] ? state.history[k] : 0; let bg = s === 4 ? "bg-punch text-white" : (s > 0 ? "bg-orange-100 text-punch" : "bg-white text-slate-300"); html += `<div class="flex flex-col items-center gap-1"><div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${bg} border border-slate-100">${s || '-'}</div></div>`; } container.innerHTML = html; }
function renderW() { const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; const d = days[new Date().getDay()]; const p = COACH_PLAN[d]; document.getElementById('wTitle').innerText = p.t; document.getElementById('wThumb').src = `https://img.youtube.com/vi/${p.vid}/maxresdefault.jpg`; }
function launchWorkout() { const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; const d = days[new Date().getDay()]; const p = COACH_PLAN[d]; window.open(`https://www.youtube.com/watch?v=${p.vid}`, '_blank'); }
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function checkNewDay() { const today = new Date().toISOString().split('T')[0]; if (state.lastLogin !== today) { state.lastLogin = today; state.waterC = 0; state.consumed = []; state.todayTasks = {}; save(); } }
function enableNotifications() { Notification.requestPermission(); }

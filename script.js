const KEY = "ZESTUP_PRO_V13";
let state = JSON.parse(localStorage.getItem(KEY));
let foodDB = {}; 
let tempFood = null; 

// MENU MAPPINGS (Which category shows which foods)
const CATEGORIES = {
    'tiffin': ['idli', 'dosa', 'vada', 'puri', 'upma', 'pongal', 'chapati', 'parotta', 'poha', 'oats'],
    'meals': ['rice', 'biryani', 'curry', 'dal', 'sambar', 'rasam', 'chicken', 'fish', 'mutton', 'paneer', 'mushroom', 'roti', 'naan', 'egg'],
    'junk': ['pizza', 'burger', 'kfc', 'noodles', 'fried rice', 'momos', 'roll', 'puff', 'cake', 'samosa', 'chips', 'nachos', 'taco', 'donut', 'ice cream'],
    'fresh': ['apple', 'banana', 'mango', 'grapes', 'papaya', 'watermelon', 'pomegranate', 'salad', 'corn', 'cucumber', 'carrot', 'sprouts', 'avocado'],
    'sips': ['tea', 'coffee', 'milk', 'buttermilk', 'coke', 'soft drink', 'milkshake', 'tender coconut', 'beer'],
    'herbalife': ['f1 shake', 'pdm', 'afresh', 'protein bar', 'multivitamin', 'cell-u-loss', 'herbal control', 'aloe concentrate']
};

const CONTENT = {
    "Monday": { veg: "Brown Rice + Sambhar", non: "Brown Rice + Fish Curry", vCal: 360, nCal: 420, vid: "b9ztxh-cTHI", t: "Body Basics" },
    "Tuesday": { veg: "Ragi Mudde + Veg Saaru", non: "Ragi Mudde + Chicken Saaru", vCal: 340, nCal: 390, vid: "ELpVLwrDR_g", t: "Core Strength" },
    "Wednesday": { veg: "Millet Rice + Rasam", non: "Millet Rice + Egg Roast", vCal: 310, nCal: 360, vid: "VsAXZ34AJ-k", t: "Metabolism" },
    "Thursday": { veg: "2 Jowar Rotis + Veg Fry", non: "2 Jowar Rotis + Grill Chicken", vCal: 320, nCal: 380, vid: "rmmWuI5Jinc", t: "Lower Body" },
    "Friday": { veg: "Brown Rice + Dal", non: "Brown Rice + Fish Fry", vCal: 350, nCal: 410, vid: "8r4Z-ghDI4k", t: "Cardio Kick" },
    "Saturday": { veg: "Veg Biryani + Raita", non: "Chicken Biryani + Egg", vCal: 450, nCal: 550, vid: "uKXcLBjWqas", t: "Stability" },
    "Sunday": { veg: "Millet Curd Rice + Salad", non: "Pepper Soup + 1 Roti", vCal: 280, nCal: 320, vid: "inpok4MKVLM", t: "Mindfulness" }
};

window.onload = async () => {
    await loadFoodData();
    if (!state) { document.getElementById('setup-screen').classList.remove('hide'); } 
    else { if(state.customFoods) foodDB = { ...foodDB, ...state.customFoods }; init(); }
};

async function loadFoodData() {
    try {
        const response = await fetch('food.json');
        const data = await response.json();
        data.forEach(item => { foodDB[item.name.toLowerCase()] = item; });
        console.log("External Food DB Loaded");
    } catch (error) { 
        console.error("Error loading food.json", error);
        alert("Could not load food database. Make sure food.json is in the same folder.");
    }
}

function init() { 
    document.getElementById('setup-screen').classList.add('hide'); 
    document.getElementById('main-app').classList.remove('hide'); 
    document.getElementById('userDisp').innerText = state.name; 
    checkNewDay(); 
    checkHomeDisclaimer();
    updateUI(); updateInfoUI(); renderMeals(); renderTasks(); renderHistory(); 
}

function checkHomeDisclaimer() { if (state.lastDisclaimerDate !== new Date().toISOString().split('T')[0]) document.getElementById('homeDisclaimerModal').classList.remove('hide'); }
function acceptHomeDisclaimer() { state.lastDisclaimerDate = new Date().toISOString().split('T')[0]; save(); document.getElementById('homeDisclaimerModal').classList.add('hide'); }
function checkWorkoutSafety() { if (state.lastWorkoutSafetyDate !== new Date().toISOString().split('T')[0]) document.getElementById('workoutSafetyModal').classList.remove('hide'); }
function acceptWorkoutSafety() { state.lastWorkoutSafetyDate = new Date().toISOString().split('T')[0]; save(); document.getElementById('workoutSafetyModal').classList.add('hide'); }
function checkFoodDisclaimer() { if (state.lastFoodDisclaimerDate !== new Date().toISOString().split('T')[0]) document.getElementById('foodDisclaimerModal').classList.remove('hide'); }
function acceptFoodDisclaimer() { state.lastFoodDisclaimerDate = new Date().toISOString().split('T')[0]; save(); document.getElementById('foodDisclaimerModal').classList.add('hide'); }

function updateUI() { 
    document.getElementById('curW').innerText = state.weight; 
    document.getElementById('goalW').innerText = state.goal; 
    document.getElementById('wBar').style.width = Math.min(100, (Math.abs(state.startW-state.weight)/Math.abs(state.startW-state.goal))*100) + '%'; 
    document.getElementById('watV').innerText = state.waterC; 
    document.getElementById('watT').innerText = state.waterG;
    document.getElementById('watBar').style.width = (state.waterC / state.waterG) * 100 + '%';
}

function updateInfoUI() {
    const total = state.consumed.reduce((sum, item) => sum + item.cal, 0);
    document.getElementById('headerCal').innerText = total;
    document.getElementById('headerGoal').innerText = state.calGoal;
    document.getElementById('dispRemaining').innerText = Math.max(0, state.calGoal - total);
    document.getElementById('dispGoal').innerText = state.calGoal + " kcal";
    const offset = (2 * Math.PI * 40) - (total / state.calGoal) * (2 * Math.PI * 40);
    document.getElementById('calRing').style.strokeDashoffset = offset;
    renderLog();
}

function renderMeals() { 
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = days[new Date().getDay()];
    const p = CONTENT[d]; 
    document.getElementById('menuTotal').innerText = 522 + p.vCal;
    document.getElementById('mealContainer').innerHTML = `
        ${mealItem("fa-blender","Morning Shake (F1+PDM)","text-punch","Breakfast", 242)}
        ${mealItem("fa-mug-hot","Afresh + 5 Almonds","text-orange-400","Snack", 40)}
        <div class="bg-mist p-5 rounded-[2rem] border border-slate-50 shadow-sm space-y-3">
            <p class="text-[10px] font-bold text-slate-300 uppercase leading-none">Lunch (${d})</p>
            <div class="flex justify-between items-center"><p class="text-sm font-extrabold text-marine flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> ${p.veg}</p><button onclick="quickLog('Veg Lunch', ${p.vCal})" class="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg">+ ${p.vCal}</button></div>
            <div class="flex justify-between items-center"><p class="text-sm font-extrabold text-marine flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500"></span> ${p.non}</p><button onclick="quickLog('Non-Veg Lunch', ${p.nCal})" class="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg">+ ${p.nCal}</button></div>
        </div>
        ${mealItem("fa-carrot","Guava / Cucumber","text-orange-400","Snack", 40)}
        ${mealItem("fa-moon","Night Shake (Light)","text-punch","Dinner", 200)}
    `;
}

function mealItem(i, t, c, l, cal) { 
    return `<div class="bg-mist p-4 rounded-[2rem] flex justify-between items-center border border-slate-50 shadow-sm"><div class="flex items-center gap-4"><div class="${c} text-xl w-8 text-center"><i class="fas ${i}"></i></div><div><p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">${l} (~${cal} kcal)</p><p class="font-extrabold text-sm text-marine">${t}</p></div></div><button onclick="quickLog('${t}', ${cal})" class="text-lg text-slate-300 hover:text-punch px-2"><i class="fas fa-plus-circle"></i></button></div>`; 
}

function quickLog(name, cal) { state.consumed.unshift({ name: name, cal: cal, qty: 1, time: Date.now() }); save(); updateInfoUI(); alert(`Added ${name}`); }
function quickAdd(name, cal) { state.consumed.unshift({ name: name, cal: cal, qty: 1, time: Date.now() }); save(); updateInfoUI(); }
function deleteItem(index) { state.consumed.splice(index, 1); save(); updateInfoUI(); }
function renderLog() {
    const list = document.getElementById('logContainer');
    if(state.consumed.length === 0) { list.innerHTML = `<div class="text-center py-8 text-slate-300 text-xs font-bold">No meals logged yet.</div>`; return; }
    list.innerHTML = state.consumed.map((item, i) => `<div class="bg-white p-4 rounded-2xl border flex justify-between items-center"><div><h4 class="font-bold text-marine text-sm">${item.name}</h4><p class="text-[10px] text-slate-400 font-bold">${item.cal} kcal</p></div><button onclick="deleteItem(${i})" class="text-slate-300 p-2"><i class="fas fa-trash-alt"></i></button></div>`).join('');
}

// BROWSE CATEGORY FUNCTION
function browseCategory(cat) {
    const list = document.getElementById('suggestions');
    const items = CATEGORIES[cat];
    
    // Clear previous and show list
    list.innerHTML = `<div class="p-3 bg-mist border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">Browsing: ${cat}</div>`;
    
    items.forEach(keyword => {
        // Find in DB
        const match = Object.keys(foodDB).find(k => k.includes(keyword));
        if(match) {
            list.innerHTML += `<div onclick="selectFood('${match}')" class="p-3 border-b border-slate-50 hover:bg-mist cursor-pointer flex justify-between items-center transition-all"><span class="font-bold text-marine capitalize text-sm">${match}</span><i class="fas fa-plus-circle text-punch text-xs"></i></div>`;
        }
    });
    
    list.classList.remove('hide');
}

function showSuggestions(val) {
    val = val.toLowerCase(); const list = document.getElementById('suggestions');
    if(val.length < 1) { list.classList.add('hide'); return; }
    const matches = Object.keys(foodDB).filter(k => k.includes(val));
    if(matches.length === 0) { 
        list.innerHTML = `<div onclick="showAddCustom('${val}')" class="p-3 border-b border-slate-50 hover:bg-mist cursor-pointer text-center text-xs font-bold text-punch">+ Add "${val}" to Database</div>`;
        list.classList.remove('hide'); 
        return; 
    }
    list.innerHTML = matches.map(f => `<div onclick="selectFood('${f}')" class="p-3 border-b border-slate-50 hover:bg-mist cursor-pointer flex justify-between items-center transition-all"><span class="font-bold text-marine capitalize text-sm">${f}</span></div>`).join('');
    list.classList.remove('hide');
}

function selectFood(name) {
    const item = foodDB[name];
    document.getElementById('foodName').value = "";
    document.getElementById('suggestions').classList.add('hide');
    document.getElementById('prepModal').classList.add('hide');
    document.getElementById('analysisResult').classList.add('hide');
    document.getElementById('prepOptions').innerHTML = ""; 

    if (item.variants) {
        const prepDiv = document.getElementById('prepOptions');
        prepDiv.innerHTML = item.variants.map((v, i) => 
            `<div onclick="selectVariant('${name}', ${i})" class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center cursor-pointer shadow-sm hover:border-punch transition-all">
                <div><p class="font-bold text-marine text-sm">${v.name}</p><p class="text-[10px] text-slate-400">${v.desc}</p></div>
                <p class="text-xs font-black text-punch">${v.cal} kcal</p>
            </div>`
        ).join('');
        document.getElementById('prepModal').classList.remove('hide');
    } else {
        showFinalModal(item.name, item.cal, item.desc || "Standard portion", item.type);
    }
}

function selectVariant(parentName, index) {
    const item = foodDB[parentName].variants[index];
    document.getElementById('prepModal').classList.add('hide');
    showFinalModal(item.name, item.cal, item.desc, item.type);
}

function showFinalModal(name, cal, desc, type) {
    tempFood = { name: name, calPerUnit: cal, desc: desc, type: type };
    document.getElementById('resName').innerText = name; 
    document.getElementById('resCal').innerText = cal + " kcal"; 
    document.getElementById('resDesc').innerText = desc;
    
    const badge = document.getElementById('resBadge');
    if(type === 'good') { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600"; badge.innerText = "Good Choice"; }
    else if(type === 'bad') { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600"; badge.innerText = "Limit This"; }
    else { badge.className = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600"; badge.innerText = "Moderate"; }
    
    document.getElementById('analysisResult').classList.remove('hide'); 
    document.getElementById('resQty').value = 1;
}

function closePrep() { document.getElementById('prepModal').classList.add('hide'); }

function showAddCustom(val) {
    document.getElementById('suggestions').classList.add('hide');
    document.getElementById('custName').value = val;
    document.getElementById('addCustom').classList.remove('hide');
}

function saveCustom() {
    const n = document.getElementById('custName').value;
    const c = parseFloat(document.getElementById('custCal').value);
    if(!n || !c) return alert("Enter valid details");
    
    if(!state.customFoods) state.customFoods = {};
    state.customFoods[n.toLowerCase()] = { cal: c, unit: 'unit', type: 'ok', desc: 'Custom added food' };
    foodDB[n.toLowerCase()] = { cal: c, unit: 'unit', type: 'ok', desc: 'Custom added food' };
    save();
    selectFood(n.toLowerCase());
    document.getElementById('addCustom').classList.add('hide');
}

function confirmAdd() {
    if(!tempFood) return;
    const qty = parseFloat(document.getElementById('resQty').value);
    const totalCal = Math.round(tempFood.calPerUnit * qty);
    state.consumed.unshift({ name: tempFood.name, cal: totalCal, qty: qty, time: Date.now() });
    save(); updateInfoUI(); document.getElementById('analysisResult').classList.add('hide');
}

function cancelAdd() { document.getElementById('analysisResult').classList.add('hide'); }

function shareWhatsApp() { 
    const total = state.consumed.reduce((sum, item) => sum + item.cal, 0); 
    const remainingWeight = (state.weight - state.goal).toFixed(1);
    const daysPassed = Math.max(1, Math.floor((Date.now() - state.startDate) / 86400000));
    const rate = (state.startW - state.weight) > 0 ? (state.startW - state.weight) / daysPassed : 0.071;
    let estDays = Math.ceil(remainingWeight / rate);
    let timeStr = remainingWeight <= 0 ? "Goal Reached! 🎉" : (estDays > 30 ? (estDays / 30).toFixed(1) + " Months" : estDays + " Days");
    const text = `*ZestUp Pro Update* 🚀%0a%0a*Status:*%0a🔥 Calories: ${total}/${state.calGoal}%0a⚖️ Current: ${state.weight}kg%0a🎯 Target Weight: ${state.goal}kg%0a⏳ Est. Time: ${timeStr}%0a%0a🔗 *Open App:* https://krishnamu045-rgb.github.io/fitflow/`; 
    window.open(`https://wa.me/?text=${text}`, '_blank'); 
}

function showT(tab) { 
    ['home','workout','info'].forEach(t => document.getElementById(`${t}-section`).classList.add('hide')); 
    ['nav-home','nav-workout','nav-info'].forEach(t => document.getElementById(t).className = 'flex flex-col items-center gap-1 text-slate-300'); 
    document.getElementById(`${tab}-section`).classList.remove('hide'); 
    document.getElementById(`nav-${tab}`).className = 'flex flex-col items-center gap-1 nav-active'; 
    
    if(tab === 'workout') { renderW(); checkWorkoutSafety(); } 
    if(tab === 'info') checkFoodDisclaimer(); 
}

function addW(v) { state.waterC = Math.max(0, state.waterC + v); updateUI(); save(); }
function openW() { document.getElementById('wModal').classList.remove('hide'); }
function closeW() { document.getElementById('wModal').classList.add('hide'); }
function saveW() { const v = parseFloat(document.getElementById('wIn').value); if(v) { state.weight = v; updateUI(); save(); closeW(); } }

function finishSetup() { 
    const n = document.getElementById('setupName').value; 
    const h = parseFloat(document.getElementById('setupH').value); 
    const w = parseFloat(document.getElementById('setupW').value); 
    const g = document.getElementById('setupGender').value;
    const dob = document.getElementById('setupDOB').value;

    let age = 30; // Default
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    }

    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr += (g === 'male' ? 5 : -161);

    let tdee = bmr * 1.2;
    let dailyGoal = Math.round(tdee - 300);
    if (dailyGoal < 1200) dailyGoal = 1200;

    let idealW = g === 'male' ? (h - 100) - ((h - 150) / 4) : (h - 100) - ((h - 150) / 2);

    state = { 
        name: n, 
        weight: w, 
        height: h, 
        age: age,
        startW: w, 
        goal: idealW.toFixed(1), 
        waterG: Math.round(w * 35), 
        waterC: 0, 
        calGoal: dailyGoal, 
        consumed: [], 
        startDate: Date.now(), 
        history: {}, 
        todayTasks: {}, 
        lastLogin: new Date().toISOString().split('T')[0], 
        customFoods: {} 
    }; 
    save(); 
    location.reload(); 
}

function toggleTask(task) { 
    state.todayTasks[task] = !state.todayTasks[task]; 
    const today = new Date().toISOString().split('T')[0];
    let score = 0; if (state.todayTasks.mShake) score++; if (state.todayTasks.nShake) score++; if (state.todayTasks.water) score++; if (state.todayTasks.workout) score++;
    state.history[today] = score;
    renderTasks(); renderHistory(); save(); 
}
function renderTasks() { ['mShake','nShake','water','workout'].forEach(k => { const b = document.getElementById('task-'+k); if(state.todayTasks[k]) b.classList.add('check-active'); else b.classList.remove('check-active'); }); }
function renderHistory() { 
    const container = document.getElementById('historyContainer'); let html = '';
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().split('T')[0];
        const s = state.history && state.history[k] ? state.history[k] : 0;
        let bg = s === 4 ? "bg-punch text-white" : (s > 0 ? "bg-orange-100 text-punch" : "bg-white text-slate-300");
        html += `<div class="flex flex-col items-center gap-1"><div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${bg} border border-slate-100">${s || '-'}</div></div>`;
    }
    container.innerHTML = html;
}
function renderW() { 
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = days[new Date().getDay()];
    const p = CONTENT[d]; 
    document.getElementById('wTitle').innerText = p.t;
    document.getElementById('wThumb').src = `https://img.youtube.com/vi/${p.vid}/maxresdefault.jpg`;
}
function launchWorkout() { 
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = days[new Date().getDay()];
    const p = CONTENT[d]; 
    window.open(`https://www.youtube.com/watch?v=${p.vid}`, '_blank'); 
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function masterReset() { if(prompt("PIN:") === "2710") { localStorage.removeItem(KEY); location.reload(); } }
function selectGender(g) { document.getElementById('setupGender').value = g; document.getElementById('btnMale').className = g==='male'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; document.getElementById('btnFemale').className = g==='female'?'flex-1 bg-punch text-white p-4 rounded-2xl font-bold':'flex-1 bg-mist p-4 rounded-2xl font-bold'; }
function checkNewDay() { const today = new Date().toISOString().split('T')[0]; if (state.lastLogin !== today) { state.lastLogin = today; state.waterC = 0; state.consumed = []; state.todayTasks = {}; save(); } }
function enableNotifications() { Notification.requestPermission(); }

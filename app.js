
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBdmVCQnUjDUXqwsiCPemJZ6u0fl5DhFAo",
  authDomain: "curaq-e3118.firebaseapp.com",
  projectId: "curaq-e3118",
  storageBucket: "curaq-e3118.firebasestorage.app",
  messagingSenderId: "849145373580",
  appId: "1:849145373580:web:a6e0a5095db154e45d6ca9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_KEY = "Curaq8135892041";

// --- HELPERS ---
const $ = id => document.getElementById(id);
const hide = id => $(id)?.classList.add('hidden');
const show = id => $(id)?.classList.remove('hidden');
const getToday = () => new Date().toISOString().split('T')[0];

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('toast-box').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// --- ROUTER (Navegación sin recargar) ---
// Manejamos las vistas cambiando la URL (hash)
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

function handleRoute() {
    const hash = window.location.hash;
    
    // Ocultar todas las pantallas principales
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));

    if (!auth.currentUser) {
        show('view-auth');
        return;
    }

    if (hash.startsWith('#patient/')) {
        // Vista de Detalle
        const id = hash.split('/')[1];
        loadPatientDetail(id);
        show('view-detail');
    } else {
        // Vista Dashboard (Default)
        show('view-dashboard');
        // Reset tab view if coming back
        if(window.currentTab) activateTab(window.currentTab);
    }
}

function navigateTo(route) { window.location.hash = route; }

// --- AUTH LOGIC ---
onAuthStateChanged(auth, user => {
    hide('loader-overlay');
    if (user) {
        $('user-initials').textContent = (user.displayName || 'U').substring(0,2).toUpperCase();
        handleRoute(); // Refrescar ruta
        initListeners();
    } else {
        show('view-auth');
        hide('view-dashboard');
        hide('view-detail');
    }
});

$('form-login').onsubmit = e => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, $('auth-email').value, $('auth-pass').value)
        .catch(err => showToast(err.message));
};

$('form-register').onsubmit = e => {
    e.preventDefault();
    if($('reg-key').value !== ADMIN_KEY) return showToast('Clave incorrecta');
    createUserWithEmailAndPassword(auth, $('reg-email').value, $('reg-pass').value)
        .then(creds => updateProfile(creds.user, {displayName: $('reg-name').value}))
        .catch(err => showToast(err.message));
};

$('btn-toggle-reg').onclick = () => { hide('form-login'); show('form-register'); };
$('btn-toggle-login').onclick = () => { hide('form-register'); show('form-login'); };

// --- DASHBOARD & LISTS ---
let patientsCache = [];

function initListeners() {
    onSnapshot(collection(db, 'patients'), snapshot => {
        patientsCache = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        renderLists();
    });
}

function renderLists() {
    const lists = { census: $('list-census'), schedule: $('list-schedule'), discharges: $('list-discharges') };
    Object.values(lists).forEach(l => l.innerHTML = '');
    
    const hospFilter = $('sel-hospital').value;
    const today = getToday();
    let hasCensus = false;

    patientsCache.forEach(p => {
        // Render Censo
        if (p.status === 'census') {
            if (hospFilter && p.hospital !== hospFilter) return;
            hasCensus = true;
            
            // Logic Colors
            let statusClass = 'status-red'; // Pendiente
            if (p.lastVisitCheck === today) statusClass = 'status-blue'; // Visitado
            if (p.preDischarge) statusClass = 'status-purple'; // Prealta
            
            lists.census.appendChild(createRow(p, statusClass));
        } 
        // Render Schedule
        else if (p.status === 'scheduled') {
            const isToday = p.surgeryDate === today;
            lists.schedule.appendChild(createRow(p, 'status-blue', isToday ? '' : '(opacity:0.6)'));
        }
        // Render Discharges
        else if (p.status === 'discharged') {
            lists.discharges.appendChild(createRow(p, 'status-gray'));
        }
    });

    if(!hasCensus) show('empty-state'); else hide('empty-state');
}

function createRow(p, statusClass, style='') {
    const li = document.createElement('li');
    li.className = `patient-row ${statusClass}`;
    li.style = style;
    li.onclick = () => navigateTo(`patient/${p.id}`); // ROUTER CLICK
    
    // Initials
    const initials = p.name.split(' ').map(n=>n[0]).join('').substring(0,2);
    
    li.innerHTML = `
        <div class="row-status-bar"></div>
        <div class="p-avatar">${initials}</div>
        <div class="p-info">
            <div class="p-name">${p.name}</div>
            <span class="p-desc">${p.diagnosis}</span>
        </div>
        <span class="p-badge">${p.hospital}</span>
        <i class="fas fa-chevron-right" style="color:#ccc; margin-left:8px; font-size:0.8rem"></i>
    `;
    return li;
}

// --- TABS DASHBOARD ---
window.currentTab = 'census';
document.querySelectorAll('.tab-link').forEach(btn => {
    btn.onclick = () => activateTab(btn.dataset.tab);
});

function activateTab(tab) {
    window.currentTab = tab;
    // UI Tabs
    document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // UI Lists
    document.querySelectorAll('.patient-list').forEach(l => l.classList.add('hidden'));
    $(`list-${tab}`).classList.remove('hidden');
    
    $('header-label').textContent = (tab === 'census' ? 'Censo' : (tab === 'schedule' ? 'Agenda' : 'Egresos'));
    
    // Show/Hide filters
    if(tab==='census') { show('filter-bar'); show('fab-add'); } 
    else if (tab==='schedule') { hide('filter-bar'); show('fab-add'); }
    else { hide('filter-bar'); hide('fab-add'); }
}

// --- DETAIL VIEW LOGIC ---
let currentPatientId = null;

async function loadPatientDetail(id) {
    currentPatientId = id;
    const p = patientsCache.find(x => x.id === id);
    if(!p) return; // O fetch getDoc si no está en cache
    
    // Header
    $('d-name').textContent = p.name;
    $('d-avatar').textContent = p.name.substring(0,2).toUpperCase();
    $('d-age').textContent = calculateAge(p.dob);
    $('d-hosp').textContent = p.hospital;
    $('d-insurance').textContent = p.insurance;
    $('d-doctor').textContent = p.doctor.split(' ')[0]; // Solo primer nombre para badge
    $('d-diagnosis').textContent = p.diagnosis;
    $('d-phone-text').textContent = p.phone || 'Agregar';
    $('link-phone').href = p.phone ? `tel:${p.phone}` : '#';
    
    // Visit Checkbox logic
    $('d-check-visit').checked = (p.lastVisitCheck === getToday());
    
    // Chips Antecedentes
    const h = p.history || {};
    $('chip-dm').className = `chip ${h.dm ? 'active' : ''}`;
    $('chip-has').className = `chip ${h.has ? 'active' : ''}`;
    $('chip-onco').className = `chip ${h.onco ? 'active' : ''}`;
    $('d-history').value = h.text || '';
    
    renderTimeline(p.notes || []);
    
    // Reset Tab
    app.setDetailTab('info');
}

// --- DETAIL ACTIONS ---
$('btn-back').onclick = () => window.history.back(); // Regresar nativo
$('d-check-visit').onclick = (e) => {
    updateDoc(doc(db, 'patients', currentPatientId), {
        lastVisitCheck: e.target.checked ? getToday() : null
    });
};
$('btn-save-history').onclick = () => {
    updateDoc(doc(db, 'patients', currentPatientId), {
        'history.text': $('d-history').value,
        'phone': $('d-phone-edit').value || $('d-phone-text').textContent
    }).then(() => showToast('Datos actualizados'));
};

// Menu de acciones (Egresar, Prealta)
$('btn-detail-menu').onclick = () => {
    // Simple confirm for demo
    const action = prompt("Escriba: 'alta' para egresar, 'prealta' para marcar, 'borrar' para eliminar");
    if(action === 'alta') {
        updateDoc(doc(db, 'patients', currentPatientId), { status: 'discharged', dischargeDate: getToday() });
        window.history.back();
    } else if (action === 'prealta') {
        updateDoc(doc(db, 'patients', currentPatientId), { preDischarge: true });
        showToast('Marcado como Pre-Alta');
    }
};

// --- NOTES LOGIC ---
window.app = window.app || {};
app.setDetailTab = (tab) => {
    document.querySelectorAll('.d-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.d-panel').forEach(p => p.classList.remove('active'));
    
    // Find button by text mostly or index (simplification)
    // In production use IDs for tabs
    const tabBtn = Array.from(document.querySelectorAll('.d-tab')).find(b => b.textContent.includes(tab === 'info' ? 'Datos' : 'Notas'));
    if(tabBtn) tabBtn.classList.add('active');
    
    $(`d-tab-${tab}`).classList.add('active');
};

app.newNote = (type) => {
    const form = $('form-note');
    const container = $('note-dynamic-fields');
    form.dataset.type = type;
    $('modal-note').classList.remove('hidden');
    
    $('note-title').textContent = type.toUpperCase();
    
    if(type === 'visita') {
        container.innerHTML = `
            <div class="field"><input name="subj" placeholder="Subjetivo"></div>
            <div class="field"><input name="obj" placeholder="Objetivo / Signos"></div>
            <div class="field"><textarea name="plan" class="input-area" placeholder="Análisis y Plan"></textarea></div>
        `;
        show('btn-wa');
    } else {
        container.innerHTML = `<div class="field"><textarea name="text" class="input-area" placeholder="Escriba aquí..."></textarea></div>`;
        hide('btn-wa');
    }
};

$('form-note').onsubmit = async (e) => {
    e.preventDefault();
    const type = e.target.dataset.type;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    await updateDoc(doc(db, 'patients', currentPatientId), {
        notes: arrayUnion({
            type, data, author: auth.currentUser.displayName, timestamp: new Date().toISOString()
        })
    });
    $('modal-note').classList.add('hidden');
};

$('btn-wa').onclick = () => {
    const form = new FormData($('form-note'));
    const txt = `*PACIENTE:* ${$('d-name').textContent}\n*S:* ${form.get('subj')}\n*O:* ${form.get('obj')}\n*A/P:* ${form.get('plan')}`;
    navigator.clipboard.writeText(txt);
    showToast('Copiado para WhatsApp');
};

function renderTimeline(notes) {
    const box = $('timeline-box');
    box.innerHTML = '';
    notes.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(n => {
        const d = new Date(n.timestamp);
        let body = '';
        if(n.type === 'visita') body = `<b>S:</b> ${n.data.subj}<br><b>P:</b> ${n.data.plan}`;
        else body = n.data.text || JSON.stringify(n.data);
        
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="tm-meta"><span>${n.type.toUpperCase()}</span> <span>${d.toLocaleDateString()}</span></div>
            <div class="tm-body">${body}</div>
        `;
        box.appendChild(div);
    });
}

// --- ADD PATIENT ---
$('fab-add').onclick = () => {
    $('form-add').reset();
    $('modal-add').classList.remove('hidden');
};
document.querySelectorAll('.close-modal, .close-modal-note').forEach(b => b.onclick = function() {
    this.closest('.modal-overlay').classList.add('hidden');
});

// Logic for Scheduled toggle
$('chk-schedule-mode').onchange = (e) => {
    if(e.target.checked) show('box-schedule-date'); else hide('box-schedule-date');
};

$('form-add').onsubmit = async (e) => {
    e.preventDefault();
    const isSched = $('chk-schedule-mode').checked;
    
    const data = {
        hospital: $('add-hospital').value,
        name: $('add-name').value,
        dob: $('add-dob').value,
        type: $('add-type').value,
        diagnosis: $('add-diagnosis').value,
        doctor: $('add-doctor').value,
        insurance: $('add-insurance').value,
        status: isSched ? 'scheduled' : 'census',
        surgeryDate: isSched ? $('add-qx-date').value : null,
        lastVisitCheck: null,
        preDischarge: false
    };
    
    try {
        await addDoc(collection(db, 'patients'), data);
        $('modal-add').classList.add('hidden');
        showToast('Paciente Agregado');
    } catch(err) { showToast(err.message); }
};

// --- POPULATE SELECTS ---
const HOSPITALS = ["Hospital Star Médica","Hospital Ángeles Querétaro","Hospital Ángeles Centro Sur","Hospital H+","Hospital San José","Hospital Moscati","Gestamed","Hospital Santa Rosa de Viterbo","Hospital Santo Tomás","Hospital Médica Ebor","Hospital Santiago de Querétaro","Hospital Jardines","Clínica San Francisco","Hospital San Pedro","Hospital del Sagrado Corazón","Clínica Las Campanas","Centro Médico Jurica","Clínica CER","Hospital Idaly Medical","Clínica CEM","Otro"];
const DOCTORS = ["Enrique Hans Mues Guizar", "Rolando L Bonilla Silva", "Otro"];
const INSURANCES = ["AXA", "GNP", "MetLife", "Seguros Monterrey", "Mapfre", "Bupa", "Allianz", "Banorte", "Inbursa", "Sisnova", "Particular", "Otro"];

const fill = (id, arr) => {
    const s = $(id); if(!s) return;
    arr.forEach(x => { const o = document.createElement('option'); o.value = x; o.textContent = x; s.appendChild(o); });
};

fill('add-hospital', HOSPITALS); fill('sel-hospital', HOSPITALS);
fill('add-doctor', DOCTORS);
fill('add-insurance', INSURANCES);

function calculateAge(dob) {
    if(!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

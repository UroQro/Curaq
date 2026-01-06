
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
    const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
    $('toast-box').appendChild(t); setTimeout(()=>t.remove(),3000);
}

// --- DATA LISTS (FULL) ---
const HOSPITALS = ["Hospital Star Médica","Hospital Ángeles Querétaro","Hospital Ángeles Centro Sur","Hospital H+","Hospital San José","Hospital Moscati","Gestamed","Hospital Santa Rosa de Viterbo","Hospital Santo Tomás","Hospital Médica Ebor","Hospital Santiago de Querétaro","Hospital Jardines","Clínica San Francisco","Hospital San Pedro","Hospital del Sagrado Corazón","Clínica Las Campanas","Centro Médico Jurica","Clínica CER","Hospital Idaly Medical","CEM","Otro"];
const DOCTORS = ["Enrique Hans Mues Guizar", "Rolando L Bonilla Silva", "Otro"];
const INSURANCES = ["Afirme","Allianz","Atlas","Atlantis","AXA","Banorte","Bupa","VUMI","Bx+","Chubb","General de Seguros","GNP","Inbursa","La Latino","Mapfre","MetLife","Pan-American","Plan Seguro","Sisnova","Prevem","Seguros Monterrey NYL","Sura","Particular","Paquete","Otro"];

// Populate dropdowns
const populate = (id, arr) => {
    const s = $(id); if(!s) return; s.innerHTML='';
    arr.forEach(x => { const o = document.createElement('option'); o.value=x; o.textContent=x; s.appendChild(o); });
    s.addEventListener('change', e => {
        const oId = id.includes('filter') ? null : id.replace('add-','add-').replace('doc','doc-other').replace('hosp','hosp-other').replace('insurance','ins-other').replace('hospital','hosp-other'); // simple mapping hack
        if(oId && $(oId)) {
            if(e.target.value === 'Otro') show(oId); else hide(oId);
        }
    });
};
populate('add-hospital', HOSPITALS); populate('filter-hospital', HOSPITALS);
populate('add-doc', DOCTORS); populate('filter-doctor', DOCTORS);
populate('add-insurance', INSURANCES);

// --- ROUTER & STATE ---
let patientsCache = [];
let currentPatientId = null;

const router = () => {
    if(!auth.currentUser) return showAuth();
    
    // Simple view toggle based on variable state, not hash to keep it simpler with modals
    // Default dashboard
};

function showAuth() { $('view-auth').classList.add('active'); $('view-dashboard').classList.remove('active'); $('view-detail').classList.remove('active'); }
function showDash() { $('view-auth').classList.remove('active'); $('view-dashboard').classList.add('active'); $('view-detail').classList.remove('active'); }
function showDetail() { $('view-detail').classList.add('active'); }

// --- AUTH LOGIC ---
onAuthStateChanged(auth, u => {
    hide('loader-overlay');
    if(u) { showDash(); initRealtime(); } else showAuth();
});

$('form-login').onsubmit = e => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, $('login-email').value, $('login-pass').value).catch(e=>showToast(e.message));
};
$('form-reg').onsubmit = e => {
    e.preventDefault();
    if($('reg-key').value !== ADMIN_KEY) return showToast('Clave incorrecta');
    createUserWithEmailAndPassword(auth, $('reg-email').value, $('reg-pass').value)
        .then(c => updateProfile(c.user, {displayName: $('reg-name').value}))
        .catch(e=>showToast(e.message));
};
$('btn-to-reg').onclick=()=>{hide('form-login'); show('form-reg')};
$('btn-to-login').onclick=()=>{hide('form-reg'); show('form-login')};
$('btn-logout').onclick=()=>signOut(auth);

// --- DASHBOARD LISTS ---
function initRealtime() {
    onSnapshot(collection(db, 'patients'), snap => {
        patientsCache = snap.docs.map(d => ({id:d.id, ...d.data()}));
        renderList();
    });
}

let activeTab = 'census';
document.querySelectorAll('.tab-btn').forEach(b => {
    b.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        activeTab = b.dataset.tab;
        
        // Toggle filters
        if(activeTab==='census') { show('census-filters'); show('fab-add'); }
        else { hide('census-filters'); hide('fab-add'); }
        
        renderList();
    }
});

function renderList() {
    const box = $('list-container'); box.innerHTML='';
    const hFilter = $('filter-hospital').value;
    const dFilter = $('filter-doctor').value;
    const today = getToday();
    let count = 0;

    patientsCache.forEach(p => {
        if(p.status !== activeTab && !(activeTab==='schedule' && p.status==='scheduled')) return;
        
        // Filters
        if(activeTab === 'census') {
            if(hFilter && p.hospital !== hFilter) return;
            if(dFilter && p.doctor !== dFilter) return;
        }

        count++;
        // Status Color
        let stClass = 'st-red';
        if(p.status === 'census') {
            if(p.lastVisitCheck === today) stClass = 'st-blue';
            else if(p.preDischarge) stClass = 'st-purple';
        } else if (p.status === 'scheduled') {
            stClass = 'st-blue';
        } else {
            stClass = 'st-gray';
        }

        const div = document.createElement('div');
        div.className = `patient-row ${stClass}`;
        div.onclick = () => loadDetail(p.id);
        
        const initials = p.name.substring(0,2).toUpperCase();
        div.innerHTML = `
            <div class="bar-status"></div>
            <div class="avatar">${initials}</div>
            <div class="info">
                <h3>${p.name}</h3>
                <p>${p.diagnosis}</p>
                <div class="row" style="margin-top:4px">
                    <span class="badge-mini">${p.hospital}</span>
                    ${p.status==='scheduled' ? `<span class="badge-mini">${p.surgeryDate || 'S/F'}</span>` : ''}
                </div>
            </div>
            <i class="fas fa-chevron-right" style="color:#ddd"></i>
        `;
        box.appendChild(div);
    });
    
    if(count===0) show('empty-state'); else hide('empty-state');
}

// --- ADD PATIENT ---
$('fab-add').onclick = () => { $('form-add').reset(); $('modal-add').classList.remove('hidden'); }
$('form-add').onsubmit = async e => {
    e.preventDefault();
    const getVal = (id, other) => $(id).value==='Otro' ? $(other).value : $(id).value;
    
    try {
        await addDoc(collection(db, 'patients'), {
            hospital: getVal('add-hospital','add-hosp-other'),
            name: $('add-name').value,
            dob: $('add-dob').value,
            type: $('add-type').value,
            diagnosis: $('add-dx').value,
            doctor: getVal('add-doc','add-doc-other'),
            insurance: getVal('add-insurance','add-ins-other'),
            status: 'census',
            lastVisitCheck: null,
            preDischarge: false
        });
        $('modal-add').classList.add('hidden');
        showToast('Paciente creado');
    } catch(err) { showToast(err.message); }
};

// --- DETAIL VIEW ---
function calculateAge(dob) { if(!dob) return 0; return Math.abs(new Date(Date.now()-new Date(dob).getTime()).getUTCFullYear()-1970); }

function loadDetail(id) {
    currentPatientId = id;
    const p = patientsCache.find(x=>x.id===id);
    if(!p) return;

    $('det-name').textContent = p.name;
    $('det-avatar').textContent = p.name.substring(0,2).toUpperCase();
    $('det-age').textContent = calculateAge(p.dob);
    $('det-hosp').textContent = p.hospital;
    $('det-dx').textContent = p.diagnosis;
    $('det-insurance').textContent = p.insurance;
    $('det-doctor').textContent = p.doctor;
    $('det-type').textContent = p.type;

    // Visit Toggle
    const chk = $('chk-visit-today');
    chk.checked = (p.lastVisitCheck === getToday());
    chk.onclick = () => updateDoc(doc(db,'patients',id), { lastVisitCheck: chk.checked ? getToday() : null });
    
    if(p.status === 'census') show('box-visit-toggle'); else hide('box-visit-toggle');

    // Clinical Data
    const h = p.history || {};
    $('det-phone').value = p.phone || '';
    $('ant-dm').checked = h.dm; $('ant-has').checked = h.has;
    $('ant-hipo').checked = h.hipo; $('ant-onco').checked = h.onco;
    $('det-history').value = h.text || '';
    $('det-meds').value = h.meds || '';

    // Notes
    renderTimeline(p.notes || []);

    showDetail();
}

$('btn-back').onclick = () => $('view-detail').classList.remove('active');

$('btn-save-clinical').onclick = async () => {
    await updateDoc(doc(db,'patients',currentPatientId), {
        phone: $('det-phone').value,
        history: {
            dm: $('ant-dm').checked, has: $('ant-has').checked, hipo: $('ant-hipo').checked, onco: $('ant-onco').checked,
            text: $('det-history').value, meds: $('det-meds').value
        }
    });
    showToast('Datos clínicos guardados');
};

// --- ACTIONS SHEET LOGIC ---
window.app = window.app || {};

$('btn-actions').onclick = () => {
    const p = patientsCache.find(x=>x.id===currentPatientId);
    $('action-sheet').classList.remove('hidden');
    hide('actions-census'); hide('actions-schedule'); hide('actions-discharge');
    
    if(p.status === 'census') show('actions-census');
    else if(p.status === 'scheduled') show('actions-schedule');
    else show('actions-discharge');
};

app.closeSheet = () => $('action-sheet').classList.add('hidden');

app.markPreDischarge = async () => {
    await updateDoc(doc(db,'patients',currentPatientId), { preDischarge: true });
    app.closeSheet(); showToast('Marcado para Pre-Alta');
};

app.dischargePatient = async () => {
    if(confirm('¿Confirmar Egreso? Se moverá a la pestaña de Egresos.')) {
        await updateDoc(doc(db,'patients',currentPatientId), { status: 'discharged', dischargeDate: getToday() });
        app.closeSheet(); $('view-detail').classList.remove('active');
    }
};

app.returnToCensus = async () => {
    await updateDoc(doc(db,'patients',currentPatientId), { status: 'census' });
    app.closeSheet(); showToast('Regresado al Censo');
};

// Programar
app.openScheduleModal = () => {
    app.closeSheet();
    $('modal-schedule').classList.remove('hidden');
};

$('btn-confirm-schedule').onclick = async () => {
    const date = $('sched-date').value;
    if(!date) return showToast('Seleccione fecha');
    await updateDoc(doc(db,'patients',currentPatientId), { status: 'scheduled', surgeryDate: date });
    $('modal-schedule').classList.add('hidden');
    $('view-detail').classList.remove('active');
    showToast('Paciente Programado');
};

// --- COMPLEX NOTES LOGIC ---
app.openNote = (type) => {
    const m = $('modal-note');
    const f = $('note-fields');
    $('form-note').dataset.type = type;
    f.innerHTML = '';
    m.classList.remove('hidden');
    
    $('note-title').textContent = type.toUpperCase().replace('_',' ');
    
    let html = '';
    
    if(type === 'visita') {
        html = `
            <input name="subj" class="input-std mb-2" placeholder="Subjetivo">
            <div class="row mb-2"><input name="ta" class="input-std" placeholder="TA"><input name="fc" class="input-std" placeholder="FC"><input name="temp" class="input-std" placeholder="Temp"></div>
            <input name="labs" class="input-std mb-2" placeholder="Labs relevantes">
            <input name="gasto" class="input-std mb-2" placeholder="Gasto urinario/drenaje">
            <textarea name="plan" placeholder="Análisis y Plan"></textarea>
        `;
        show('btn-wa');
    } else if (type === 'labs') {
        html = `
            <div class="row mb-2"><input name="hb" class="input-std" placeholder="Hb"><input name="htc" class="input-std" placeholder="Htc"></div>
            <div class="row mb-2"><input name="leu" class="input-std" placeholder="Leu"><input name="plaq" class="input-std" placeholder="Plaq"></div>
            <div class="row mb-2"><input name="glu" class="input-std" placeholder="Glu"><input name="cre" class="input-std" placeholder="Cr"></div>
            <div class="row mb-2"><input name="na" class="input-std" placeholder="Na"><input name="k" class="input-std" placeholder="K"></div>
        `;
        hide('btn-wa');
    } else if (type === 'check_qx') {
        html = `
            <label class="checklist-item"><input type="checkbox" name="carta"> Carta Seguro</label>
            <label class="checklist-item"><input type="checkbox" name="nota_int"> Nota Internamiento</label>
            <label class="checklist-item"><input type="checkbox" name="vpo"> VPO</label>
            <label class="checklist-item"><input type="checkbox" name="labs"> Laboratorios</label>
            <label class="checklist-item"><input type="checkbox" name="sangre"> Sangre disponible</label>
        `;
        hide('btn-wa');
    } else if (type === 'check_egr') {
        html = `
            <label class="checklist-item"><input type="checkbox" name="receta"> Receta</label>
            <label class="checklist-item"><input type="checkbox" name="informe"> Informe Médico</label>
            <label class="checklist-item"><input type="checkbox" name="nota"> Nota Egreso</label>
            <label class="checklist-item"><input type="checkbox" name="cita"> Cita abierta</label>
        `;
        hide('btn-wa');
    } else if (type === 'vpo') {
        html = `
            <input name="asa" class="input-std mb-2" placeholder="ASA">
            <input name="medico" class="input-std mb-2" placeholder="Médico que valora">
            <textarea name="text" placeholder="Comentarios VPO"></textarea>
        `;
        hide('btn-wa');
    } else {
        html = `<textarea name="text" placeholder="Escriba aquí..."></textarea>`;
        hide('btn-wa');
    }
    
    f.innerHTML = html;
};

$('form-note').onsubmit = async e => {
    e.preventDefault();
    const type = e.target.dataset.type;
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    // Handle checkboxes
    if(type.includes('check')) {
        e.target.querySelectorAll('input[type="checkbox"]').forEach(c => data[c.name] = c.checked);
    }

    await updateDoc(doc(db,'patients',currentPatientId), {
        notes: arrayUnion({ type, data, author: auth.currentUser.displayName, timestamp: new Date().toISOString() })
    });
    $('modal-note').classList.add('hidden');
    showToast('Nota guardada');
};

$('btn-wa').onclick = () => {
    const fd = new FormData($('form-note'));
    const txt = `*PACIENTE:* ${$('det-name').textContent}\n*S:* ${fd.get('subj')}\n*Sig:* TA ${fd.get('ta')} FC ${fd.get('fc')}\n*A/P:* ${fd.get('plan')}`;
    navigator.clipboard.writeText(txt); showToast('Copiado');
};

function renderTimeline(notes) {
    const box = $('timeline-container'); box.innerHTML = '';
    notes.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).forEach(n => {
        const d = new Date(n.timestamp);
        let content = '';
        if(n.type==='visita') content=`<b>S:</b> ${n.data.subj}<br><b>Plan:</b> ${n.data.plan}`;
        else if(n.type==='labs') content=`Hb: ${n.data.hb} Leu: ${n.data.leu} Cr: ${n.data.cre}`;
        else if(n.type.includes('check')) content = Object.keys(n.data).map(k=> `${k}: ${n.data[k]?'✅':'❌'}`).join(', ');
        else content = n.data.text || JSON.stringify(n.data);

        const div = document.createElement('div'); div.className='tl-item';
        div.innerHTML = `
            <div class="tl-header"><span>${n.type.toUpperCase()}</span> <span>${d.toLocaleDateString()} ${d.getHours()}:${d.getMinutes()}</span></div>
            <div class="tl-content">${content}</div>
        `;
        box.appendChild(div);
    });
}

// Close Modals
document.querySelectorAll('.close-modal, .close-note, .close-sched').forEach(b => b.onclick = function() {
    this.closest('.modal-overlay').classList.add('hidden');
});

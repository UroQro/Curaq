
// IMPORT FIREBASE (Usando CDN Modular para evitar bundlers complejos en este zip)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    onSnapshot, 
    query, 
    where, 
    orderBy,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBdmVCQnUjDUXqwsiCPemJZ6u0fl5DhFAo",
  authDomain: "curaq-e3118.firebaseapp.com",
  projectId: "curaq-e3118",
  storageBucket: "curaq-e3118.firebasestorage.app",
  messagingSenderId: "849145373580",
  appId: "1:849145373580:web:a6e0a5095db154e45d6ca9",
  measurementId: "G-T17XP80GD1"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONSTANTES Y DATA ---
const ADMIN_KEY = "Curaq8135892041";

const HOSPITALS = [
    {name: "Hospital Star Médica", abbr: "STAR"}, {name: "Hospital Ángeles Querétaro", abbr: "HAQ"},
    {name: "Hospital Ángeles Centro Sur", abbr: "HACS"}, {name: "Hospital H+", abbr: "HPLUS"},
    {name: "Hospital San José", abbr: "HSJ"}, {name: "Hospital Moscati", abbr: "MOSC"},
    {name: "Gestamed", abbr: "GESTA"}, {name: "Hospital Santa Rosa de Viterbo", abbr: "HSRV"},
    {name: "Hospital Santo Tomás", abbr: "HST"}, {name: "Hospital Médica Ebor", abbr: "EBOR"},
    {name: "Hospital Santiago de Querétaro", abbr: "HSQ"}, {name: "Hospital Jardines", abbr: "HJAR"},
    {name: "Clínica San Francisco", abbr: "CSF"}, {name: "Hospital San Pedro", abbr: "HSP"},
    {name: "Hospital del Sagrado Corazón", abbr: "HSC"}, {name: "Clínica Las Campanas", abbr: "CLC"},
    {name: "Centro Médico Jurica", abbr: "CMJ"}, {name: "Clínica CER", abbr: "CER"},
    {name: "Hospital Idaly Medical", abbr: "IDALY"}, {name: "Clínica de Especialidades Médicas", abbr: "CEM"},
    {name: "Otro", abbr: "OTRO"}
];

const DOCTORS = ["Enrique Hans Mues Guizar", "Rolando L Bonilla Silva", "Otro"];

const INSURANCES = [
    {name: "Afirme", abbr: "AFIR"}, {name: "Allianz", abbr: "ALLI"}, {name: "Atlas", abbr: "ATLA"},
    {name: "Atlantis", abbr: "ATLN"}, {name: "AXA", abbr: "AXA"}, {name: "Banorte", abbr: "BANO"},
    {name: "Bupa", abbr: "BUPA"}, {name: "VUMI", abbr: "VUMI"}, {name: "Bx+ (Ve por Más)", abbr: "BX+"},
    {name: "Chubb", abbr: "CHUB"}, {name: "General de Seguros", abbr: "GSEG"}, {name: "GNP", abbr: "GNP"},
    {name: "Inbursa", abbr: "INBU"}, {name: "La Latino Seguros", abbr: "LALAT"}, {name: "Mapfre", abbr: "MAPF"},
    {name: "MetLife", abbr: "METL"}, {name: "Pan-American México", abbr: "PANAM"}, {name: "Plan Seguro", abbr: "PLAN"},
    {name: "Sisnova", abbr: "SISN"}, {name: "Prevem", abbr: "PREV"}, {name: "Seguros Monterrey New York Life", abbr: "SMNYL"},
    {name: "Sura", abbr: "SURA"}, {name: "Particular", abbr: "PART"}, {name: "Paquete", abbr: "PAQ"},
    {name: "Otro", abbr: "OTRO"}
];

// --- ESTADO GLOBAL ---
let currentUser = null;
let patientsUnsub = null;
let currentPatientId = null;

// --- UTILS ---
const $ = id => document.getElementById(id);
const hide = id => $(id).classList.add('hidden');
const show = id => $(id).classList.remove('hidden');

function calculateAge(dob) {
    if(!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// --- AUTH LOGIC ---
onAuthStateChanged(auth, (user) => {
    hide('loading-screen');
    if (user) {
        currentUser = user;
        $('user-display-name').textContent = user.displayName || user.email;
        show('app');
        hide('auth-view');
        show('dashboard-view');
        initRealtimeData();
    } else {
        currentUser = null;
        show('app');
        show('auth-view');
        hide('dashboard-view');
        if(patientsUnsub) patientsUnsub();
    }
});

// Eventos Auth
$('btn-goto-register').onclick = () => { hide('login-form'); show('register-form'); };
$('btn-goto-login').onclick = () => { hide('register-form'); show('login-form'); };

$('login-form').onsubmit = (e) => {
    e.preventDefault();
    const email = $('login-email').value;
    const pass = $('login-password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
};

$('register-form').onsubmit = (e) => {
    e.preventDefault();
    const key = $('reg-key').value;
    if(key !== ADMIN_KEY) return alert("Clave maestra incorrecta.");

    const email = $('reg-email').value;
    const pass = $('reg-password').value;
    const name = $('reg-name').value;

    createUserWithEmailAndPassword(auth, email, pass)
        .then(creds => updateProfile(creds.user, { displayName: name }))
        .catch(err => alert(err.message));
};

$('btn-logout').onclick = () => signOut(auth);

// --- NAVEGACIÓN TABS ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        $(`tab-${btn.dataset.target}`).classList.add('active');
    };
});

// --- RENDERIZADO DE PACIENTES ---
function initRealtimeData() {
    const q = query(collection(db, "patients")); 
    
    patientsUnsub = onSnapshot(q, (snapshot) => {
        const censusList = $('census-list');
        const scheduleList = $('schedule-list');
        const dischargeList = $('discharge-list');
        
        censusList.innerHTML = '';
        scheduleList.innerHTML = '';
        dischargeList.innerHTML = '';

        const filterHosp = $('filter-hospital').value;
        const filterDoc = $('filter-doctor').value;

        const today = getTodayStr();

        snapshot.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            
            // Filtros de Censo
            if (p.status === 'census') {
                if (filterHosp && p.hospital !== filterHosp) return;
                if (filterDoc && p.doctor !== filterDoc) return;
                
                // Lógica de Colores y Checkbox
                let cardClass = 'status-red';
                let isChecked = false;

                // Reinicio de media noche (Si la fecha guardada no es hoy, es rojo)
                if (p.lastVisitCheck === today) {
                    cardClass = 'status-blue';
                    isChecked = true;
                }
                
                if (p.preDischarge) cardClass = 'status-purple';

                const card = createCard(p, cardClass, isChecked);
                censusList.appendChild(card);
            }
            else if (p.status === 'scheduled') {
                // Opacidad según fecha
                let opacityClass = 'opacity-75';
                if (p.surgeryDate === today) opacityClass = 'opacity-100';
                
                const card = createCard(p, opacityClass, false);
                scheduleList.appendChild(card);
            }
            else if (p.status === 'discharged') {
                const card = createCardDischarged(p);
                dischargeList.appendChild(card);
            }
        });
    });
}

function createCard(p, statusClass, isChecked) {
    const div = document.createElement('div');
    div.className = `patient-card ${statusClass}`;
    div.innerHTML = `
        <div class="card-header">
            <span class="hosp-badge">${p.hospital}</span>
            ${p.status === 'census' ? 
                `<input type="checkbox" class="visit-checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleVisit('${p.id}', this.checked)">` 
                : ''}
        </div>
        <div class="card-body" onclick="openDetails('${p.id}')">
            <h3>${p.name}</h3>
            <p><strong>Edad:</strong> ${calculateAge(p.dob)} | <strong>Seguro:</strong> ${p.insurance}</p>
            <p><strong>Dx:</strong> ${p.diagnosis}</p>
            <p><strong>Dr:</strong> ${p.doctor}</p>
            ${p.status === 'scheduled' ? `<p><strong>Fecha Qx:</strong> ${p.surgeryDate}</p>` : ''}
        </div>
        <div class="card-actions">
            ${p.status === 'census' ? `
                <button class="btn-card" onclick="event.stopPropagation(); setPreDischarge('${p.id}', ${!p.preDischarge})">Pre-Alta</button>
                <button class="btn-card" onclick="event.stopPropagation(); openScheduler('${p.id}')">Programar</button>
                <button class="btn-card" onclick="event.stopPropagation(); dischargePatient('${p.id}')">Egresar</button>
            ` : ''}
            ${p.status === 'scheduled' ? `
                <button class="btn-card" onclick="event.stopPropagation(); returnToCensus('${p.id}')">Al Censo</button>
                <button class="btn-card" onclick="event.stopPropagation(); dischargePatient('${p.id}')">Egresar</button>
            ` : ''}
        </div>
    `;
    return div;
}

function createCardDischarged(p) {
    const div = document.createElement('div');
    div.className = "patient-card status-blue";
    div.innerHTML = `
        <div class="card-header"><span class="hosp-badge">${p.hospital}</span></div>
        <h3>${p.name}</h3>
        <p>Egreso: ${p.dischargeDate || 'N/A'}</p>
        <p>Seguro: ${p.insurance}</p>
        <label><input type="checkbox" ${p.insurancePaperwork ? 'checked' : ''} onclick="togglePaperwork('${p.id}', this.checked)"> Trámite Aseguradora</label>
        <div class="card-actions">
            <button class="btn-card" onclick="returnToCensus('${p.id}')">Reingresar al Censo</button>
        </div>
    `;
    return div;
}

// --- ACCIONES CRUD ---

// Lógica de Visita (Checkbox)
window.toggleVisit = async (id, checked) => {
    const today = getTodayStr();
    await updateDoc(doc(db, "patients", id), {
        lastVisitCheck: checked ? today : null
    });
};

window.setPreDischarge = async (id, val) => {
    await updateDoc(doc(db, "patients", id), { preDischarge: val });
};

window.dischargePatient = async (id) => {
    if(!confirm("¿Egresar paciente?")) return;
    await updateDoc(doc(db, "patients", id), {
        status: 'discharged',
        dischargeDate: getTodayStr(),
        preDischarge: false
    });
};

window.returnToCensus = async (id) => {
    await updateDoc(doc(db, "patients", id), { status: 'census' });
};

window.togglePaperwork = async (id, val) => {
    await updateDoc(doc(db, "patients", id), { insurancePaperwork: val });
};

// Crear Paciente / Programar
const patModal = $('modal-patient');
$('fab-add-census').onclick = () => openPatModal('census');
$('fab-add-schedule').onclick = () => openPatModal('schedule');

window.openScheduler = (id) => {
    // Busca datos existentes y abre modal en modo schedule
    // Para simplificar en este script: abre modal vacío, usuario llena rápido
    // Idealmente: fetch doc -> fill form -> show
    alert("Para mover a programación, edite la ficha y seleccione una fecha.");
};

function openPatModal(mode) {
    $('form-patient').reset();
    patModal.classList.add('active');
    $('group-schedule-date').classList.toggle('hidden', mode !== 'schedule');
    $('pat-schedule-date').required = (mode === 'schedule');
}

$('form-patient').onsubmit = async (e) => {
    e.preventDefault();
    
    // Obtener valores de los Selects/Others
    const getVal = (selId, otherId) => {
        const v = $(selId).value;
        return (v === 'OTRO' || v === 'Otro') ? $(otherId).value : v;
    };

    const data = {
        hospital: getVal('pat-hospital', 'pat-hospital-other').substring(0,4).toUpperCase(),
        name: $('pat-name').value,
        dob: $('pat-dob').value,
        caseType: $('pat-case-type').value,
        diagnosis: $('pat-diagnosis').value,
        doctor: getVal('pat-doctor', 'pat-doctor-other'),
        insurance: getVal('pat-insurance', 'pat-insurance-other').substring(0,4).toUpperCase(),
        status: $('pat-schedule-date').value ? 'scheduled' : 'census',
        surgeryDate: $('pat-schedule-date').value || null,
        preDischarge: false,
        lastVisitCheck: null,
        insurancePaperwork: false
    };

    try {
        await addDoc(collection(db, "patients"), data);
        patModal.classList.remove('active');
    } catch(err) { alert(err.message); }
};

// --- DETALLES Y NOTAS ---
const detModal = $('modal-details');
window.openDetails = (id) => {
    currentPatientId = id;
    // Snapshot para datos en tiempo real de un solo doc
    onSnapshot(doc(db, "patients", id), (docSnap) => {
        if(!docSnap.exists()) return;
        const p = docSnap.data();
        $('det-name').textContent = p.name;
        $('det-age').textContent = calculateAge(p.dob) + ' años';
        $('det-hospital').textContent = p.hospital;
        $('det-insurance').textContent = p.insurance;

        // Populate fields
        $('det-phone').value = p.phone || '';
        if(p.history) {
            $('ant-dm').checked = p.history.dm;
            $('ant-has').checked = p.history.has;
            $('ant-hipo').checked = p.history.hipo;
            $('ant-onco').checked = p.history.onco;
            $('det-history-text').value = p.history.text || '';
            $('det-meds').value = p.history.meds || '';
            $('det-surgeries').value = p.history.surgeries || '';
        }

        renderNotes(p.notes || []);
    });
    detModal.classList.add('active');
};

$('btn-save-meta').onclick = async () => {
    if(!currentPatientId) return;
    const history = {
        dm: $('ant-dm').checked,
        has: $('ant-has').checked,
        hipo: $('ant-hipo').checked,
        onco: $('ant-onco').checked,
        text: $('det-history-text').value,
        meds: $('det-meds').value,
        surgeries: $('det-surgeries').value
    };
    await updateDoc(doc(db, "patients", currentPatientId), {
        phone: $('det-phone').value,
        history: history
    });
    alert("Ficha actualizada");
};

// --- GESTOR DE NOTAS ---
window.app = {}; // Namespace global para onclicks
window.app.openNoteModal = (type) => {
    const m = $('modal-note-editor');
    const container = $('note-fields-container');
    const form = $('form-note');
    const title = $('note-editor-title');
    const waBtn = $('btn-copy-wa');
    
    container.innerHTML = '';
    form.dataset.type = type;
    waBtn.classList.add('hidden');
    m.classList.add('active');

    if (type === 'visita') {
        title.textContent = "Visita Diaria";
        waBtn.classList.remove('hidden');
        container.innerHTML = `
            <input type="text" name="subj" placeholder="Subjetivo">
            <input type="text" name="signos" placeholder="Signos Vitales">
            <input type="text" name="labs" placeholder="Laboratorios">
            <input type="text" name="gasto" placeholder="Gasto Urinario/Drenaje">
            <textarea name="analisis" placeholder="Análisis y Plan"></textarea>
        `;
    } else if (type === 'verif_qx') {
        title.textContent = "Verificación Quirúrgica";
        container.innerHTML = `
            <label><input type="checkbox" name="carta"> Carta Seguro</label>
            <label><input type="checkbox" name="nota_int"> Nota Internamiento</label>
            <label><input type="checkbox" name="vpo"> VPO</label>
            <label><input type="checkbox" name="labs"> Laboratorios</label>
            <label><input type="checkbox" name="ind_pre"> Indicaciones Pre-Op</label>
            <label><input type="checkbox" name="conf_tel"> Confirmación Telefónica</label>
        `;
    } else if (type === 'verif_egreso') {
        title.textContent = "Verificación de Egreso";
        container.innerHTML = `
            <label><input type="checkbox" name="receta"> Receta Entregada</label>
            <label><input type="checkbox" name="informe"> Informe Médico</label>
            <label><input type="checkbox" name="nota_egr"> Nota de Egreso</label>
        `;
    } else if (type === 'labs') {
        title.textContent = "Nota de Laboratorios";
        container.innerHTML = `
            <div class="row"><input name="hb" placeholder="Hb"><input name="htc" placeholder="Htc"></div>
            <div class="row"><input name="leu" placeholder="Leucocitos"><input name="plaq" placeholder="Plaquetas"></div>
            <div class="row"><input name="glu" placeholder="Glucosa"><input name="urea" placeholder="Urea"></div>
            <div class="row"><input name="bun" placeholder="BUN"><input name="creat" placeholder="Creatinina"></div>
            <div class="row"><input name="na" placeholder="Na"><input name="k" placeholder="K"><input name="cl" placeholder="Cl"></div>
            <div class="row"><input name="tp" placeholder="TP"><input name="ttp" placeholder="TTP"><input name="inr" placeholder="INR"></div>
        `;
    } else if (type === 'vpo') {
        title.textContent = "Nota VPO";
        container.innerHTML = `
             <input type="text" name="medico" placeholder="Médico que realizó VPO">
             <input type="date" name="fecha">
             <input type="text" name="asa" placeholder="Grupo ASA">
        `;
    } else if (type === 'libre') {
        title.textContent = "Nota Libre";
        container.innerHTML = `<textarea name="texto" placeholder="Escriba su nota..."></textarea>`;
    } 
    // ... (Se pueden agregar el resto de tipos siguiendo el mismo patrón)
    else {
        container.innerHTML = `<textarea name="texto" placeholder="Detalles..."></textarea>`;
    }
};

$('form-note').onsubmit = async (e) => {
    e.preventDefault();
    const type = e.target.dataset.type;
    const formData = new FormData(e.target);
    const noteData = Object.fromEntries(formData.entries());
    
    // Checkboxes handling
    if(type === 'verif_qx' || type === 'verif_egreso') {
        e.target.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            noteData[chk.name] = chk.checked;
        });
    }

    const newNote = {
        type: type,
        author: currentUser.displayName,
        timestamp: new Date().toISOString(),
        data: noteData
    };

    await updateDoc(doc(db, "patients", currentPatientId), {
        notes: arrayUnion(newNote)
    });
    
    $('modal-note-editor').classList.remove('active');
};

// Generador de Texto para WhatsApp (Visita)
$('btn-copy-wa').onclick = () => {
    const f = new FormData($('form-note'));
    const txt = `*REPORTE CURAQ*
Pac: ${$('det-name').textContent}

*Subj:* ${f.get('subj')}
*Signos:* ${f.get('signos')}
*Labs:* ${f.get('labs')}
*Gasto:* ${f.get('gasto')}
*Plan:* ${f.get('analisis')}`;
    navigator.clipboard.writeText(txt).then(() => alert("Copiado al portapapeles"));
};

function renderNotes(notes) {
    const tl = $('notes-timeline');
    tl.innerHTML = '';
    // Ordenar descendente
    const sorted = [...notes].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sorted.forEach(n => {
        const d = new Date(n.timestamp);
        const dateStr = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`;
        
        let content = '';
        if(n.type === 'visita') {
            content = `Subj: ${n.data.subj}
Plan: ${n.data.analisis}`;
        } else if (n.type === 'labs') {
            content = `Hb: ${n.data.hb} | Leu: ${n.data.leu} | Cr: ${n.data.creat}`;
        } else if (n.type === 'libre') {
            content = n.data.texto;
        } else {
            content = JSON.stringify(n.data).replace(/["{}]/g, '').replace(/,/g, '\n');
        }

        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-meta">
                <span>${n.author || 'Usuario'}</span>
                <span>${dateStr}</span>
            </div>
            <div class="timeline-body"><strong>${n.type.toUpperCase()}</strong>: ${content}</div>
        `;
        tl.appendChild(div);
    });
}

// --- POPULATE DROPDOWNS ---
const populate = (id, arr) => {
    const s = $(id);
    arr.forEach(x => {
        const val = x.abbr || x; // Handle object or string
        const txt = x.name || x;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = txt;
        s.appendChild(opt);
    });
    // Manejo de "Otros"
    s.onchange = (e) => {
        const otherInput = $(id + '-other');
        if(otherInput) {
            if(e.target.value === 'OTRO' || e.target.value === 'Otro') otherInput.classList.remove('hidden');
            else otherInput.classList.add('hidden');
        }
    };
};

populate('pat-hospital', HOSPITALS);
populate('filter-hospital', HOSPITALS);
populate('pat-doctor', DOCTORS);
populate('filter-doctor', DOCTORS);
populate('pat-insurance', INSURANCES);

// --- CSV DOWNLOAD ---
$('btn-download-csv').onclick = async () => {
    // Descarga simple de colección
    // Nota: en producción esto debe ser paginado si son muchos datos
    alert("Función preparada para conectar historial completo.");
};

// Close Modals
document.querySelectorAll('.close-modal').forEach(x => x.onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
});

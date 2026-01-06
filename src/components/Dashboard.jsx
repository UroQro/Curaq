import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { LogOut, Plus, Search, Calendar, CheckSquare, Archive, User } from 'lucide-react';
import { HOSPITALS, DOCTORS, INSURANCES, calculateAge, getLocalISODate } from '../constants';
import PatientDetail from './PatientDetail';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('census');
  const [patients, setPatients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [hospFilter, setHospFilter] = useState('');

  // 1. Resetear Checkbox a Media Noche
  const checkMidnightReset = async () => {
      const today = getLocalISODate();
      const metaRef = doc(db, 'metadata', 'daily_reset');
      const metaSnap = await getDoc(metaRef);
      if (!metaSnap.exists() || metaSnap.data().date !== today) {
          // Necesita reset
          const batch = writeBatch(db);
          patients.forEach(p => {
              if (p.lastVisitCheck && p.lastVisitCheck !== today) {
                  const ref = doc(db, 'patients', p.id);
                  batch.update(ref, { lastVisitCheck: null });
              }
          });
          batch.set(metaRef, { date: today }); // Guardar fecha hoy
          await batch.commit();
      }
  };

  useEffect(() => {
    const q = query(collection(db, "patients"));
    const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setPatients(data);
    });
    return () => unsub();
  }, []);
  
  // Ejecutar check reset cuando cargan pacientes
  useEffect(() => { if(patients.length > 0) checkMidnightReset(); }, [patients]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const f = e.target;
    const newP = {
        name: f.name.value,
        hospital: f.hospital.value === 'Otro' ? f.hospitalOther.value : f.hospital.value,
        doctor: f.doctor.value === 'Otro' ? f.doctorOther.value : f.doctor.value,
        insurance: f.insurance.value === 'Otro' ? f.insuranceOther.value : f.insurance.value,
        diagnosis: f.diagnosis.value,
        dob: f.dob.value,
        type: f.type.value,
        status: 'census', 
        admissionDate: new Date().toISOString(),
        notes: [],
        history: { dm: false, has: false, others: '' },
        preDischarge: false,
        lastVisitCheck: null
    };
    await addDoc(collection(db, "patients"), newP);
    setShowAdd(false);
  };

  const filteredList = patients.filter(p => {
      if(search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if(hospFilter && p.hospital !== hospFilter) return false;
      if(activeTab === 'census') return p.status === 'census';
      if(activeTab === 'schedule') return p.status === 'scheduled';
      if(activeTab === 'discharges') return p.status === 'discharged';
      return false;
  });

  const getStatusStyle = (p) => {
     if(p.status === 'scheduled') return 'border-l-4 border-blue-400 bg-white opacity-90';
     if(p.status === 'discharged') return 'border-l-4 border-gray-400 bg-gray-50';
     // Logic for Census
     if(p.lastVisitCheck === getLocalISODate()) return 'border-l-4 border-blue-600 bg-blue-50/50'; // Visited
     if(p.preDischarge) return 'border-l-4 border-purple-500 bg-purple-50/50'; // Pre-alta
     return 'border-l-4 border-red-500 bg-white'; // Pending
  };

  if (selectedPatient) return <PatientDetail patient={selectedPatient} onClose={()=>setSelectedPatient(null)} user={user} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 font-sans">
        <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
            <div className="flex justify-between items-center mb-3">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">CURAQ</h1>
                <button onClick={onLogout} className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-full font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wide">
                    <User size={12}/> {user.displayName || 'Usuario'}
                </button>
            </div>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <NavBtn active={activeTab==='census'} onClick={()=>setActiveTab('census')} icon={<CheckSquare size={14}/>} label="Censo" />
                <NavBtn active={activeTab==='schedule'} onClick={()=>setActiveTab('schedule')} icon={<Calendar size={14}/>} label="Agenda" />
                <NavBtn active={activeTab==='discharges'} onClick={()=>setActiveTab('discharges')} icon={<Archive size={14}/>} label="Egresos" />
            </div>
        </header>

        <main className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4 space-y-2">
                <div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={18}/><input className="w-full pl-10 p-2.5 rounded-xl border-none bg-white shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
                {activeTab === 'census' && (
                    <select className="w-full p-2.5 rounded-xl border-none bg-white shadow-sm text-sm text-gray-600 outline-none" value={hospFilter} onChange={e=>setHospFilter(e.target.value)}>
                        <option value="">Todos los Hospitales</option>{HOSPITALS.map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                )}
            </div>

            <div className="space-y-3">
                {filteredList.map(p => (
                    <div key={p.id} onClick={()=>setSelectedPatient(p)} className={`card-patient ${getStatusStyle(p)}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.type}</span>
                                    {p.status === 'scheduled' && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{p.surgeryDate}</span>}
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{p.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 font-medium">{p.hospital} • {calculateAge(p.dob)} años</p>
                                <p className="text-xs text-blue-600 mt-1 font-medium">{p.diagnosis}</p>
                            </div>
                            {/* Check visual de visita */}
                            {p.status === 'census' && p.lastVisitCheck === getLocalISODate() && <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs shadow-md shadow-blue-200">✓</div>}
                        </div>
                    </div>
                ))}
                {filteredList.length === 0 && <div className="text-center text-gray-400 mt-10 text-sm">No hay pacientes aquí.</div>}
            </div>
        </main>

        {activeTab !== 'discharges' && <button onClick={()=>setShowAdd(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition z-20"><Plus size={28} /></button>}

        {showAdd && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Nuevo Paciente</h2>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <input name="name" placeholder="Nombre Completo" required className="input-rounds" />
                        <div className="grid grid-cols-2 gap-2"><input type="date" name="dob" required className="input-rounds" /><select name="type" className="input-rounds"><option>Médico</option><option>Quirúrgico</option><option>Interconsulta</option></select></div>
                        <select name="hospital" className="input-rounds" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherHosp').classList.remove('hidden'); else document.getElementById('otherHosp').classList.add('hidden'); }}><option value="">Hospital...</option>{HOSPITALS.map(h=><option key={h} value={h}>{h}</option>)}<option value="Otro">Otro...</option></select><input id="otherHosp" name="hospitalOther" placeholder="Especifique" className="input-rounds hidden bg-blue-50" />
                        <input name="diagnosis" placeholder="Diagnóstico" required className="input-rounds" />
                        <select name="doctor" className="input-rounds" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherDoc').classList.remove('hidden'); else document.getElementById('otherDoc').classList.add('hidden'); }}><option value="">Tratante...</option>{DOCTORS.map(d=><option key={d} value={d}>{d}</option>)}<option value="Otro">Otro...</option></select><input id="otherDoc" name="doctorOther" placeholder="Especifique" className="input-rounds hidden bg-blue-50" />
                        <select name="insurance" className="input-rounds" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherIns').classList.remove('hidden'); else document.getElementById('otherIns').classList.add('hidden'); }}><option value="">Seguro...</option>{INSURANCES.map(i=><option key={i} value={i}>{i}</option>)}<option value="Otro">Otro...</option></select><input id="otherIns" name="insuranceOther" placeholder="Especifique" className="input-rounds hidden bg-blue-50" />
                        <div className="flex gap-2 pt-4"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Guardar</button></div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

const NavBtn = ({active, onClick, icon, label}) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
        {icon} {label}
    </button>
);

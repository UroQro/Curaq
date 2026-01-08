import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore';
import { HOSPITALS, DOCTORS } from '../constants';
import { calculateAge } from '../utils';
import PatientDetail from './PatientDetail';
import PatientFormModal from './PatientFormModal';
import { Plus, CheckSquare, Square, LogOut, CalendarClock, Briefcase, Syringe, AlertCircle } from 'lucide-react';

export default function Census({ user }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterHosp, setFilterHosp] = useState('');
  const [filterDoc, setFilterDoc] = useState('');

  useEffect(() => {
    const q = query(collection(db, "patients"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
    });
    return () => unsubscribe();
  }, []);

  const toggleDailyCheck = async (e, p) => { e.stopPropagation(); await updateDoc(doc(db, "patients", p.id), { dailyCheck: !p.dailyCheck }); };
  const togglePreDischarge = async (e, p) => { e.stopPropagation(); await updateDoc(doc(db, "patients", p.id), { preDischarge: !p.preDischarge }); };
  
  const sendToProgramming = async (e, p) => { 
      e.stopPropagation(); 
      const date = prompt("Fecha de Cirugía (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
      if(date) await updateDoc(doc(db, "patients", p.id), { scheduledDate: date });
      alert("Programación actualizada.");
  };

  const dischargePatient = async (e, p) => { e.stopPropagation(); if(confirm(`¿Egresar a ${p.name}?`)) { await updateDoc(doc(db, "patients", p.id), { status: 'discharged', dischargeDate: new Date().toISOString() }); } };

  const getCardStyle = (p) => {
    if (p.preDischarge) return "bg-purple-100 dark:bg-purple-900/40 border-l-[6px] border-purple-600";
    if (p.dailyCheck) return "bg-blue-50 dark:bg-blue-900/30 border-l-[6px] border-blue-600";
    return "bg-red-50 dark:bg-red-900/30 border-l-[6px] border-red-600"; 
  };

  if (selectedPatient) return <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} user={user} />;

  return (
    <div className="pb-24">
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-4 sticky top-0 z-10 flex flex-col md:flex-row gap-2">
         <select className="flex-1 p-2 border rounded text-xs bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={filterHosp} onChange={e=>setFilterHosp(e.target.value)}><option value="">Todos los Hospitales</option>{HOSPITALS.map(h => <option key={h.abbr} value={h.abbr}>{h.abbr} - {h.full}</option>)}</select>
         <select className="flex-1 p-2 border rounded text-xs bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={filterDoc} onChange={e=>setFilterDoc(e.target.value)}><option value="">Todos los Tratantes</option>{DOCTORS.map(d => <option key={d}>{d}</option>)}<option value="Otro">Otro...</option></select>
      </div>

      <div className="grid grid-cols-1 gap-3">
         {patients.filter(p => !filterHosp || p.hospital === filterHosp).filter(p => !filterDoc || p.doctor === filterDoc || (filterDoc === 'Otro' && !DOCTORS.includes(p.doctor))).map(p => {
            const hasPending = p.checklist?.some(t => !t.done);
            return (
            <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-4 rounded-lg cursor-pointer shadow-sm relative transition-all active:scale-[0.98] ${getCardStyle(p)}`}>
               <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                     {/* BADGES SUPERIORES */}
                     <div className="flex items-center flex-wrap gap-2 mb-2">
                        {/* BADGE DE CAMA - NUEVO */}
                        {p.bedNumber && (
                           <div className="bg-slate-900 text-white px-2.5 py-1 rounded shadow-md border-l-4 border-blue-400 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                             <span className="text-[10px] text-slate-400 uppercase font-black leading-none">CAMA</span>
                             <span className="text-xl font-black leading-none">{p.bedNumber}</span>
                           </div>
                        )}
                        <span className="font-black text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">{p.hospital}</span>
                        {p.scheduledDate && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded font-bold flex items-center gap-1"><CalendarClock size={10}/> Programado</span>}
                     </div>

                     <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight mb-1 flex items-center gap-2">
                         {p.name}
                         {hasPending && <AlertCircle size={18} className="text-orange-500 fill-orange-100" />}
                     </h3>
                     <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{calculateAge(p.dob)} años • {p.diagnosis}</p>
                     {p.surgery && <p className="text-xs font-bold text-blue-600 dark:text-blue-300 flex items-center gap-1"><Syringe size={12}/> {p.surgery}</p>}
                     
                     <div className="text-xs opacity-80 flex gap-3 text-slate-500 dark:text-slate-400 mt-2">
                        <span>👨‍⚕️ {p.doctor}</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-full gap-3 pl-2 border-l border-slate-200/50 dark:border-slate-700/50">
                      <button onClick={(e) => toggleDailyCheck(e, p)} title="Visita Realizada">
                          {p.dailyCheck ? <CheckSquare size={28} className="text-blue-600 dark:text-blue-400"/> : <Square size={28} className="text-red-500/80 hover:text-red-600"/>}
                      </button>
                      
                      <div className="flex flex-col gap-2">
                          <button onClick={(e)=>sendToProgramming(e,p)} className="p-1.5 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400" title="Programar"><CalendarClock size={16}/></button>
                          <button onClick={(e)=>togglePreDischarge(e,p)} className={`p-1.5 rounded-full ${p.preDischarge?'bg-purple-600 text-white':'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'}`} title="Pre-Alta"><Briefcase size={16}/></button>
                          <button onClick={(e)=>dischargePatient(e,p)} className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300" title="Egresar"><LogOut size={16}/></button>
                      </div>
                  </div>
               </div>
            </div>
         )})}
         {patients.length === 0 && <div className="text-center p-10 text-slate-400">No hay pacientes activos en el censo.</div>}
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition z-20"><Plus size={28} /></button>
      {showAddModal && <PatientFormModal onClose={() => setShowAddModal(false)} mode="create" originContext="census" />}
    </div>
  );
}

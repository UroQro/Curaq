import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { LogOut, Plus, Search, Calendar, CheckSquare, Square, Archive, User } from 'lucide-react';
import { HOSPITALS, DOCTORS, INSURANCES } from '../constants';
import PatientDetail from './PatientDetail';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('census');
  const [patients, setPatients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [hospFilter, setHospFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, "patients"));
    const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setPatients(data);
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newP = {
        name: form.name.value,
        hospital: form.hospital.value === 'Otro' ? form.hospitalOther.value : form.hospital.value,
        doctor: form.doctor.value === 'Otro' ? form.doctorOther.value : form.doctor.value,
        insurance: form.insurance.value === 'Otro' ? form.insuranceOther.value : form.insurance.value,
        diagnosis: form.diagnosis.value,
        dob: form.dob.value,
        type: form.type.value,
        status: 'census', // census, scheduled, discharged
        admissionDate: new Date().toISOString(),
        notes: [],
        history: { dm: false, has: false, others: '' }
    };
    await addDoc(collection(db, "patients"), newP);
    setShowAdd(false);
  };

  const calculateAge = (dob) => {
      if(!dob) return '';
      const diff = Date.now() - new Date(dob).getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  // Logic to filter list based on Tab
  const filteredList = patients.filter(p => {
      if(search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if(hospFilter && p.hospital !== hospFilter) return false;

      if(activeTab === 'census') return p.status === 'census';
      if(activeTab === 'schedule') return p.status === 'scheduled';
      if(activeTab === 'discharges') return p.status === 'discharged';
      return false;
  });

  const getStatusColor = (p) => {
     const today = new Date().toISOString().split('T')[0];
     if(p.status === 'census') {
         if(p.lastVisitCheck === today) return 'border-l-8 border-blue-500 bg-blue-50';
         if(p.preDischarge) return 'border-l-8 border-purple-500 bg-purple-50';
         return 'border-l-8 border-red-500 bg-white';
     }
     if(p.status === 'scheduled') return 'border-l-8 border-blue-600 bg-white opacity-90';
     return 'border-l-8 border-gray-400 bg-gray-50';
  };

  if (selectedPatient) return <PatientDetail patient={selectedPatient} onClose={()=>setSelectedPatient(null)} user={user} />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-20">
        
        {/* HEADER TIPO ROUNDS APP */}
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-gray-800">CURAQ</h1>
                <button onClick={onLogout} className="text-xs bg-gray-200 px-3 py-1 rounded-full font-bold text-gray-600 flex items-center gap-1">
                    <User size={14}/> {user.displayName || user.email.split('@')[0]} <LogOut size={14}/>
                </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
                <NavBtn active={activeTab==='census'} onClick={()=>setActiveTab('census')} icon={<CheckSquare size={16}/>} label="Censo" />
                <NavBtn active={activeTab==='schedule'} onClick={()=>setActiveTab('schedule')} icon={<Calendar size={16}/>} label="Programación" />
                <NavBtn active={activeTab==='discharges'} onClick={()=>setActiveTab('discharges')} icon={<Archive size={16}/>} label="Egresos" />
            </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 flex-1 overflow-y-auto">
            {/* FILTROS */}
            <div className="mb-4 space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input className="w-full pl-10 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} />
                </div>
                {activeTab === 'census' && (
                    <select className="w-full p-2 rounded-lg border border-gray-300 bg-white text-sm" value={hospFilter} onChange={e=>setHospFilter(e.target.value)}>
                        <option value="">Todos los Hospitales</option>
                        {HOSPITALS.map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                )}
            </div>

            {/* LISTA DE PACIENTES */}
            <div className="space-y-3">
                {filteredList.map(p => (
                    <div key={p.id} onClick={()=>setSelectedPatient(p)} className={`p-4 rounded-xl shadow-sm cursor-pointer transition active:scale-95 ${getStatusColor(p)}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700 mr-2">{calculateAge(p.dob)} años</span>
                                    <span>{p.hospital}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{p.diagnosis}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded">{p.type}</span>
                                {p.status === 'scheduled' && <span className="mt-2 text-xs font-bold text-blue-600">{p.surgeryDate}</span>}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredList.length === 0 && <div className="text-center text-gray-400 mt-10">No hay pacientes en esta lista.</div>}
            </div>
        </main>

        {/* FAB ADD */}
        {activeTab !== 'discharges' && (
            <button onClick={()=>setShowAdd(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition z-20">
                <Plus size={28} />
            </button>
        )}

        {/* MODAL ADD */}
        {showAdd && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Nuevo Paciente</h2>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <input name="name" placeholder="Nombre Completo" required className="input-curaq" />
                        
                        <div className="grid grid-cols-2 gap-2">
                             <input type="date" name="dob" required className="input-curaq" />
                             <select name="type" className="input-curaq">
                                 <option>Médico</option><option>Quirúrgico</option><option>Interconsulta</option>
                             </select>
                        </div>

                        <select name="hospital" className="input-curaq" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherHosp').classList.remove('hidden'); else document.getElementById('otherHosp').classList.add('hidden'); }}>
                            <option value="">Hospital...</option>
                            {HOSPITALS.map(h=><option key={h} value={h}>{h}</option>)}
                            <option value="Otro">Otro...</option>
                        </select>
                        <input id="otherHosp" name="hospitalOther" placeholder="Especifique Hospital" className="input-curaq hidden bg-blue-50" />

                        <input name="diagnosis" placeholder="Diagnóstico" required className="input-curaq" />

                        <select name="doctor" className="input-curaq" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherDoc').classList.remove('hidden'); else document.getElementById('otherDoc').classList.add('hidden'); }}>
                            <option value="">Tratante...</option>
                            {DOCTORS.map(d=><option key={d} value={d}>{d}</option>)}
                            <option value="Otro">Otro...</option>
                        </select>
                        <input id="otherDoc" name="doctorOther" placeholder="Especifique Doctor" className="input-curaq hidden bg-blue-50" />
                        
                        <select name="insurance" className="input-curaq" onChange={(e)=> { if(e.target.value==='Otro') document.getElementById('otherIns').classList.remove('hidden'); else document.getElementById('otherIns').classList.add('hidden'); }}>
                            <option value="">Seguro...</option>
                            {INSURANCES.map(i=><option key={i} value={i}>{i}</option>)}
                            <option value="Otro">Otro...</option>
                        </select>
                        <input id="otherIns" name="insuranceOther" placeholder="Especifique Seguro" className="input-curaq hidden bg-blue-50" />

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">Cancelar</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

const NavBtn = ({active, onClick, icon, label}) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
        {icon} {label}
    </button>
);

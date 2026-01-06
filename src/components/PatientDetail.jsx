import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ArrowLeft, MoreVertical, Copy } from 'lucide-react';
import { getLocalISODate } from '../constants';
import NoteModal from './NoteModal';

export default function PatientDetail({ patient, onClose, user }) {
  const [activeTab, setActiveTab] = useState('notes'); // info vs notes
  const [showMenu, setShowMenu] = useState(false);
  
  // Note Modal State
  const [modalType, setModalType] = useState(null); // 'visita', 'labs', etc.

  const today = getLocalISODate();
  const isVisited = patient.lastVisitCheck === today;

  const toggleVisit = async () => {
      await updateDoc(doc(db, 'patients', patient.id), { lastVisitCheck: isVisited ? null : today });
  };

  const handleAction = async (action) => {
      setShowMenu(false);
      if(action === 'prealta') {
          await updateDoc(doc(db, 'patients', patient.id), { preDischarge: !patient.preDischarge });
          alert(patient.preDischarge ? "Pre-Alta removida" : "Paciente marcado para Pre-Alta");
      } else if (action === 'programar') {
          const date = prompt("Ingrese la fecha de cirugía (YYYY-MM-DD):", today);
          if(date) {
             await updateDoc(doc(db, 'patients', patient.id), { status: 'scheduled', surgeryDate: date });
             onClose();
          }
      } else if (action === 'egresar') {
          // Checklists logic could be enforced here
          if(confirm("¿Confirmar Egreso? Se moverá a la pestaña de Egresos.")) {
             await updateDoc(doc(db, 'patients', patient.id), { status: 'discharged', dischargeDate: new Date().toISOString(), preDischarge: false });
             onClose();
          }
      } else if (action === 'censo') {
          await updateDoc(doc(db, 'patients', patient.id), { status: 'census' });
          onClose();
      }
  };

  const handleSaveNote = async (data) => {
      const newNote = {
          id: Date.now().toString(),
          type: modalType,
          author: user.displayName || 'Dr.',
          timestamp: new Date().toISOString(),
          content: data
      };
      await updateDoc(doc(db, 'patients', patient.id), { notes: arrayUnion(newNote) });
      setModalType(null);
  };

  const updateClinical = async (e) => {
      e.preventDefault();
      const f = e.target;
      const history = {
          dm: f.dm.checked, has: f.has.checked, hipo: f.hipo.checked, onco: f.onco.checked,
          text: f.histText.value, meds: f.meds.value, surgeries: f.surgeries.value
      };
      await updateDoc(doc(db, 'patients', patient.id), { phone: f.phone.value, history });
      alert("Ficha actualizada");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* HEADER */}
        <div className="bg-white border-b sticky top-0 z-10">
            <div className="flex justify-between items-center p-4">
                <button onClick={onClose} className="text-blue-600 font-bold flex items-center gap-1"><ArrowLeft size={20}/> Atrás</button>
                <div className="relative">
                    <button onClick={()=>setShowMenu(!showMenu)} className="p-2 text-gray-500"><MoreVertical/></button>
                    {showMenu && (
                        <div className="absolute right-0 top-10 bg-white shadow-xl border rounded-xl w-48 py-2 z-20 animate-fade-in">
                            {patient.status === 'census' ? (
                                <>
                                <button onClick={()=>handleAction('prealta')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-purple-600 font-bold">
                                    {patient.preDischarge ? 'Quitar Pre-Alta' : 'Marcar Pre-Alta'}
                                </button>
                                <button onClick={()=>handleAction('programar')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-blue-600 font-bold">Programar Cirugía</button>
                                <button onClick={()=>handleAction('egresar')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600 font-bold">Egresar Paciente</button>
                                </>
                            ) : (
                                <button onClick={()=>handleAction('censo')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-600 font-bold">Regresar al Censo</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="px-6 pb-4">
                <h1 className="text-2xl font-black text-slate-800 leading-tight">{patient.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{patient.hospital} • {patient.doctor}</p>
                <p className="text-sm font-bold text-blue-600 mt-1">{patient.diagnosis}</p>
                {/* Visit Toggle */}
                {patient.status === 'census' && (
                    <div onClick={toggleVisit} className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${isVisited ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${isVisited ? 'bg-blue-500' : 'bg-gray-300'}`}>✓</div>
                        <span className={`text-xs font-bold ${isVisited ? 'text-blue-700' : 'text-gray-500'}`}>{isVisited ? 'Visita Realizada' : 'Marcar Visita'}</span>
                    </div>
                )}
            </div>
            {/* TABS */}
            <div className="flex border-t">
                <button onClick={()=>setActiveTab('notes')} className={`flex-1 py-3 text-xs font-bold tracking-wide ${activeTab==='notes'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400'}`}>NOTAS Y EVOLUCIÓN</button>
                <button onClick={()=>setActiveTab('info')} className={`flex-1 py-3 text-xs font-bold tracking-wide ${activeTab==='info'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400'}`}>DATOS CLÍNICOS</button>
            </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 bg-gray-50 p-4 pb-20 overflow-y-auto">
            
            {activeTab === 'info' && (
                <form onSubmit={updateClinical} className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Teléfono</label><input name="phone" defaultValue={patient.phone} placeholder="Contacto..." className="input-rounds" /></div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Antecedentes</label>
                        <div className="flex gap-2 my-2 flex-wrap">
                             <label className="chip"><input type="checkbox" name="dm" defaultChecked={patient.history?.dm} /> DM</label>
                             <label className="chip"><input type="checkbox" name="has" defaultChecked={patient.history?.has} /> HAS</label>
                             <label className="chip"><input type="checkbox" name="hipo" defaultChecked={patient.history?.hipo} /> HipoT</label>
                             <label className="chip"><input type="checkbox" name="onco" defaultChecked={patient.history?.onco} /> Onco</label>
                        </div>
                        <textarea name="histText" defaultValue={patient.history?.text} placeholder="Alergias, otros..." className="input-rounds h-20"></textarea>
                    </div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Cirugías Previas</label><textarea name="surgeries" defaultValue={patient.history?.surgeries} placeholder="Lista..." className="input-rounds h-20"></textarea></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Medicamentos</label><textarea name="meds" defaultValue={patient.history?.meds} placeholder="Habituales..." className="input-rounds h-20"></textarea></div>
                    <button className="btn-primary">Guardar Cambios</button>
                </form>
            )}

            {activeTab === 'notes' && (
                <div className="space-y-4">
                    {/* Botonera de Notas */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <BtnNote onClick={()=>setModalType('visita')} label="Visita" color="bg-blue-50 text-blue-700"/>
                        <BtnNote onClick={()=>setModalType('labs')} label="Labs" />
                        <BtnNote onClick={()=>setModalType('signos')} label="Signos" />
                        <BtnNote onClick={()=>setModalType('sonda')} label="Sonda" />
                        <BtnNote onClick={()=>setModalType('urocultivo')} label="Urocultivo" />
                        <BtnNote onClick={()=>setModalType('check_qx')} label="Check Qx" color="bg-green-50 text-green-700"/>
                        <BtnNote onClick={()=>setModalType('check_egr')} label="Check Egr" color="bg-red-50 text-red-700"/>
                        <BtnNote onClick={()=>setModalType('texto')} label="Nota Libre" />
                    </div>

                    {/* Timeline */}
                    {patient.notes && patient.notes.slice().reverse().map((note, idx) => (
                        <NoteCard key={idx} note={note} />
                    ))}
                    {(!patient.notes || patient.notes.length === 0) && <p className="text-center text-gray-400 text-sm mt-10">Sin notas registradas.</p>}
                </div>
            )}
        </div>

        {/* NOTE MODAL */}
        {modalType && <NoteModal type={modalType} onClose={()=>setModalType(null)} onSave={handleSaveNote} />}
    </div>
  );
}

const BtnNote = ({label, onClick, color="bg-white text-gray-600"}) => (
    <button onClick={onClick} className={`${color} border shadow-sm rounded-lg py-2 text-[10px] font-bold uppercase hover:brightness-95 transition`}>{label}</button>
);

const NoteCard = ({note}) => {
    const copyToWA = () => {
        let t = '';
        const c = note.content;
        if(note.type === 'visita') {
            t = `*REPORTE VISITA*\n*S:* ${c.subj}\n*SV:* TA ${c.ta} | FC ${c.fc} | T ${c.temp}\n*Líq:* GU ${c.gu}ml | Dren ${c.drains}\n*A/P:* ${c.plan}`;
        } else {
            t = JSON.stringify(c);
        }
        navigator.clipboard.writeText(t);
        alert("Copiado");
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-slate-400 relative">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-500">{note.type}</span>
                <span className="text-[10px] text-gray-400">{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {note.type === 'visita' && (
                    <>
                    <p className="font-medium text-gray-900 mb-1">{note.content.subj}</p>
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 grid grid-cols-2 gap-2 mb-2 font-mono">
                        <span>TA: {note.content.ta}</span><span>FC: {note.content.fc}</span>
                        <span>GU: {note.content.gu}</span><span>Dren: {note.content.drains}</span>
                    </div>
                    {/* Lab Grid Mini */}
                    {(note.content.hb || note.content.leu) && (
                         <div className="grid grid-cols-3 gap-1 text-[10px] bg-gray-100 p-1 rounded font-mono text-center mb-2">
                             <span>Hb:{note.content.hb}</span><span>Leu:{note.content.leu}</span><span>Plq:{note.content.plq}</span>
                             <span>Cr:{note.content.cr}</span><span>Glu:{note.content.glu}</span><span>Na:{note.content.na}</span>
                         </div>
                    )}
                    <p className="italic text-gray-600">Plan: {note.content.plan}</p>
                    </>
                )}
                {note.type.includes('check') && (
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(note.content).map(([k,v]) => (
                            <div key={k} className="flex items-center gap-1 text-xs">
                                <span>{v ? '✅' : '❌'}</span> <span className="capitalize">{k}</span>
                            </div>
                        ))}
                    </div>
                )}
                {note.type === 'texto' && <p>{note.content.text}</p>}
                {note.type === 'sonda' && <p><strong>{note.content.type}</strong> colocada el {note.content.date}</p>}
                {note.type === 'urocultivo' && <p className={note.content.result==='Positivo'?'text-red-600 font-bold':'text-green-600'}>Resultado: {note.content.result} {note.content.germ && `(${note.content.germ})`}</p>}
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-300 uppercase font-bold">{note.author}</span>
                {note.type === 'visita' && <button onClick={copyToWA} className="text-xs text-green-600 font-bold flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded transition"><Copy size={12}/> Copiar WA</button>}
            </div>
        </div>
    );
};

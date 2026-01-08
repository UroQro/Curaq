import React, { useState } from 'react';
import { db } from '../firebase';
import { addDoc, updateDoc, collection, doc } from 'firebase/firestore';
import { HOSPITALS, DOCTORS, INSURANCES } from '../constants';

export default function PatientFormModal({ onClose, mode, initialData, originContext }) {
  const defaultStatus = originContext === 'programming' ? 'pre_admission' : 'active';
  
  const [form, setForm] = useState(initialData || { 
      name: '', hospital: '', bedNumber: '', type: 'Médico', doctor: '', insurance: '', dob: '', diagnosis: '', phone: '',
      status: defaultStatus, dailyCheck: false, preDischarge: false, notes: [], checklist: [],
      scheduledDate: '', surgery: '',
      antecedents: { dm: false, has: false, hipo: false, onco: false, other: '', meds: '', sx: '' }, allergies: ''
  });
  const [isOtherHosp, setIsOtherHosp] = useState(false);
  const [isOtherDoc, setIsOtherDoc] = useState(false);
  const [isOtherIns, setIsOtherIns] = useState(false);

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          if (mode === 'create') await addDoc(collection(db, "patients"), { ...form, admissionDate: new Date().toISOString() });
          else await updateDoc(doc(db, "patients", form.id), form);
          onClose();
      } catch (err) { alert("Error: " + err.message); }
  };

  const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block uppercase";

  return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">{mode==='create'?'Nuevo Paciente':'Editar Paciente'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div><label className={labelClass}>Nombre Completo</label><input required className={inputClass} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>Fecha Nacimiento</label><input type="date" required className={inputClass} value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})} /></div>
                      <div><label className={labelClass}>Teléfono</label><input type="tel" className={inputClass} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="10 dígitos" /></div>
                  </div>

                  {/* MODIFICADO: Layout de 3 columnas para incluir cama */}
                  <div className="grid grid-cols-[1fr_1fr_0.7fr] gap-3">
                      <div>
                          <label className={labelClass}>Tipo</label>
                          <select className={inputClass} value={form.type} onChange={e=>setForm({...form, type:e.target.value})}><option>Médico</option><option>Quirúrgico</option><option>Interconsulta</option></select>
                      </div>
                      <div>
                          <label className={labelClass}>Hospital</label>
                          <select required={!isOtherHosp} className={inputClass} value={isOtherHosp?'Otro':form.hospital} onChange={e=>{if(e.target.value==='Otro'){setIsOtherHosp(true);setForm({...form,hospital:''})}else{setIsOtherHosp(false);setForm({...form,hospital:e.target.value})}}}>
                             <option value="">...</option>{HOSPITALS.map(h=><option key={h.abbr} value={h.abbr}>{h.abbr}</option>)}<option value="Otro">Otro...</option>
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>Cama</label>
                          <input className={inputClass} value={form.bedNumber} onChange={e=>setForm({...form, bedNumber:e.target.value})} placeholder="Ej. 304" />
                      </div>
                  </div>
                  {isOtherHosp && <input placeholder="Nombre Hospital (Abreviado)" className={`mt-0 ${inputClass} bg-blue-50 dark:bg-slate-600`} value={form.hospital} onChange={e=>setForm({...form, hospital:e.target.value})} required/>}

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border dark:border-slate-600">
                      <label className={labelClass}>Antecedentes</label>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-sm dark:text-white">
                         <label className="flex items-center gap-1"><input type="checkbox" checked={form.antecedents?.dm || false} onChange={e=>setForm({...form, antecedents: {...form.antecedents, dm:e.target.checked}})}/> DM</label>
                         <label className="flex items-center gap-1"><input type="checkbox" checked={form.antecedents?.has || false} onChange={e=>setForm({...form, antecedents: {...form.antecedents, has:e.target.checked}})}/> HAS</label>
                         <label className="flex items-center gap-1"><input type="checkbox" checked={form.antecedents?.hipo || false} onChange={e=>setForm({...form, antecedents: {...form.antecedents, hipo:e.target.checked}})}/> Hipotiroidismo</label>
                         <label className="flex items-center gap-1"><input type="checkbox" checked={form.antecedents?.onco || false} onChange={e=>setForm({...form, antecedents: {...form.antecedents, onco:e.target.checked}})}/> Onco</label>
                      </div>
                      <input placeholder="Otros antecedentes..." className={`mb-2 ${inputClass} text-xs h-8`} value={form.antecedents?.other || ''} onChange={e=>setForm({...form, antecedents: {...form.antecedents, other:e.target.value}})} />
                      <input placeholder="Alergias" className={`${inputClass} text-xs h-8 border-red-200 dark:border-red-900/50`} value={form.allergies} onChange={e=>setForm({...form, allergies:e.target.value})} />
                  </div>

                  <div><label className={labelClass}>Cirugía a Realizar / Realizada</label><input className={inputClass} value={form.surgery} onChange={e=>setForm({...form, surgery:e.target.value})} placeholder="Procedimiento..." /></div>

                  {originContext === 'programming' && (
                     <div><label className={labelClass}>Fecha Programada</label><input type="date" required className={inputClass} value={form.scheduledDate} onChange={e=>setForm({...form, scheduledDate:e.target.value})} /></div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className={labelClass}>Médico Tratante</label>
                          <select required={!isOtherDoc} className={inputClass} value={isOtherDoc?'Otro':form.doctor} onChange={e=>{if(e.target.value==='Otro'){setIsOtherDoc(true);setForm({...form,doctor:''})}else{setIsOtherDoc(false);setForm({...form,doctor:e.target.value})}}}>
                             <option value="">Seleccionar...</option>{DOCTORS.map(d=><option key={d} value={d}>{d}</option>)}<option value="Otro">Otro...</option>
                          </select>
                          {isOtherDoc && <input placeholder="Nombre Doctor" className={`mt-1 ${inputClass} bg-blue-50 dark:bg-slate-600`} value={form.doctor} onChange={e=>setForm({...form, doctor:e.target.value})} required/>}
                      </div>
                      <div>
                          <label className={labelClass}>Seguro</label>
                          <select required={!isOtherIns} className={inputClass} value={isOtherIns?'Otro':form.insurance} onChange={e=>{if(e.target.value==='Otro'){setIsOtherIns(true);setForm({...form,insurance:''})}else{setIsOtherIns(false);setForm({...form,insurance:e.target.value})}}}>
                             <option value="">Seleccionar...</option>{INSURANCES.map(i=><option key={i.abbr} value={i.abbr}>{i.full}</option>)}<option value="Otro">Otro...</option>
                          </select>
                          {isOtherIns && <input placeholder="Nombre Seguro (Abreviado)" className={`mt-1 ${inputClass} bg-blue-50 dark:bg-slate-600`} value={form.insurance} onChange={e=>setForm({...form, insurance:e.target.value})} required/>}
                      </div>
                  </div>

                  <div><label className={labelClass}>Diagnóstico</label><textarea required rows="2" className={inputClass} value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} /></div>

                  <div className="flex gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                      <button type="button" onClick={onClose} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white py-3 rounded-lg font-bold transition hover:bg-gray-300">Cancelar</button>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition">Guardar</button>
                  </div>
              </form>
          </div>
      </div>
  );
}

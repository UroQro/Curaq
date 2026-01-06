import React, { useState } from 'react';

export default function NoteModal({ type, onClose, onSave }) {
  const [data, setData] = useState({});

  const handleSubmit = (e) => { e.preventDefault(); onSave(data); };
  const handleChange = (k, v) => setData({...data, [k]: v});

  const getTitle = () => {
      switch(type) {
          case 'visita': return 'Visita Diaria';
          case 'check_qx': return 'Verificación Quirúrgica';
          case 'check_egr': return 'Verificación Egreso';
          case 'sonda': return 'Colocación Sonda';
          default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
  };

  return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
              <h3 className="font-black text-slate-800 text-lg mb-4 uppercase">{getTitle()}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                  
                  {type === 'visita' && (
                      <>
                      <textarea placeholder="Subjetivo" className="input-rounds" onChange={e=>handleChange('subj', e.target.value)} required></textarea>
                      <div className="grid grid-cols-4 gap-2">
                          <input placeholder="TA" className="input-rounds" onChange={e=>handleChange('ta', e.target.value)} />
                          <input placeholder="FC" className="input-rounds" onChange={e=>handleChange('fc', e.target.value)} />
                          <input placeholder="FR" className="input-rounds" onChange={e=>handleChange('fr', e.target.value)} />
                          <input placeholder="T°" className="input-rounds" onChange={e=>handleChange('temp', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Gasto U (ml)" className="input-rounds" onChange={e=>handleChange('gu', e.target.value)} />
                          <input placeholder="Drenajes" className="input-rounds" onChange={e=>handleChange('drains', e.target.value)} />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Laboratorios</p>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                              <input placeholder="Hb" className="input-rounds text-xs" onChange={e=>handleChange('hb', e.target.value)} />
                              <input placeholder="Leu" className="input-rounds text-xs" onChange={e=>handleChange('leu', e.target.value)} />
                              <input placeholder="Plq" className="input-rounds text-xs" onChange={e=>handleChange('plq', e.target.value)} />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                              <input placeholder="Cr" className="input-rounds text-xs" onChange={e=>handleChange('cr', e.target.value)} />
                              <input placeholder="Glu" className="input-rounds text-xs" onChange={e=>handleChange('glu', e.target.value)} />
                              <input placeholder="Na" className="input-rounds text-xs" onChange={e=>handleChange('na', e.target.value)} />
                          </div>
                      </div>
                      <textarea placeholder="Análisis y Plan" className="input-rounds h-24" onChange={e=>handleChange('plan', e.target.value)} required></textarea>
                      </>
                  )}

                  {type === 'urocultivo' && (
                      <>
                      <select className="input-rounds" onChange={e=>handleChange('result', e.target.value)}>
                          <option>Negativo</option><option>Positivo</option>
                      </select>
                      <input placeholder="Microorganismo" className="input-rounds" onChange={e=>handleChange('germ', e.target.value)} />
                      <input placeholder="Sensibilidad" className="input-rounds" onChange={e=>handleChange('sens', e.target.value)} />
                      </>
                  )}

                  {type === 'sonda' && (
                      <>
                      <select className="input-rounds" onChange={e=>handleChange('type', e.target.value)}>
                          <option>Sonda Foley</option><option>Catéter JJ</option><option>Nefrostomía</option><option>Cistostomía</option>
                      </select>
                      <input type="date" className="input-rounds" onChange={e=>handleChange('date', e.target.value)} />
                      </>
                  )}

                  {type.includes('check') && (
                      <div className="space-y-2">
                          {(type==='check_qx' ? ['Carta Seguro','Nota Internamiento','VPO','Labs Recientes','Indicaciones Pre-Op','Sangre Disponible'] : ['Receta Entregada','Informe Médico','Nota de Egreso','Cita Abierta']).map(label => (
                              <label key={label} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                  <input type="checkbox" className="w-5 h-5 rounded text-blue-600" onChange={e=>handleChange(label, e.target.checked)}/> 
                                  <span className="text-sm font-bold text-gray-700">{label}</span>
                              </label>
                          ))}
                      </div>
                  )}

                  {type === 'texto' && <textarea placeholder="Escribe aquí..." className="input-rounds h-32" onChange={e=>handleChange('text', e.target.value)}></textarea>}
                  
                  {type === 'labs' && <p className="text-center text-sm text-gray-500">Usa la opción de Visita para agregar labs completos.</p>}

                  <div className="flex gap-2 pt-2">
                      <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Cancelar</button>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Guardar Nota</button>
                  </div>
              </form>
          </div>
      </div>
  );
}

import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [error, setError] = useState('');
  
  const REQUIRED_KEY = "Curaq8135892041";

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { setError("Credenciales incorrectas o usuario no encontrado."); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (masterKey !== REQUIRED_KEY) return setError("Clave maestra incorrecta.");
    try { 
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
    } 
    catch (err) { setError(err.message); }
  };

  const inputClass = "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tighter">CURAQ</h1>
            <p className="text-blue-400 font-medium">Patient Management</p>
        </div>
        
        {error && <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm mb-4 border border-red-800 text-center font-bold">{error}</div>}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
                <>
                    <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className={inputClass} placeholder="Nombre Completo" required />
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Clave de Acceso</label>
                        <input type="password" value={masterKey} onChange={e=>setMasterKey(e.target.value)} className={inputClass} placeholder="Clave Proporcionada" required />
                    </div>
                </>
            )}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass} placeholder="Correo Electrónico" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className={inputClass} placeholder="Contraseña" required />
            
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 rounded-lg font-bold shadow-lg transform transition active:scale-95">
                {isRegistering ? 'Crear Usuario' : 'Iniciar Sesión'}
            </button>
        </form>
        
        <div className="mt-8 text-center pt-6 border-t border-slate-700">
            <button onClick={() => {setIsRegistering(!isRegistering); setError('')}} className="text-sm text-slate-400 font-semibold hover:text-white transition">
                {isRegistering ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Registrarse'}
            </button>
        </div>
      </div>
    </div>
  );
}

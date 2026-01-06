import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, HeartPulse } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [error, setError] = useState('');
  const ADMIN_KEY = "Curaq8135892041";

  const handleAuth = async (e) => {
    e.preventDefault(); setError('');
    try {
        if(isRegistering) {
            if(masterKey !== ADMIN_KEY) throw new Error("Clave maestra incorrecta");
            const c = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(c.user, { displayName: name });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md p-8 flex flex-col items-center">
        <div className="mb-4 bg-blue-50 p-4 rounded-full"><HeartPulse className="text-blue-600 w-12 h-12 stroke-[2]" /></div>
        <h1 className="text-3xl font-black text-slate-800 mb-1">CURAQ</h1>
        <p className="text-gray-400 font-medium mb-8">Gestión de Pacientes</p>
        {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg w-full mb-4 text-center">{error}</div>}
        <form onSubmit={handleAuth} className="w-full space-y-4">
            {isRegistering && (
                <>
                <input type="text" placeholder="Nombre Completo" className="input-rounds" value={name} onChange={e=>setName(e.target.value)} required />
                <input type="password" placeholder="Clave Maestra" className="input-rounds" value={masterKey} onChange={e=>setMasterKey(e.target.value)} required />
                </>
            )}
            <div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="email" placeholder="correo@ejemplo.com" className="input-rounds pl-10" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div className="relative"><Lock className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="password" placeholder="••••••••" className="input-rounds pl-10" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
            <button type="submit" className="btn-primary">{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</button>
        </form>
        <button onClick={() => {setIsRegistering(!isRegistering); setError('')}} className="mt-6 text-sm text-gray-500 font-medium hover:text-blue-600 transition">{isRegistering ? 'Ya tengo cuenta' : 'Crear usuario nuevo'}</button>
      </div>
    </div>
  );
}

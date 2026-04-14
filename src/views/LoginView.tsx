import React from 'react';
import type { DbUser } from '../types';
import { APP_TITLE } from '../constants';

interface Props {
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  logoBase64: string | null;
  showChangePassModal: boolean;
  tempUserForPassChange: DbUser | null;
  handleForcePasswordChange: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowChangePassModal: (v: boolean) => void;
  setTempUserForPassChange: (v: DbUser | null) => void;
}

const LoginView: React.FC<Props> = ({
  handleLogin, showPassword, setShowPassword, logoBase64,
  showChangePassModal, tempUserForPassChange, handleForcePasswordChange,
  setShowChangePassModal, setTempUserForPassChange
}) => {
  return (
    <>
      <div className="w-full max-w-5xl bg-white rounded-[50px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col items-center justify-center bg-white">
          <div className="w-32 h-32 mb-8 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
            {logoBase64 ? <img src={logoBase64} className="w-full h-full object-cover" /> : <span className="text-4xl text-green-600 font-black">+</span>}
          </div>
          <h1 className="text-[28px] font-black text-[#2E8B57] uppercase mb-2 text-center">{APP_TITLE}</h1>
          <p className="text-gray-400 font-bold mb-8 text-center text-sm">Ingrese sus credenciales para continuar</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input name="user" type="text" placeholder="Usuario / N° Cédula" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#2E8B57] transition-all" />

            <div className="relative">
              <input name="pass" type={showPassword ? "text" : "password"} placeholder="Contraseña" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#2E8B57] transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#2E8B57] outline-none">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            <button className="w-full bg-[#2E8B57] hover:bg-green-800 text-white font-black py-4 rounded-2xl shadow-lg uppercase transition-colors tracking-wide mt-4">INGRESAR AL SISTEMA</button>
          </form>
        </div>

        {/* Right Side: Info Panel */}
        <div className="w-full md:w-1/2 bg-[#2E8B57] p-12 md:p-16 flex flex-col items-center justify-center text-white">
          <div className="text-center">
            <span className="text-7xl mb-6 block">🍽️</span>
            <h2 className="text-3xl font-black uppercase mb-4">Comedor Reducto</h2>
            <p className="text-white/70 font-bold text-sm leading-relaxed">Sistema de gestión de consumo del comedor de la Cooperativa Reducto Ltda.</p>
          </div>
          <div className="mt-10 space-y-3 w-full max-w-xs">
            {[
              { icon: '👤', text: 'Registro de consumo' },
              { icon: '🧾', text: 'Tickets automáticos' },
              { icon: '📊', text: 'Reportes y estadísticas' },
              { icon: '👩‍🍳', text: 'Panel de cocina' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL CAMBIO DE CONTRASEÑA OBLIGATORIO */}
      {showChangePassModal && tempUserForPassChange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 uppercase">Seguridad Primero</h3>
              <p className="text-sm text-gray-500 mt-2 font-bold">
                Hola {tempUserForPassChange.fullName}. <br />
                Por seguridad, debes cambiar tu contraseña predeterminada para continuar.
              </p>
            </div>
            <form onSubmit={handleForcePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Nueva Contraseña</label>
                <input name="newPass" type="password" required className="w-full p-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-[#2E8B57] outline-none" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Confirmar Contraseña</label>
                <input name="confirmPass" type="password" required className="w-full p-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-[#2E8B57] outline-none" placeholder="Repite la contraseña" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowChangePassModal(false); setTempUserForPassChange(null); }} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black uppercase text-xs hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#2E8B57] text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-green-700 shadow-lg">Guardar y Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginView;

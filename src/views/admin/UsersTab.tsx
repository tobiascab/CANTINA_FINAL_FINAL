import React from 'react';
import type { DbUser } from '../../types';

interface Props {
  dbUsers: DbUser[];
  setDbUsers: (users: DbUser[] | ((prev: DbUser[]) => DbUser[])) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  updateUserPassword: (username: string) => void;
  handleUserExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userExcelRef: React.RefObject<HTMLInputElement>;
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  apiUrl: string;
  showToast: (msg: string, v?: any) => void;
  showConfirm: (msg: string, onYes: () => void, title?: string) => void;
  showPrompt: (msg: string, onSubmit: (value: string) => void, label?: string, defaultVal?: string) => void;
}

const UsersTab: React.FC<Props> = ({
  dbUsers, setDbUsers, searchTerm, setSearchTerm,
  updateUserPassword, handleUserExcel, userExcelRef,
  apiFetch, apiUrl, showToast, showConfirm, showPrompt
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h3 className="text-2xl font-black text-[#2E8B57] uppercase">Gestión de Colaboradores 👥</h3>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nombre o CI..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-3 rounded-full border border-gray-200 text-sm font-bold w-full md:w-64"
          />
          <button
            onClick={() => {
              showPrompt('CI del nuevo colaborador:', (ci) => {
                showPrompt('Nombre completo:', async (name) => {
                  try {
                    const res = await apiFetch(`${apiUrl}/users`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: ci, fullName: name, password: 'Reducto2026*/', role: 'user' })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setDbUsers((prev: DbUser[]) => [...prev, { username: ci, fullName: name, role: 'user', password: 'Reducto2026*/' }]);
                      showToast(`Colaborador "${name}" creado`, 'success');
                    } else {
                      showToast(data.error || 'Error al crear usuario', 'error');
                    }
                  } catch (e) { showToast('Error de conexión', 'error'); }
                }, 'Nombre');
              }, 'Cédula');
            }}
            className="bg-[#2E8B57] hover:bg-green-700 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] shadow-lg whitespace-nowrap transition-all"
          >
            ➕ Nuevo Colaborador
          </button>
          <button onClick={() => userExcelRef.current?.click()} className="bg-blue-600 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] shadow-lg whitespace-nowrap">📥 Cargar Excel</button>
          <input type="file" ref={userExcelRef} className="hidden" accept=".xlsx, .xls" onChange={handleUserExcel} />
          <button
            onClick={() => showConfirm('¿Resetear TODAS las contraseñas a "Reducto2026*/"?', async () => {
              try {
                let count = 0;
                for (const u of dbUsers) {
                  const res = await apiFetch(`${apiUrl}/users/${u.username}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: 'Reducto2026*/' })
                  });
                  if (res.ok) count++;
                }
                setDbUsers((prev: DbUser[]) => prev.map(u => ({ ...u, password: 'Reducto2026*/' })));
                showToast(`${count} contraseñas reseteadas`, 'success');
              } catch (e) { showToast('Error de conexión', 'error'); }
            })}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] shadow-lg whitespace-nowrap transition-all"
          >
            🔄 Resetear Contraseñas
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 font-bold mb-4">
        Total de colaboradores: <span className="text-[#2E8B57] font-black">{dbUsers.filter(u => u.role !== 'admin' && u.role !== 'kitchen').length}</span>
      </p>
      <div className="bg-white rounded-[40px] shadow-sm p-8 max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dbUsers.filter(u =>
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.includes(searchTerm)
          ).map((u, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl flex flex-col relative group">
              <button
                onClick={() => showConfirm(`¿Eliminar al colaborador "${u.fullName}"?`, async () => {
                  try {
                    const res = await apiFetch(`${apiUrl}/users/${u.username}`, { method: 'DELETE' });
                    if (res.ok) {
                      setDbUsers((prev: DbUser[]) => prev.filter(x => x.username !== u.username));
                      showToast('Colaborador eliminado', 'success');
                    } else {
                      showToast('Error al eliminar', 'error');
                    }
                  } catch (e) { showToast('Error de conexión', 'error'); }
                })}
                className="absolute top-3 right-3 text-red-300 hover:text-red-500 text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <span className="text-[10px] font-black text-[#2E8B57]">{u.username}</span>
              <span className="text-sm font-bold text-gray-700 uppercase mb-2">{u.fullName}</span>
              <button onClick={() => updateUserPassword(u.username)} className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase self-start">🔑 Cambiar Pass</button>
              <button
                onClick={() => showConfirm(`¿Resetear contraseña de "${u.fullName}"?`, async () => {
                  try {
                    const res = await apiFetch(`${apiUrl}/users/${u.username}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: 'Reducto2026*/' })
                    });
                    if (res.ok) {
                      setDbUsers((prev: DbUser[]) => prev.map(x => x.username === u.username ? { ...x, password: 'Reducto2026*/' } : x));
                      showToast('Contraseña reseteada', 'success');
                    }
                  } catch (e) { showToast('Error de conexión', 'error'); }
                })}
                className="bg-orange-100 hover:bg-orange-200 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase self-start mt-1"
              >
                🔄 Resetear Pass
              </button>
              <div className="mt-3 pt-3 border-t border-gray-200 w-full">
                <p className="text-[8px] font-black uppercase text-gray-400">Contraseña Actual:</p>
                <p className="text-xs font-mono font-bold text-gray-600 bg-white p-1 rounded border border-gray-200 mt-1 select-all">
                  {u.password || 'N/A'}
                </p>
              </div>
            </div>
          ))}
          {dbUsers.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">No hay colaboradores cargados. Sube un archivo Excel con columnas "CEDULA" y "NOMBRE".</p>}
        </div>
      </div>
    </div>
  );
};

export default UsersTab;

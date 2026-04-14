import React from 'react';
import type { Dish, Order, DbUser } from '../types';
import { COMBO_SURCHARGE, MAX_COMBO_PRICE } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];

interface Props {
  allOrders: Order[];
  menuItems: Dish[];
  setMenuItems: (items: Dish[] | ((prev: Dish[]) => Dish[])) => void;
  dbUsers: DbUser[];
  adminTab: 'stats' | 'menu' | 'users' | 'tools';
  setAdminTab: (v: 'stats' | 'menu' | 'users' | 'tools') => void;
  handleLogout: () => void;
  serveOrder: (id: number) => void;
  updateDish: (dish: Dish) => void;
  addDish: () => void;
  deleteDish: (id: string) => void;
  menuSortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular';
  setMenuSortBy: (v: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular') => void;
  sortedMenuItems: Dish[];
  dishSearch: string;
  setDishSearch: (v: string) => void;
  handleDishImageUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDishDragOver: (e: React.DragEvent<HTMLDivElement>, idx: number) => void;
  handleDishDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDishDrop: (e: React.DragEvent<HTMLDivElement>, idx: number) => void;
  draggedDishIndex: number | null;
  dishFilesRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  showConfirm: (msg: string, onYes: () => void, title?: string) => void;
}

const KitchenDashboard: React.FC<Props> = ({
  allOrders, menuItems, setMenuItems, dbUsers, adminTab, setAdminTab, handleLogout,
  serveOrder, updateDish, addDish, deleteDish, menuSortBy, setMenuSortBy,
  sortedMenuItems, dishSearch, setDishSearch, handleDishImageUpload,
  handleDishDragOver, handleDishDragLeave, handleDishDrop, draggedDishIndex,
  dishFilesRefs, showConfirm
}) => {
  return (
    <div className="w-full max-w-7xl p-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-8 rounded-[40px] shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-5xl">👩‍🍳</span>
          <div>
            <h2 className="text-3xl font-black text-[#2E8B57] uppercase tracking-tight">Panel de Cocina</h2>
            <p className="text-gray-400 font-bold uppercase text-xs">Gestión de Pedidos y Menú</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-gray-100 p-1 rounded-full flex">
            <button onClick={() => setAdminTab('stats')} className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all ${adminTab === 'stats' ? 'bg-[#2E8B57] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Pedidos</button>
            <button onClick={() => setAdminTab('menu')} className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all ${adminTab === 'menu' ? 'bg-[#2E8B57] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Menú del Día</button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-500 hover:bg-red-100 px-6 py-2 rounded-full font-black uppercase text-xs transition-colors">Salir</button>
        </div>
      </div>

      {adminTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[50px] shadow-xl border-4 border-green-50">
            <h3 className="text-2xl font-black text-gray-800 uppercase mb-8 flex justify-between items-center">
              Pedidos Detallados
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">{getToday()}</span>
            </h3>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {Object.entries(
                allOrders.filter(o => o.dateIso === getToday()).reduce((acc: any, o) => {
                  const n = o.dish?.name || 'DESAYUNO';
                  if (!acc[n]) acc[n] = [];
                  acc[n].push(o);
                  return acc;
                }, {})
              ).map(([dishName, orders]: any) => (
                <div key={dishName} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                    <span className="font-black uppercase text-gray-800 text-xl">{dishName}</span>
                    <span className="bg-[#2E8B57] text-white px-4 py-1.5 rounded-xl font-bold text-lg shadow-sm">
                      {orders.reduce((sum: number, o: any) => sum + o.quantity, 0)} Total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {orders.map((o: any) => {
                      const buyer = dbUsers.find(u => u.username === o.userId);
                      return (
                        <div key={o.id} className={`flex justify-between items-center p-3 rounded-2xl transition-all ${o.isServed ? 'bg-green-50 opacity-60' : 'bg-white shadow-sm border border-gray-100'}`}>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#2E8B57]">{o.userId}</span>
                            <span className="text-sm font-bold text-gray-700 uppercase">{buyer?.fullName || 'Socio'}</span>
                            <span className="text-[9px] font-bold text-gray-400">{o.timestamp.split(', ')[1]} - Cant: {o.quantity}</span>
                          </div>
                          <button
                            onClick={() => serveOrder(o.id!)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-md ${o.isServed ? 'bg-gray-400 text-white cursor-help' : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'}`}
                            title={o.isServed ? 'Plato servido. Click para deshacer.' : 'Marcar como servido'}
                          >
                            {o.isServed ? '✅ SERVIDO' : '🍽️ SERVIR'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {allOrders.filter(o => o.dateIso === getToday()).length === 0 && (
                <div className="text-center py-20 opacity-50">
                  <span className="text-5xl block mb-2">😴</span>
                  <p className="font-bold">No hay pedidos registrados para hoy</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-[#2E8B57] p-10 rounded-[50px] shadow-xl text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase opacity-80 mb-2">Total Platos Servidos</h3>
              <p className="text-[120px] leading-none font-black tracking-tighter">
                {allOrders.filter(o => o.dateIso === getToday()).reduce((acc, o) => acc + o.quantity, 0)}
              </p>
              <p className="font-bold uppercase tracking-widest opacity-60 mt-4">Mantengan el ritmo equipo</p>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'menu' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase">Menú del Día 🍽️</h3>
              <p className="text-sm text-gray-500 font-bold mt-1">
                Platos activos: <span className="text-[#2E8B57] font-black">{menuItems.filter(d => d.isActive).length}</span> / {menuItems.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => showConfirm('¿Desactivar TODOS los platos?', () => { menuItems.forEach(item => updateDish({ ...item, isActive: false })); })} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-black uppercase text-[10px] shadow-lg transition-all">🚫 Desactivar Todos</button>
              <button onClick={() => showConfirm('¿Activar TODOS los platos?', () => { menuItems.forEach(item => updateDish({ ...item, isActive: true })); })} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-black uppercase text-[10px] shadow-lg transition-all">✅ Activar Todos</button>
              <button onClick={addDish} className="bg-[#2E8B57] hover:bg-green-700 text-white px-4 py-2 rounded-full font-black uppercase text-[10px] shadow-lg transition-all flex items-center gap-1"><span>+</span> Nuevo Plato</button>
            </div>
          </div>

          {/* SORTING FILTERS */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs font-black uppercase text-gray-500 mb-3">📊 Ordenar por:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'name-asc', label: '🔤 A → Z' },
                { key: 'name-desc', label: '🔤 Z → A' },
                { key: 'price-asc', label: '💰 Precio ↑' },
                { key: 'price-desc', label: '💰 Precio ↓' },
                { key: 'popular', label: '🔥 Más Consumidos' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setMenuSortBy(opt.key as any)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${menuSortBy === opt.key ? 'bg-[#2E8B57] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* DISH SEARCH */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" value={dishSearch} onChange={e => setDishSearch(e.target.value)} placeholder="Buscar plato por nombre..." className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-gray-200 font-bold text-sm focus:border-[#2E8B57] focus:ring-2 focus:ring-green-100 outline-none transition-all shadow-sm" />
              {dishSearch && <button onClick={() => setDishSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-black text-lg">×</button>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedMenuItems.filter(item => !dishSearch || item.name.toLowerCase().includes(dishSearch.toLowerCase())).map((item) => {
              const origIdx = menuItems.findIndex(m => m.id === item.id);
              return (
                <div key={item.id} className={`bg-white rounded-[25px] shadow-sm p-4 relative transition-all duration-300 border-4 ${item.isActive ? 'border-green-400 shadow-lg shadow-green-100' : 'border-gray-200 opacity-70'}`}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg ${item.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {item.isActive ? '✅ ACTIVO' : '⭕ INACTIVO'}
                    </span>
                  </div>
                  <button onClick={() => deleteDish(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black z-20 shadow-md hover:bg-red-600 hover:scale-110 transition-all">×</button>
                  <div
                    className={`h-32 w-full rounded-[18px] overflow-hidden relative cursor-pointer mt-4 transition-all ${draggedDishIndex === origIdx ? 'bg-green-100 border-4 border-green-500 border-dashed scale-105' : 'bg-gray-100'}`}
                    onClick={() => dishFilesRefs.current[origIdx + 100]?.click()}
                    onDragOver={(e) => handleDishDragOver(e, origIdx)}
                    onDragLeave={handleDishDragLeave}
                    onDrop={(e) => handleDishDrop(e, origIdx)}
                  >
                    {item.image ? (
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-3xl mb-1">🍽️</span>
                        <span className="text-[8px] font-bold">Sin imagen</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-white text-2xl mb-1">📷</span>
                      <span className="text-white text-[8px] font-black uppercase tracking-widest">{draggedDishIndex === origIdx ? 'Suelta aquí' : 'Cambiar Foto o Arrastrar'}</span>
                    </div>
                    <input type="file" ref={el => { if (el) dishFilesRefs.current[origIdx + 100] = el; }} className="hidden" accept="image/*" onChange={(e) => handleDishImageUpload(origIdx, e)} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <input type="text" value={item.name} onChange={e => { const n = [...menuItems]; n[origIdx].name = e.target.value; setMenuItems(n); }} onBlur={e => updateDish({ ...item, name: e.target.value })} className="w-full text-center font-bold text-gray-800 text-sm bg-gray-50 border-2 border-transparent hover:border-gray-300 focus:border-[#2E8B57] rounded-lg px-2 py-1.5 outline-none transition-all" placeholder="Nombre del plato" />
                    <div className="flex items-center justify-center gap-1 bg-green-50 rounded-lg py-2">
                      <span className="text-gray-600 text-[10px] font-bold">Gs.</span>
                      <input type="number" value={item.basePrice} onChange={e => { const n = [...menuItems]; n[origIdx].basePrice = Number(e.target.value); setMenuItems(n); }} onBlur={e => updateDish({ ...item, basePrice: Number(e.target.value) })} className="w-20 text-center font-black text-[#2E8B57] text-lg bg-transparent border-none outline-none" />
                    </div>
                  </div>
                  <button onClick={() => updateDish({ ...item, isActive: !item.isActive })} className={`w-full mt-3 py-3 rounded-xl font-black uppercase text-xs transition-all shadow-md ${item.isActive ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                    {item.isActive ? '🚫 Quitar del Menú' : '✅ Agregar al Menú'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;

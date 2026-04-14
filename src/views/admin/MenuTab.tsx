import React from 'react';
import type { Dish } from '../../types';
import { COMBO_SURCHARGE, MAX_COMBO_PRICE } from '../../constants';

interface Props {
  menuItems: Dish[];
  setMenuItems: (items: Dish[]) => void;
  sortedMenuItems: Dish[];
  menuSortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular';
  setMenuSortBy: (v: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular') => void;
  addDish: () => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  handleDishImageUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  dishFilesRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  showConfirm: (msg: string, onYes: () => void, title?: string) => void;
}

const MenuTab: React.FC<Props> = ({
  menuItems, setMenuItems, sortedMenuItems, menuSortBy, setMenuSortBy,
  addDish, updateDish, deleteDish, handleDishImageUpload, dishFilesRefs, showConfirm
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-black text-[#2E8B57] uppercase">Gestión del Menú 🥘</h3>
          <p className="text-sm text-gray-500 font-bold mt-1">
            Platos activos: <span className="text-[#2E8B57] font-black">{menuItems.filter(d => d.isActive).length}</span> / {menuItems.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => showConfirm('¿Desactivar TODOS los platos?', () => { menuItems.forEach(item => updateDish({ ...item, isActive: false })); })} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-black uppercase text-[10px] shadow-lg transition-all">🚫 Desactivar Todos</button>
          <button onClick={() => showConfirm('¿Activar TODOS los platos?', () => { menuItems.forEach(item => updateDish({ ...item, isActive: true })); })} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-black uppercase text-[10px] shadow-lg transition-all">✅ Activar Todos</button>
          <button onClick={addDish} className="bg-[#2E8B57] text-white px-6 py-2 rounded-full font-black uppercase text-[10px] shadow-lg hover:bg-green-700 transition-all">+ Nuevo Plato</button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedMenuItems.map((item) => {
          const origIdx = menuItems.findIndex(m => m.id === item.id);
          return (
            <div key={item.id} className="bg-white p-6 rounded-[40px] shadow-sm flex gap-6 relative group">
              <button onClick={() => deleteDish(item.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">ELIMINAR</button>
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-md shrink-0 border-2 border-gray-50 cursor-pointer relative" onClick={() => dishFilesRefs.current[origIdx]?.click()}>
                <img src={item.image} className="w-full h-full object-cover" />
                <input type="file" ref={el => { if (el) dishFilesRefs.current[origIdx] = el; }} className="hidden" accept="image/*" onChange={(e) => handleDishImageUpload(origIdx, e)} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span onClick={() => updateDish({ ...item, isActive: !item.isActive })} className={`text-[10px] font-black px-3 py-1 rounded-full cursor-pointer transition-colors ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {item.isActive ? '● ACTIVO' : '○ INACTIVO'}
                  </span>
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Nombre del Plato</label>
                  <input type="text" value={item.name} onBlur={e => updateDish({ ...item, name: e.target.value })} onChange={e => { const n = [...menuItems]; n[origIdx].name = e.target.value; setMenuItems(n); }} className="w-full p-3 rounded-xl bg-gray-50 font-bold border-none text-sm focus:ring-2 focus:ring-[#2E8B57]" />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Precio Almuerzo</label>
                    <input type="number" value={item.basePrice} onBlur={e => updateDish({ ...item, basePrice: Number(e.target.value) })} onChange={e => { const n = [...menuItems]; n[origIdx].basePrice = Number(e.target.value); setMenuItems(n); }} className="w-full p-3 rounded-xl bg-gray-50 font-black text-green-600 border-none text-sm focus:ring-2 focus:ring-[#2E8B57]" />
                  </div>
                  <div className="w-1/2 opacity-70">
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Precio Combo (+5000)</label>
                    <div className="w-full p-3 rounded-xl bg-gray-100 font-black text-gray-600 border-none text-sm">
                      Gs. {Math.min(item.basePrice + COMBO_SURCHARGE, MAX_COMBO_PRICE).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuTab;

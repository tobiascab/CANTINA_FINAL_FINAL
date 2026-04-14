import React from 'react';
import type { MainCategory, Dish, AppView } from '../types';
import { DESAYUNO_PRICE, COMBO_SURCHARGE, MAX_COMBO_PRICE, CATEGORY_IMAGES } from '../constants';

interface Props {
  category: MainCategory | null;
  menuItems: Dish[];
  selectedDish: Dish | null;
  setSelectedDish: (d: Dish | null) => void;
  quantity: number;
  setQuantity: (n: number) => void;
  processOrder: () => void;
  setView: (v: AppView | 'kitchen-dashboard') => void;
}

const DishSelectionView: React.FC<Props> = ({
  category, menuItems, selectedDish, setSelectedDish,
  quantity, setQuantity, processOrder, setView
}) => {
  return (
    <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col items-center mb-12 relative w-full">
        <button onClick={() => setView('category')} className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-[#2E8B57] bg-white px-8 py-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors uppercase text-sm">
          ← Regresar
        </button>
        <h2 className="text-4xl md:text-5xl font-black text-[#2E8B57] uppercase text-center drop-shadow-sm">
          ¿Qué se te antoja más hoy? 😋
        </h2>
        {category === 'combo' && (
          <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-2 rounded-full font-black text-xs uppercase mt-4 animate-bounce shadow-md">
            ⚠️ Recordatorio: El combo ya incuye tu desayuno 😉
          </div>
        )}
      </div>

      <div className={`flex flex-wrap justify-center gap-6 w-full px-6 mx-auto ${(category === 'desayuno' || (category === 'almuerzo' && menuItems.filter(d => d.isActive).length === 1))
        ? 'max-w-md'
        : 'max-w-6xl'
        }`}>
        {(category === 'desayuno'
          ? [{ id: 'desayuno_std', name: 'Desayuno', basePrice: DESAYUNO_PRICE, image: CATEGORY_IMAGES.desayuno, isActive: true }]
          : menuItems.filter(d => d.isActive)
        ).map(dish => (
          <div
            key={dish.id}
            onClick={() => { setSelectedDish(dish); setQuantity(1); }}
            className={`bg-white rounded-[40px] shadow-lg overflow-hidden cursor-pointer border-4 transition-all duration-300 transform hover:scale-[1.02] group w-full max-w-[320px] ${selectedDish?.id === dish.id ? 'border-[#2E8B57] shadow-xl' : 'border-transparent shadow-sm'}`}
          >
            <div className="h-48 w-full overflow-hidden relative">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity z-10"></div>
              <img src={dish.image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="p-6 text-center relative bg-white">
              <h4 className="font-black text-xl text-[#2E8B57] uppercase mb-2 truncate">{dish.name}</h4>

              <div className="inline-block bg-green-50 px-6 py-2 rounded-full mb-4 border border-green-100">
                <p className="text-xl font-black text-[#2E8B57]">Gs. {(category === 'combo' ? Math.min(dish.basePrice + COMBO_SURCHARGE, MAX_COMBO_PRICE) : dish.basePrice).toLocaleString()}</p>
              </div>

              {selectedDish?.id === dish.id && (
                <div className="animate-in slide-in-from-top-2 duration-300 border-t border-gray-100 mt-2 pt-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Cantidad</p>
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                      className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-black text-gray-500 hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      −
                    </button>
                    <span className="text-4xl font-black text-[#2E8B57] min-w-[50px]">{quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                      className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-black text-gray-500 hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  <button onClick={e => { e.stopPropagation(); processOrder(); }} className="w-full bg-[#2E8B57] text-white py-5 rounded-[30px] font-black text-xl uppercase shadow-xl hover:bg-green-700 transition-all active:scale-95 flex flex-col items-center">
                    <span className="drop-shadow-md">CONFIRMAR 🍽️</span>
                    <span className="text-sm font-black mt-1 bg-white/20 px-4 py-0.5 rounded-full">Total: Gs. {((category === 'combo' ? Math.min(dish.basePrice + COMBO_SURCHARGE, MAX_COMBO_PRICE) : dish.basePrice) * quantity).toLocaleString()}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishSelectionView;

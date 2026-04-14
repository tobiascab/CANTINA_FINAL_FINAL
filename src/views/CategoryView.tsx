import React from 'react';
import type { MainCategory, DbUser } from '../types';
import { APP_TITLE, CATEGORY_IMAGES } from '../constants';

interface Props {
  currentUser: string;
  dbUsers: DbUser[];
  selectCategory: (cat: MainCategory) => void;
}

const CategoryView: React.FC<Props> = ({ currentUser, dbUsers, selectCategory }) => {
  return (
    <div className="w-full max-w-5xl pt-10">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black text-[#2E8B57] uppercase tracking-tighter">{APP_TITLE}</h2>
        <p className="text-gray-400 font-black mt-4 uppercase">¡Hola, {dbUsers.find(u => u.username === currentUser)?.fullName || sessionStorage.getItem('reducto_fullname') || currentUser}!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { id: 'desayuno', l: 'Desayuno', p: 'Gs. 8.000', i: CATEGORY_IMAGES.desayuno },
          { id: 'almuerzo', l: 'Almuerzo', p: 'Desde Gs. 15.000', i: CATEGORY_IMAGES.almuerzo },
          { id: 'combo', l: 'Super Combo', p: '+ Gs. 5.000', i: CATEGORY_IMAGES.combo }
        ].map(c => (
          <div
            key={c.id}
            onClick={() => selectCategory(c.id as MainCategory)}
            className="bg-white rounded-[50px] overflow-hidden shadow-xl cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group border-4 border-transparent hover:border-[#2E8B57]"
          >
            <div className="h-64 w-full overflow-hidden relative">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity z-10"></div>
              <img src={c.i} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="p-8 text-center bg-white relative z-20">
              <h3 className="text-3xl font-black text-[#2E8B57] uppercase tracking-tight mb-2 group-hover:text-green-600 transition-colors">{c.l}</h3>
              <div className="inline-block bg-gray-50 px-6 py-2 rounded-full mt-2 group-hover:bg-green-50 transition-colors">
                <p className="text-xl font-black text-gray-500 group-hover:text-[#2E8B57] transition-colors">{c.p}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryView;

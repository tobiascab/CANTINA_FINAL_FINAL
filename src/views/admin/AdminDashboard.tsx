import React from 'react';
import type { Dish, Order, DbUser, UserSummary } from '../../types';
import StatsTab from './StatsTab';
import MenuTab from './MenuTab';
import UsersTab from './UsersTab';
import ToolsTab from './ToolsTab';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  userList: UserSummary[];
  topDish: string;
  dishRanking: [string, number][];
}

interface Props {
  adminTab: 'stats' | 'menu' | 'users' | 'tools';
  setAdminTab: (v: 'stats' | 'menu' | 'users' | 'tools') => void;
  handleLogout: () => void;
  logoBase64: string | null;
  setLogoBase64: (v: string | null) => void;
  stats: Stats;
  dateStart: string;
  setDateStart: (v: string) => void;
  dateEnd: string;
  setDateEnd: (v: string) => void;
  currentPage: number;
  setCurrentPage: (v: number) => void;
  isGeneratingPdf: boolean;
  setIsGeneratingPdf: (v: boolean) => void;
  menuItems: Dish[];
  setMenuItems: (items: Dish[] | ((prev: Dish[]) => Dish[])) => void;
  sortedMenuItems: Dish[];
  menuSortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular';
  setMenuSortBy: (v: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular') => void;
  addDish: () => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  handleDishImageUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  dishFilesRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  dbUsers: DbUser[];
  setDbUsers: (users: DbUser[] | ((prev: DbUser[]) => DbUser[])) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  updateUserPassword: (username: string) => void;
  handleUserExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userExcelRef: React.RefObject<HTMLInputElement>;
  logoInputRef: React.RefObject<HTMLInputElement>;
  availablePrinters: string[];
  setAvailablePrinters: (v: string[]) => void;
  selectedPrinterName: string;
  setSelectedPrinterName: (v: string) => void;
  printerConfigSaved: boolean;
  setPrinterConfigSaved: (v: boolean) => void;
  reprintOrders: any[];
  setReprintOrders: (v: any[]) => void;
  reprintSearch: string;
  setReprintSearch: (v: string) => void;
  reprintDate: string;
  setReprintDate: (v: string) => void;
  setReprintOrder: (v: any) => void;
  setCurrentOrder: (v: Order | null) => void;
  setIsReprint: (v: boolean) => void;
  setView: (v: any) => void;
  setAllOrders: (v: Order[] | ((prev: Order[]) => Order[])) => void;
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  apiUrl: string;
  showToast: (msg: string, v?: any) => void;
  showConfirm: (msg: string, onYes: () => void, title?: string) => void;
  showPrompt: (msg: string, onSubmit: (v: string) => void, label?: string, defaultVal?: string) => void;
  printTicket: (order: any, reprint?: boolean) => Promise<void>;
}

const AdminDashboard: React.FC<Props> = (props) => {
  const {
    adminTab, setAdminTab, handleLogout, logoBase64, setLogoBase64,
    logoInputRef, apiFetch, apiUrl, showToast
  } = props;

  return (
    <div className="w-full max-w-7xl p-6">
      {/* Header */}
      <div className="bg-white rounded-[45px] shadow-sm p-8 flex flex-col lg:flex-row items-center justify-between gap-8 mb-8 no-print">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-green-50 overflow-hidden cursor-pointer relative group" onClick={() => logoInputRef.current?.click()}>
            {logoBase64 ? (
              <img src={logoBase64} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs text-green-700 font-bold">LOGO</span>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[8px] font-bold">CAMBIAR</span>
            </div>
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const base64 = reader.result as string;
                  setLogoBase64(base64);
                  try {
                    const res = await apiFetch(`${apiUrl}/config/logo`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: base64 })
                    });
                    if (res.ok) {
                      localStorage.setItem('app_logo_reducto', base64);
                      showToast('Logo actualizado correctamente', 'success');
                    } else {
                      showToast('Error al guardar logo', 'error');
                    }
                  } catch (err) {
                    showToast('Error de conexión al guardar logo', 'error');
                  }
                };
                reader.readAsDataURL(file);
              }
            }} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#2E8B57] uppercase">Panel Administrativo</h2>
            <div className="flex gap-4 mt-2">
              {(['stats', 'menu', 'users', 'tools'] as const).map((t) => (
                <button key={t} onClick={() => setAdminTab(t)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full ${adminTab === t ? 'bg-[#2E8B57] text-white' : 'text-gray-400'}`}>
                  {t === 'stats' ? 'Reportes' : t === 'menu' ? 'Menú' : t === 'users' ? 'Colaboradores' : '⚙️ Herramientas'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-50 text-red-500 font-black px-8 py-3 rounded-full uppercase text-[10px]">Salir</button>
      </div>

      {/* Tab Content */}
      {adminTab === 'stats' && (
        <StatsTab
          stats={props.stats}
          dateStart={props.dateStart}
          setDateStart={props.setDateStart}
          dateEnd={props.dateEnd}
          setDateEnd={props.setDateEnd}
          logoBase64={props.logoBase64}
          currentPage={props.currentPage}
          setCurrentPage={props.setCurrentPage}
          isGeneratingPdf={props.isGeneratingPdf}
          setIsGeneratingPdf={props.setIsGeneratingPdf}
          showToast={props.showToast}
        />
      )}

      {adminTab === 'menu' && (
        <MenuTab
          menuItems={props.menuItems}
          setMenuItems={props.setMenuItems as any}
          sortedMenuItems={props.sortedMenuItems}
          menuSortBy={props.menuSortBy}
          setMenuSortBy={props.setMenuSortBy}
          addDish={props.addDish}
          updateDish={props.updateDish}
          deleteDish={props.deleteDish}
          handleDishImageUpload={props.handleDishImageUpload}
          dishFilesRefs={props.dishFilesRefs}
          showConfirm={props.showConfirm}
        />
      )}

      {adminTab === 'users' && (
        <UsersTab
          dbUsers={props.dbUsers}
          setDbUsers={props.setDbUsers}
          searchTerm={props.searchTerm}
          setSearchTerm={props.setSearchTerm}
          updateUserPassword={props.updateUserPassword}
          handleUserExcel={props.handleUserExcel}
          userExcelRef={props.userExcelRef}
          apiFetch={props.apiFetch}
          apiUrl={props.apiUrl}
          showToast={props.showToast}
          showConfirm={props.showConfirm}
          showPrompt={props.showPrompt}
        />
      )}

      {adminTab === 'tools' && (
        <ToolsTab
          availablePrinters={props.availablePrinters}
          setAvailablePrinters={props.setAvailablePrinters}
          selectedPrinterName={props.selectedPrinterName}
          setSelectedPrinterName={props.setSelectedPrinterName}
          printerConfigSaved={props.printerConfigSaved}
          setPrinterConfigSaved={props.setPrinterConfigSaved}
          reprintOrders={props.reprintOrders}
          setReprintOrders={props.setReprintOrders}
          reprintSearch={props.reprintSearch}
          setReprintSearch={props.setReprintSearch}
          reprintDate={props.reprintDate}
          setReprintDate={props.setReprintDate}
          setReprintOrder={props.setReprintOrder}
          setCurrentOrder={props.setCurrentOrder}
          setIsReprint={props.setIsReprint}
          setView={props.setView}
          setAllOrders={props.setAllOrders}
          menuItems={props.menuItems}
          dbUsers={props.dbUsers}
          apiFetch={props.apiFetch}
          apiUrl={props.apiUrl}
          showToast={props.showToast}
          showConfirm={props.showConfirm}
          printTicket={props.printTicket}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

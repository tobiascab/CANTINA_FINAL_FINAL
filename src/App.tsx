import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx-js-style';
import type { AppView, MainCategory, Dish, Order, UserSummary, DbUser } from './types';
import {
  DISHES_OF_THE_DAY,
  DESAYUNO_PRICE,
  COMBO_SURCHARGE,
  MAX_COMBO_PRICE,
  APP_TITLE,
  CATEGORY_IMAGES
} from './constants';
import LoginView from './views/LoginView';
import CategoryView from './views/CategoryView';
import DishSelectionView from './views/DishSelectionView';
import TicketView from './views/TicketView';
import KitchenDashboard from './views/KitchenDashboard';
import AdminDashboard from './views/admin/AdminDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getToken = () => sessionStorage.getItem('reducto_token') || '';

const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView | 'kitchen-dashboard'>('login');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [category, setCategory] = useState<MainCategory | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [hasAutoPrinted, setHasAutoPrinted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminTab, setAdminTab] = useState<'stats' | 'menu' | 'users' | 'tools'>('stats');

  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinterName, setSelectedPrinterName] = useState<string>('');
  const [printerConfigSaved, setPrinterConfigSaved] = useState<boolean>(false);

  const [reprintOrders, setReprintOrders] = useState<any[]>([]);
  const [reprintSearch, setReprintSearch] = useState<string>('');
  const [reprintDate, setReprintDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reprintOrder, setReprintOrder] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isReprint, setIsReprint] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showChangePassModal, setShowChangePassModal] = useState<boolean>(false);
  const [tempUserForPassChange, setTempUserForPassChange] = useState<DbUser | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [draggedDishIndex, setDraggedDishIndex] = useState<number | null>(null);
  const [menuSortBy, setMenuSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular'>('name-asc');
  const [dishSearch, setDishSearch] = useState<string>('');

  const [modalState, setModalState] = useState<{
    type: 'alert' | 'confirm' | 'prompt' | null;
    title: string; message: string; icon: string; inputValue: string; inputLabel: string;
    variant: 'success' | 'error' | 'warning' | 'info';
    onConfirm: ((value?: string) => void) | null;
    onCancel: (() => void) | null;
  }>({ type: null, title: '', message: '', icon: '', inputValue: '', inputLabel: '', variant: 'info', onConfirm: null, onCancel: null });

  const [toasts, setToasts] = useState<{ id: number; message: string; icon: string; variant: 'success' | 'error' | 'warning' | 'info' }[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, icon: icons[variant], variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const showConfirm = (message: string, onYes: () => void, title = 'Confirmar', variant: 'warning' | 'info' = 'warning') => {
    const icons = { warning: '⚠️', info: '❓' };
    setModalState({ type: 'confirm', title, message, icon: icons[variant], inputValue: '', inputLabel: '', variant, onConfirm: () => { setModalState(s => ({ ...s, type: null })); onYes(); }, onCancel: () => setModalState(s => ({ ...s, type: null })) });
  };

  const showPrompt = (message: string, onSubmit: (value: string) => void, label = '', defaultVal = '') => {
    setModalState({ type: 'prompt', title: message, message: '', icon: '✏️', inputValue: defaultVal, inputLabel: label, variant: 'info', onConfirm: (val) => { setModalState(s => ({ ...s, type: null })); if (val !== undefined && val.trim()) onSubmit(val.trim()); }, onCancel: () => setModalState(s => ({ ...s, type: null })) });
  };

  const getFirstDayOfMonth = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; };
  const getToday = () => new Date().toISOString().split('T')[0];

  const [dateStart, setDateStart] = useState<string>(getFirstDayOfMonth());
  const [dateEnd, setDateEnd] = useState<string>(getToday());
  const [logoBase64, setLogoBase64] = useState<string | null>(localStorage.getItem('app_logo_reducto'));
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userExcelRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dishFilesRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dishesRes, ordersRes, usersRes] = await Promise.all([
        apiFetch(`${API_URL}/dishes`),
        apiFetch(`${API_URL}/orders`),
        apiFetch(`${API_URL}/users`)
      ]);
      const dbDishes: Dish[] = dishesRes.ok ? await dishesRes.json() : [];
      let dbOrdersRaw: any = ordersRes.ok ? await ordersRes.json() : [];
      let fetchedUsersRaw: any = usersRes.ok ? await usersRes.json() : [];

      const dbOrders: any[] = Array.isArray(dbOrdersRaw) ? dbOrdersRaw : [];
      const fetchedUsers: DbUser[] = Array.isArray(fetchedUsersRaw) ? fetchedUsersRaw : [];

      const mappedOrders: Order[] = dbOrders.map((o: any) => ({
        userId: o.userId, category: o.category as MainCategory,
        dish: o.dishName ? { name: o.dishName } as Dish : undefined,
        quantity: o.quantity, total: o.total, timestamp: o.timestamp,
        dateIso: o.dateIso, id: o.id, isServed: o.isServed
      }));

      if (dbDishes.length === 0 && localStorage.getItem('reducto_menu_items')) {
        try {
          const payload = { dishes: JSON.parse(localStorage.getItem('reducto_menu_items') || '[]'), orders: JSON.parse(localStorage.getItem('reducto_orders_v2') || '[]') };
          await apiFetch(`${API_URL}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (syncErr) { console.error('Error en sincronización inicial:', syncErr); }
      }

      setMenuItems(dbDishes.length > 0 ? dbDishes : DISHES_OF_THE_DAY);
      setAllOrders(mappedOrders);
      setDbUsers(fetchedUsers);
    } catch (error) {
      console.error("Error conectando al servidor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const savedUser = sessionStorage.getItem('reducto_user');
    const savedRole = sessionStorage.getItem('reducto_role');
    const savedToken = sessionStorage.getItem('reducto_token');

    if (path === 'admin-dashboard') {
      if (savedToken && savedUser && savedRole === 'admin') { setCurrentUser(savedUser); setView('admin-dashboard'); }
      else { window.history.replaceState(null, '', '/'); setView('login'); }
    } else if (path === 'kitchen-dashboard') {
      if (savedToken && savedUser && (savedRole === 'kitchen' || savedRole === 'admin')) { setCurrentUser(savedUser); setView('kitchen-dashboard'); }
      else { window.history.replaceState(null, '', '/'); setView('login'); }
    } else if (['category', 'dish-selection', 'ticket'].includes(path)) {
      if (savedUser) { setCurrentUser(savedUser); setView(path as any); }
      else { window.history.replaceState(null, '', '/'); setView('login'); }
    }

    const onPopState = () => { const newPath = window.location.pathname.replace('/', ''); setView(newPath ? (newPath as any) : 'login'); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const printTicket = async (order: Order | null, reprint = false) => {
    if (!order) return;
    const foundUser = dbUsers.find(u => u.username === order.userId);
    try {
      const res = await apiFetch(`${API_URL}/print/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appTitle: APP_TITLE, isReprint: reprint, timestamp: order.timestamp, userId: order.userId, fullName: foundUser?.fullName || 'Socio', category: order.category, dishName: order.dish?.name || (order.category !== 'desayuno' ? undefined : 'DESAYUNO'), quantity: order.quantity, total: order.total, orderId: order.id })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al imprimir', 'error');
        if (order.id) apiFetch(`${API_URL}/orders/${order.id}/print-status`, { method: 'PATCH', body: JSON.stringify({ isPrinted: false }) }).catch(console.error);
      } else {
        showToast('Ticket impreso correctamente', 'success');
        if (order.id) apiFetch(`${API_URL}/orders/${order.id}/print-status`, { method: 'PATCH', body: JSON.stringify({ isPrinted: true }) }).catch(console.error);
      }
    } catch (e) { showToast('Error de conexión con la impresora', 'error'); }
  };

  useEffect(() => {
    if (view === 'ticket' && currentOrder && !hasAutoPrinted) {
      setTimeout(() => { printTicket(currentOrder, false); setHasAutoPrinted(true); }, 500);
    }
  }, [view, currentOrder, hasAutoPrinted]);

  useEffect(() => {
    const path = view === 'login' ? '/' : `/${view}`;
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
  }, [view]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const loadPrinterSetup = async () => {
      try {
        const [configRes, printersRes] = await Promise.all([apiFetch(`${API_URL}/printer-config`), apiFetch(`${API_URL}/printers`)]);
        if (configRes.ok) { const config = await configRes.json(); if (config.printerName) setSelectedPrinterName(config.printerName); }
        if (printersRes.ok) { const { printers } = await printersRes.json(); setAvailablePrinters(printers || []); }
      } catch (e) { /* fallo silencioso */ }
    };
    loadPrinterSetup();
  }, []);

  const updateDish = async (dish: Dish) => {
    try {
      setMenuItems(prev => prev.map(d => d.id === dish.id ? dish : d));
      await apiFetch(`${API_URL}/dishes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dish) });
    } catch (e) { showToast('Error al guardar plato', 'error'); }
  };

  const serveOrder = async (orderId: number) => {
    try {
      const res = await apiFetch(`${API_URL}/orders/${orderId}/serve`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) { setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, isServed: data.isServed } : o)); showToast(data.isServed ? 'Plato marcado como servido' : 'Estado de servicio reseteado', 'info'); }
    } catch (e) { showToast('Error al actualizar estado', 'error'); }
  };

  const handleDishImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dishId = menuItems[idx]?.id;
      if (!dishId) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMenuItems(prev => {
          const dish = prev.find(d => d.id === dishId);
          if (dish) {
            const updatedDish = { ...dish, image: base64String };
            apiFetch(`${API_URL}/dishes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDish) }).catch(() => showToast('Error al guardar imagen', 'error'));
            return prev.map(d => d.id === dishId ? updatedDish : d);
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addDish = () => {
    const newDish: Dish = { id: `dish_${Date.now()}`, name: 'Nuevo Plato', basePrice: 15000, image: CATEGORY_IMAGES.almuerzo, isActive: true };
    setMenuItems(prev => [...prev, newDish]);
    updateDish(newDish);
  };

  const deleteDish = async (id: string) => {
    showConfirm('¿Eliminar este plato?', async () => {
      try {
        await apiFetch(`${API_URL}/dishes/${id}`, { method: 'DELETE' });
        setMenuItems(prev => prev.filter(d => d.id !== id));
        showToast('Plato eliminado', 'success');
      } catch (e) { showToast('Error al eliminar', 'error'); }
    }, 'Eliminar Plato');
  };

  const handleDishDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => { e.preventDefault(); e.stopPropagation(); setDraggedDishIndex(idx); };
  const handleDishDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDraggedDishIndex(null); };
  const handleDishDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault(); e.stopPropagation(); setDraggedDishIndex(null);
    const file = e.dataTransfer.files?.[0];
    const dishId = menuItems[idx]?.id;
    if (file && file.type.startsWith('image/') && dishId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMenuItems(prev => {
          const dish = prev.find(d => d.id === dishId);
          if (dish) {
            const updatedDish = { ...dish, image: base64 };
            apiFetch(`${API_URL}/dishes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDish) }).catch(() => showToast('Error al guardar imagen', 'error'));
            return prev.map(d => d.id === dishId ? updatedDish : d);
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      try {
        setIsLoading(true);
        const res = await apiFetch(`${API_URL}/users/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: data }) });
        if (res.ok) { showToast('Usuarios importados con éxito', 'success'); fetchData(); }
      } catch (err) { showToast('Error al importar', 'error'); }
      finally { setIsLoading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const updateUserPassword = (username: string) => {
    showPrompt(`Nueva contraseña para ${username}:`, async (newPass) => {
      try {
        const res = await apiFetch(`${API_URL}/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPass }) });
        if (res.ok) { setDbUsers(prev => prev.map(u => u.username === username ? { ...u, password: newPass } : u)); showToast('Contraseña actualizada', 'success'); }
        else showToast('Error al actualizar', 'error');
      } catch (e) { showToast('Error de conexión', 'error'); }
    }, 'Contraseña');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;
    if (!user || !pass) { showToast('Ingrese usuario y contraseña', 'error'); return; }
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) });
      const data = await res.json();
      if (data.mustChangePassword) { setTempUserForPassChange({ username: data.username, fullName: data.fullName, password: 'Reducto2026*/', role: data.role }); setShowChangePassModal(true); return; }
      if (!data.success) { showToast(data.error || 'Credenciales incorrectas', 'error'); return; }
      if (data.token) sessionStorage.setItem('reducto_token', data.token);
      if (data.fullName) sessionStorage.setItem('reducto_fullname', data.fullName);
      if (data.role) sessionStorage.setItem('reducto_role', data.role);
      sessionStorage.setItem('reducto_user', user);
      setCurrentUser(user);
      await fetchData();
      if (data.role === 'admin') setView('admin-dashboard');
      else if (data.role === 'kitchen') setView('kitchen-dashboard');
      else setView('category');
    } catch (err) { showToast('Error de conexión con el servidor', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleForcePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('newPass') as string;
    const confirmPass = formData.get('confirmPass') as string;
    if (newPass !== confirmPass) { showToast('Las contraseñas no coinciden', 'error'); return; }
    if (newPass.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (newPass === 'Reducto2026*/') { showToast('Debe elegir una contraseña diferente a la predeterminada', 'warning'); return; }
    if (tempUserForPassChange) {
      try {
        const res = await apiFetch(`${API_URL}/users/${tempUserForPassChange.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPass }) });
        if (res.ok) { showToast('Contraseña actualizada. Ingresando...', 'success'); setShowChangePassModal(false); sessionStorage.setItem('reducto_user', tempUserForPassChange.username); setCurrentUser(tempUserForPassChange.username); setView('category'); setTempUserForPassChange(null); }
        else { showToast('Error al actualizar contraseña', 'error'); }
      } catch (err) { showToast('Error de conexión', 'error'); }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('reducto_token'); sessionStorage.removeItem('reducto_user');
    sessionStorage.removeItem('reducto_fullname'); sessionStorage.removeItem('reducto_role');
    setCategory(null); setSelectedDish(null); setQuantity(1); setCurrentOrder(null);
    setHasAutoPrinted(false); setIsReprint(false); setCurrentUser(''); setView('login');
  };

  const selectCategory = (cat: MainCategory) => {
    setCategory(cat); setQuantity(1);
    if (cat === 'desayuno') {
      const breakfastDish: Dish = { id: 'desayuno_std', name: 'Desayuno', basePrice: DESAYUNO_PRICE, image: CATEGORY_IMAGES.desayuno, isActive: true };
      setSelectedDish(breakfastDish); setView('dish-selection'); return;
    }
    const activeDishes = menuItems.filter(d => d.isActive !== false);
    if (activeDishes.length === 1) setSelectedDish(activeDishes[0]); else setSelectedDish(null);
    setView('dish-selection');
  };

  const processOrder = async () => {
    let price = 0;
    if (category === 'desayuno') price = DESAYUNO_PRICE;
    else if (category === 'almuerzo') price = selectedDish?.basePrice || 0;
    else if (category === 'combo') price = Math.min((selectedDish?.basePrice || 0) + COMBO_SURCHARGE, MAX_COMBO_PRICE);
    const now = new Date();
    const orderData = { userId: currentUser, category: category!, dishName: category !== 'desayuno' ? selectedDish?.name : undefined, quantity, total: price * quantity, timestamp: now.toLocaleString('es-PY'), dateIso: now.toISOString().split('T')[0] };
    try {
      const res = await apiFetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (!res.ok) throw new Error();
      const savedOrder = await res.json();
      const uiOrder: Order = { ...orderData, id: savedOrder.id, dish: selectedDish || undefined };
      setAllOrders(prev => [...prev, uiOrder]); setCurrentOrder(uiOrder); setHasAutoPrinted(false); setView('ticket');
    } catch (error) { showToast('Error al guardar pedido', 'error'); }
  };

  const dishConsumptionStats = useMemo(() => {
    const s: Record<string, number> = {};
    allOrders.forEach(order => { if (order.dish?.id) s[order.dish.id] = (s[order.dish.id] || 0) + order.quantity; });
    return s;
  }, [allOrders]);

  const sortedMenuItems = useMemo(() => {
    const items = [...menuItems];
    switch (menuSortBy) {
      case 'name-asc': return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc': return items.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc': return items.sort((a, b) => a.basePrice - b.basePrice);
      case 'price-desc': return items.sort((a, b) => b.basePrice - a.basePrice);
      case 'popular': return items.sort((a, b) => (dishConsumptionStats[b.id] || 0) - (dishConsumptionStats[a.id] || 0));
      default: return items;
    }
  }, [menuItems, menuSortBy, dishConsumptionStats]);

  const stats = useMemo(() => {
    let filtered = allOrders.filter(o => o.dateIso >= dateStart && o.dateIso <= dateEnd);
    const adminUserIds = new Set(['admin', ...dbUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.username)]);
    filtered = filtered.filter(o => !adminUserIds.has(o.userId));
    const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filtered.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const userGroups: Record<string, UserSummary> = {};
    filtered.forEach(o => {
      if (!userGroups[o.userId]) { const found = dbUsers.find(u => u.username === o.userId); userGroups[o.userId] = { userId: o.userId, name: found ? found.fullName : `FUNC. ${o.userId}`, totalQuantity: 0, totalSpent: 0, breakfastCount: 0, lunchCount: 0 }; }
      userGroups[o.userId].totalQuantity += o.quantity; userGroups[o.userId].totalSpent += o.total;
      if (o.category === 'desayuno') userGroups[o.userId].breakfastCount += o.quantity; else userGroups[o.userId].lunchCount += o.quantity;
    });
    const userList = Object.values(userGroups).sort((a, b) => b.totalSpent - a.totalSpent);
    const dishCounts: Record<string, number> = {};
    filtered.forEach(o => { const name = o.dish?.name || 'DESAYUNO'; dishCounts[name] = (dishCounts[name] || 0) + o.quantity; });
    const ranking = Object.entries(dishCounts).sort((a, b) => b[1] - a[1]);
    return { totalRevenue, totalOrders, averageTicket, userList, topDish: ranking[0]?.[0] || 'N/A', dishRanking: ranking };
  }, [allOrders, dateStart, dateEnd, dbUsers]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F0FFF4] font-black text-[#2E8B57]">CARGANDO SISTEMA...</div>;

  const commonDishProps = {
    menuItems,
    setMenuItems: (v: Dish[] | ((prev: Dish[]) => Dish[])) => setMenuItems(v as any),
    sortedMenuItems, menuSortBy, setMenuSortBy,
    addDish, updateDish, deleteDish,
    handleDishImageUpload, handleDishDragOver, handleDishDragLeave, handleDishDrop,
    draggedDishIndex, dishFilesRefs, showConfirm
  };

  return (
    <div className={`min-h-screen bg-[#F0FFF4] flex flex-col items-center p-4 ${['login', 'category', 'dish-selection'].includes(view) ? 'justify-center' : ''}`}>

      {view === 'login' && (
        <LoginView
          handleLogin={handleLogin}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          logoBase64={logoBase64}
          showChangePassModal={showChangePassModal}
          tempUserForPassChange={tempUserForPassChange}
          handleForcePasswordChange={handleForcePasswordChange}
          setShowChangePassModal={setShowChangePassModal}
          setTempUserForPassChange={setTempUserForPassChange}
        />
      )}

      {view === 'category' && (
        <CategoryView currentUser={currentUser} dbUsers={dbUsers} selectCategory={selectCategory} />
      )}

      {view === 'dish-selection' && (
        <DishSelectionView
          category={category}
          menuItems={menuItems}
          selectedDish={selectedDish}
          setSelectedDish={setSelectedDish}
          quantity={quantity}
          setQuantity={setQuantity}
          processOrder={processOrder}
          setView={setView}
        />
      )}

      {view === 'ticket' && currentOrder && (
        <TicketView
          currentOrder={currentOrder}
          dbUsers={dbUsers}
          isReprint={isReprint}
          setIsReprint={setIsReprint}
          printTicket={printTicket}
          reprintOrder={reprintOrder}
          setReprintOrder={setReprintOrder}
          setCurrentOrder={setCurrentOrder}
          setView={setView}
          setAdminTab={setAdminTab}
          handleLogout={handleLogout}
        />
      )}

      {view === 'kitchen-dashboard' && (
        <KitchenDashboard
          allOrders={allOrders}
          dbUsers={dbUsers}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          handleLogout={handleLogout}
          serveOrder={serveOrder}
          dishSearch={dishSearch}
          setDishSearch={setDishSearch}
          {...commonDishProps}
        />
      )}

      {view === 'admin-dashboard' && (
        <AdminDashboard
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          handleLogout={handleLogout}
          logoBase64={logoBase64}
          setLogoBase64={setLogoBase64}
          stats={stats}
          dateStart={dateStart}
          setDateStart={setDateStart}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isGeneratingPdf={isGeneratingPdf}
          setIsGeneratingPdf={setIsGeneratingPdf}
          dbUsers={dbUsers}
          setDbUsers={setDbUsers as any}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updateUserPassword={updateUserPassword}
          handleUserExcel={handleUserExcel}
          userExcelRef={userExcelRef}
          logoInputRef={logoInputRef}
          availablePrinters={availablePrinters}
          setAvailablePrinters={setAvailablePrinters}
          selectedPrinterName={selectedPrinterName}
          setSelectedPrinterName={setSelectedPrinterName}
          printerConfigSaved={printerConfigSaved}
          setPrinterConfigSaved={setPrinterConfigSaved}
          reprintOrders={reprintOrders}
          setReprintOrders={setReprintOrders}
          reprintSearch={reprintSearch}
          setReprintSearch={setReprintSearch}
          reprintDate={reprintDate}
          setReprintDate={setReprintDate}
          setReprintOrder={setReprintOrder}
          setCurrentOrder={setCurrentOrder}
          setIsReprint={setIsReprint}
          setView={setView}
          setAllOrders={setAllOrders as any}
          apiFetch={apiFetch}
          apiUrl={API_URL}
          showToast={showToast}
          showConfirm={showConfirm}
          showPrompt={showPrompt}
          printTicket={printTicket}
          {...commonDishProps}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '380px' }}>
        {toasts.map(toast => {
          const bgColors = { success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-orange-500', info: 'bg-blue-600' };
          return (
            <div key={toast.id} className={`${bgColors[toast.variant]} text-white px-6 py-4 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300`}>
              <span className="text-xl">{toast.icon}</span>
              <p className="font-bold text-sm flex-1">{toast.message}</p>
            </div>
          );
        })}
      </div>

      {/* CONFIRM / PROMPT MODAL */}
      {modalState.type && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={() => modalState.onCancel?.()}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[30px] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">{modalState.icon}</div>
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-2">{modalState.title}</h3>
            {modalState.message && <p className="text-sm text-gray-500 text-center mb-6 whitespace-pre-line">{modalState.message}</p>}
            {modalState.type === 'prompt' && (
              <div className="mb-6">
                {modalState.inputLabel && <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">{modalState.inputLabel}</label>}
                <input
                  type="text" autoFocus value={modalState.inputValue}
                  onChange={e => setModalState(s => ({ ...s, inputValue: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') modalState.onConfirm?.(modalState.inputValue); }}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 font-bold text-sm focus:border-[#2E8B57] focus:ring-2 focus:ring-green-100 outline-none transition-all text-center"
                  placeholder="Escribe aquí..."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => modalState.onCancel?.()} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase hover:bg-gray-200 transition-all">Cancelar</button>
              <button onClick={() => { if (modalState.type === 'prompt') modalState.onConfirm?.(modalState.inputValue); else modalState.onConfirm?.(); }} className="flex-1 py-3 rounded-2xl bg-[#2E8B57] text-white font-black text-xs uppercase hover:bg-green-700 shadow-lg transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;

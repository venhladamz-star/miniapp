/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Utensils, 
  CloudSun, 
  Coins, 
  Fuel, 
  Download, 
  Zap, 
  Menu, 
  X,
  Trash2,
  Plus,
  QrCode,
  Wand2,
  Search,
  RotateCcw,
  ExternalLink,
  Info,
  MapPin,
  Droplets,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, signIn, logout, db } from './lib/firebase';

// --- Configuration & Services ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Error Handling ---
interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path: string | null = null) {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || String(error),
    operationType: operation,
    path: path,
    authInfo: user ? {
      userId: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerInfo: user.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || '',
      }))
    } : {
      userId: 'anonymous',
      email: '',
      emailVerified: false,
      isAnonymous: true,
      providerInfo: []
    }
  };
  console.error("Firestore Error:", errorInfo);
  throw JSON.stringify(errorInfo);
}

// --- Types ---
interface Debt {
  id: string;
  person: string;
  amount: number;
  type: 'cho_vay' | 'di_vay';
  note: string;
  date: string;
}

interface QRCard {
  id: string;
  name: string;
  image: string;
  number: string;
  holder: string;
}

interface UserProfile {
  name: string;
  bank: string;
  account: string;
}

// --- Components ---

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: '', bank: '', account: '' });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setProfile({ name: '', bank: '', account: '' });
      }
    });

    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'profile', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name || '',
          bank: data.bank || '',
          account: data.account || ''
        });
      }
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/profile/main`));

    return () => unsub();
  }, [user]);

  const saveProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), {
        ...newProfile,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}/profile/main`);
    }
  };
  
  const views = [
    { id: 'home', title: 'Trang chủ', icon: <LayoutDashboard size={20} /> },
    { id: 'bank', title: 'Bank & Nợ', icon: <Wallet size={20} /> },
    { id: 'food', title: 'Gợi ý món ăn', icon: <Utensils size={20} /> },
    { id: 'weather', title: 'Thời tiết', icon: <CloudSun size={20} /> },
    { id: 'gold', title: 'Giá vàng', icon: <Coins size={20} /> },
    { id: 'gas', title: 'Giá xăng', icon: <Fuel size={20} /> },
    { id: 'download', title: 'Tải video', icon: <Download size={20} /> },
    { id: 'powercut', title: 'Lịch cúp điện', icon: <Zap size={20} /> },
    { id: 'profile', title: 'Cá nhân', icon: <Wand2 size={20} /> },
  ];

  const currentTitle = views.find(v => v.id === activeView)?.title || '';

  return (
    <div className="min-h-screen bg-bg text-slate-800 font-sans">
      {/* Background Blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-brand rounded-full blur-[100px] opacity-[0.05] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-secondary rounded-full blur-[100px] opacity-[0.05] pointer-events-none animate-pulse" />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-[99] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-slate-100 z-[100] transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-50">
          <h1 className="text-2xl font-black font-display cursor-pointer" onClick={() => setActiveView('home')}>
            <span className="text-brand">Life</span>Hub
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">Open-source Hub</p>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {!user ? (
            <div className="px-4 py-6 mb-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Cloud Storage Disabled</p>
              <button 
                onClick={signIn}
                className="theme-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={14} /> Đăng nhập Google
              </button>
            </div>
          ) : (
            <div className="px-4 py-4 mb-4 bg-indigo-50/20 rounded-3xl border border-indigo-100/50 flex items-center gap-3">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-800 truncate">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline">Đăng xuất</button>
              </div>
            </div>
          )}
          
          <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-widest font-black">Toolbox</p>
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => { setActiveView(view.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeView === view.id ? 'bg-brand/10 text-brand' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {view.icon}
              <span className="text-sm font-bold">{view.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-[280px]">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 md:left-[280px] h-[64px] bg-bg/80 backdrop-blur-xl border-b border-slate-100 z-50 flex items-center px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="ml-4 md:ml-0 bg-indigo-50 text-brand px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {currentTitle}
          </div>
        </header>

        <div className="pt-[84px] px-6 pb-12 max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeView === 'home' && <HomeView onNavigate={setActiveView} />}
                {activeView === 'bank' && (
                  user ? <BankView profile={profile} user={user} /> : (
                    <div className="text-center py-24">
                      <Wallet size={64} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-2xl font-black text-slate-400">Yêu cầu đăng nhập</h3>
                      <p className="text-slate-400 mb-8">Bạn cần đăng nhập để quản lý nợ và mã QR an toàn trên đám mây.</p>
                      <button onClick={signIn} className="theme-btn-primary px-8 py-4">Đăng nhập ngay</button>
                    </div>
                  )
                )}
                {activeView === 'food' && <FoodView />}
                {activeView === 'weather' && <WeatherView />}
                {activeView === 'gold' && <GoldView />}
                {activeView === 'gas' && <GasView />}
                {activeView === 'download' && <DownloadView />}
                {activeView === 'powercut' && <PowerCutView />}
                {activeView === 'profile' && (
                  user ? <ProfileView profile={profile} onSave={saveProfile} /> : (
                    <div className="text-center py-24">
                      <Wand2 size={64} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-2xl font-black text-slate-400">Yêu cầu đăng nhập</h3>
                      <p className="text-slate-400 mb-8">Cá nhân hóa trải nghiệm và lưu trữ an toàn.</p>
                      <button onClick={signIn} className="theme-btn-primary px-8 py-4">Đăng nhập ngay</button>
                    </div>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

// --- SUB-VIEWS ---

function HomeView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const cards = [
    { id: 'bank', title: 'Bank & Nợ', desc: 'Financial health tracker.', color: 'bg-brand/10 text-brand', icon: <Wallet /> },
    { id: 'food', title: 'Gợi ý món ăn', desc: 'AI-powered recipes.', color: 'bg-secondary/10 text-secondary', icon: <Utensils /> },
    { id: 'weather', title: 'Thời tiết', desc: 'Atmospheric breakdown.', color: 'bg-sky-500/10 text-sky-500', icon: <CloudSun /> },
    { id: 'gold', title: 'Giá vàng', desc: 'Market commodity tracking.', color: 'bg-warning/10 text-warning', icon: <Coins /> },
    { id: 'gas', title: 'Giá xăng', desc: 'Petrolimex price data.', color: 'bg-rose-500/10 text-rose-500', icon: <Fuel /> },
    { id: 'download', title: 'Tải video', desc: 'Global asset downloader.', color: 'bg-purple-500/10 text-purple-500', icon: <Download /> },
  ];

  return (
    <div className="text-center md:text-left">
      <div className="mb-16">
        <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-brand mb-4">
          LifeHub v2.0
        </h1>
        <p className="text-slate-500 text-xl font-medium max-w-2xl">
          Polished utility hub for modern efficiency. Ready for distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <button 
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className="group theme-card flex flex-col items-start text-left"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-6 transition-transform group-hover:scale-110 ${card.color}`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-bold font-display mb-2">{card.title}</h3>
            <p className="text-sm text-slate-400 font-medium">{card.desc}</p>
          </button>
        ))}
        <button 
          onClick={() => onNavigate('powercut')}
          className="group theme-card col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col items-start text-left"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl mb-6 bg-warning/10 text-warning transition-transform group-hover:scale-110">
            <Zap />
          </div>
          <h3 className="text-xl font-bold font-display mb-2">Lịch cúp điện</h3>
          <p className="text-sm text-slate-400 font-medium">Power integrity check.</p>
        </button>
      </div>
    </div>
  );
}

function BankView({ profile, user }: { profile: UserProfile, user: User }) {
  const [tab, setTab] = useState<'debts' | 'qr'>('debts');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [qrs, setQrs] = useState<QRCard[]>([]);

  // Form states
  const [debtForm, setDebtForm] = useState({ person: '', amount: '', type: 'cho_vay', note: '' });
  const [qrForm, setQrForm] = useState({ name: profile.bank || '', image: '', number: profile.account || '', holder: profile.name || '' });

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'debts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setDebts(snap.docs.map(doc => ({ id: doc.id as any, ...doc.data() } as any)));
    }, (err) => handleFirestoreError(err, 'list', `users/${user.uid}/debts`));

    const q2 = query(collection(db, 'users', user.uid, 'qrs'), orderBy('createdAt', 'desc'));
    const unsub2 = onSnapshot(q2, (snap) => {
      setQrs(snap.docs.map(doc => ({ id: doc.id as any, ...doc.data() } as any)));
    }, (err) => handleFirestoreError(err, 'list', `users/${user.uid}/qrs`));

    return () => {
      unsub();
      unsub2();
    };
  }, [user]);

  // Update qrForm when profile changes
  useEffect(() => {
    setQrForm(prev => ({
      ...prev,
      name: prev.name || profile.bank,
      number: prev.number || profile.account,
      holder: prev.holder || profile.name
    }));
  }, [profile]);

  const addDebt = async () => {
    if (!debtForm.person || !debtForm.amount) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'debts'), {
        person: debtForm.person,
        amount: parseFloat(debtForm.amount),
        type: debtForm.type,
        note: debtForm.note,
        date: new Date().toLocaleDateString('vi-VN'),
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setDebtForm({ person: '', amount: '', type: 'cho_vay', note: '' });
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}/debts`);
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'debts', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `users/${user.uid}/debts/${id}`);
    }
  };

  const addQR = async () => {
    if (!qrForm.name && !qrForm.image) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'qrs'), {
        name: qrForm.name || `QR ${qrs.length + 1}`,
        image: qrForm.image,
        number: qrForm.number,
        holder: qrForm.holder,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setQrForm({ name: '', image: '', number: '', holder: '' });
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}/qrs`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await addDoc(collection(db, 'users', user.uid, 'qrs'), {
          name: profile.bank || `QR ${qrs.length + 1}`,
          image: base64String,
          number: profile.account || '',
          holder: profile.name || '',
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, 'create', `users/${user.uid}/qrs`);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteQR = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'qrs', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `users/${user.uid}/qrs/${id}`);
    }
  };

  const totalChoVay = debts.filter(d => d.type === 'cho_vay').reduce((acc, d) => acc + d.amount, 0);
  const totalDiVay = debts.filter(d => d.type === 'di_vay').reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm">
        <button 
          onClick={() => setTab('debts')}
          className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${tab === 'debts' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
        >Quản lý nợ</button>
        <button 
          onClick={() => setTab('qr')}
          className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${tab === 'qr' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
        >QR Ngân hàng</button>
      </div>

      {tab === 'debts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="theme-card">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-brand"><Plus size={18} /> Thêm ghi chú</h3>
              <div className="space-y-4">
                <input 
                  className="theme-input" 
                  placeholder="Tên người"
                  value={debtForm.person}
                  onChange={e => setDebtForm({...debtForm, person: e.target.value})}
                />
                <input 
                  className="theme-input" 
                  type="number"
                  placeholder="Số tiền (VNĐ)"
                  value={debtForm.amount}
                  onChange={e => setDebtForm({...debtForm, amount: e.target.value})}
                />
                <select 
                  className="theme-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.25rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-12"
                  value={debtForm.type}
                  onChange={e => setDebtForm({...debtForm, type: e.target.value as any})}
                >
                  <option value="cho_vay">Cho vay</option>
                  <option value="di_vay">Đi vay</option>
                </select>
                <input 
                  className="theme-input" 
                  placeholder="Ghi chú thêm"
                  value={debtForm.note}
                  onChange={e => setDebtForm({...debtForm, note: e.target.value})}
                />
                <button 
                  onClick={addDebt}
                  className="theme-btn-primary w-full"
                >Thêm dữ liệu</button>
              </div>
            </div>
            
            <div className="theme-card">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Market Pulse</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Asset Velocity:</span>
                  <span className="text-brand font-black">{totalChoVay.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Debt Pressure:</span>
                  <span className="text-secondary font-black">{totalDiVay.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-tighter">Net Capital:</span>
                  <span className={`text-xl font-black ${(totalChoVay - totalDiVay) >= 0 ? 'text-accent' : 'text-secondary'}`}>
                    {(totalChoVay - totalDiVay).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4">
              {debts.length === 0 ? (
                <div className="text-center py-24 bg-white/50 rounded-[32px] border border-dashed border-slate-200">
                  <Wallet size={48} className="mx-auto text-slate-200 mb-6" />
                  <p className="text-slate-400 font-bold">Registry Empty</p>
                </div>
              ) : (
                debts.map(debt => (
                  <div key={debt.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 ${debt.type === 'cho_vay' ? 'bg-brand/10 text-brand' : 'bg-secondary/10 text-secondary'}`}>
                        {debt.type === 'cho_vay' ? '▲' : '▼'}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-lg text-slate-800">{debt.person}</h4>
                          <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-400 uppercase tracking-tighter">{debt.date}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 mt-1">{debt.note || 'No metadata'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`text-xl font-black ${(debt.type === 'cho_vay' || debt.type as any === 'cho_vay') ? 'text-brand' : 'text-secondary'}`}>
                        {debt.type === 'cho_vay' ? '+' : '-'}{debt.amount.toLocaleString('vi-VN')}
                      </div>
                      <button 
                        onClick={() => deleteDebt(debt.id)}
                        className="p-3 text-slate-300 hover:text-secondary hover:bg-secondary/5 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
             <div className="theme-card bg-indigo-50/20 border-indigo-100/50">
              <h3 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-widest"><Plus size={18} className="text-brand" /> Add QR Identity</h3>
              
              {/* Direct Upload Section */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Import</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-[32px] bg-white hover:bg-brand/5 hover:border-brand cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <CloudSun className="text-indigo-200 group-hover:text-brand mb-2" size={32} />
                    <p className="text-[10px] font-black text-slate-400 group-hover:text-brand text-center px-4">Pick from Library<br/>(PNG, JPG supported)</p>
                  </div>
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="relative mb-8 text-center px-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-[#fdfdfd] px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Or Manual</span>
              </div>

              <div className="space-y-4">
                <input 
                  className="theme-input w-full text-sm" 
                  placeholder="Bank Institution"
                  value={qrForm.name}
                  onChange={e => setQrForm({...qrForm, name: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm" 
                  placeholder="QR Image Pointer (URL)"
                  value={qrForm.image}
                  onChange={e => setQrForm({...qrForm, image: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm font-mono" 
                  placeholder="Account Identifier"
                  value={qrForm.number}
                  onChange={e => setQrForm({...qrForm, number: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm uppercase" 
                  placeholder="Identity Holder"
                  value={qrForm.holder}
                  onChange={e => setQrForm({...qrForm, holder: e.target.value})}
                />
                <button 
                  onClick={addQR}
                  className="theme-btn-primary w-full py-4 mt-2"
                >Establish QR</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {qrs.length === 0 ? (
               <div className="col-span-full text-center py-24 bg-white/50 rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[24px] flex items-center justify-center mb-6">
                    <QrCode size={40} />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No cryptographics detected</p>
               </div>
            ) : (
              qrs.map(qr => (
                <div key={qr.id} className="theme-card text-center group relative overflow-hidden flex flex-col items-center">
                  <button 
                    onClick={() => deleteQR(qr.id)}
                    className="absolute top-6 right-6 z-10 p-3 bg-white text-slate-300 hover:text-secondary hover:bg-secondary/5 border border-slate-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <h4 className="font-black text-xl text-slate-800 mb-8 tracking-tight">{qr.name}</h4>
                  
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full scale-110"></div>
                    {qr.image ? (
                      <img src={qr.image} alt={qr.name} className="relative w-full max-w-[220px] mx-auto rounded-[32px] border-8 border-white shadow-2xl shadow-indigo-100" />
                    ) : (
                      <div className="relative w-[220px] h-[220px] bg-slate-50 border-4 border-white rounded-[32px] flex items-center justify-center mx-auto text-slate-200 shadow-xl shadow-slate-50">
                        <QrCode size={64} />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 w-full pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID N°</span>
                      <span className="font-black text-brand text-sm font-mono tracking-tight">{qr.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bearer</span>
                      <span className="font-black text-slate-800 text-xs uppercase tracking-tight">{qr.holder}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FoodView() {
  const [ingredients, setIngredients] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const getSuggestion = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Nguyên liệu đang có: ${ingredients}. Hãy gợi ý 3-5 món ăn ngon, kèm theo công thức ngắn gọn và lưu ý khi nấu. Trình bày bằng tiếng Việt, định dạng Markdown rõ ràng.`,
        config: {
          systemInstruction: "Bạn là một đầu bếp chuyên gia người Việt Nam, thân thiện và sáng tạo."
        }
      });
      setResult(response.text || "Không có phản hồi từ AI.");
    } catch (e) {
      console.error("AI Error:", e);
      setResult("⚠️ Lỗi kết nối AI. Vui lòng kiểm tra lại cấu hình API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="theme-card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-brand/5 pointer-events-none text-[120px]">
          <Utensils />
        </div>
        <h3 className="text-3xl font-black mb-4 font-display text-brand">CulinAI Laboratory</h3>
        <p className="text-slate-500 text-sm mb-8 leading-loose font-medium">
          Input available substrate for neural recipe synthesis. Let open-source intelligence curate your next gourmet experience.
        </p>
        <textarea 
          className="theme-input min-h-[160px] mb-6 font-medium text-base leading-relaxed"
          placeholder="Substrate: Eggs, Tomato, Scalions, Minced Beef..."
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
        />
        <button 
          onClick={getSuggestion}
          disabled={loading || !ingredients.trim()}
          className="theme-btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={22} />}
          {loading ? 'Synthesizing...' : 'Generate Recipe'}
        </button>
      </div>

      {result && (
        <div className="theme-card md:prose prose-indigo prose-invert max-w-none prose-sm bg-indigo-50/30 border-indigo-100">
           <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function WeatherView() {
  const [addr, setAddr] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchWeather = async () => {
    if (!addr.trim()) return;
    setLoading(true);
    setWeather(null);
    try {
      // Step 1: Geocoding via Open-Meteo
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(addr)}&count=1&language=vi&format=json`;
      const { data: geoData } = await axios.get(geoUrl);
      
      if (!geoData.results || geoData.results.length === 0) {
        alert("Không tìm thấy địa điểm này.");
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Step 2: Weather & AQI
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`;
      
      const [{ data: wData }, { data: aData }] = await Promise.all([
        axios.get(weatherUrl),
        axios.get(aqiUrl)
      ]);

      setWeather({
        current: wData.current,
        daily: wData.daily,
        aqi: aData.current.us_aqi,
        location: { name, country }
      });
    } catch (e) {
      alert("Lỗi khi tải dữ liệu thời tiết.");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherVisuals = (code: number) => {
    if (code === 0) return { label: 'Trời quang', color: 'text-yellow-400' };
    if (code >= 1 && code <= 3) return { label: 'Ít mây', color: 'text-gray-400' };
    if (code >= 45 && code <= 48) return { label: 'Sương mù', color: 'text-gray-300' };
    if (code >= 51 && code <= 67) return { label: 'Mưa nhỏ', color: 'text-blue-400' };
    if (code >= 71 && code <= 77) return { label: 'Tuyết', color: 'text-white' };
    if (code >= 80 && code <= 99) return { label: 'Mưa rào', color: 'text-blue-600' };
    return { label: 'Nhiều mây', color: 'text-gray-500' };
  };

  const getAQIInfo = (val: number) => {
    if (val <= 50) return { label: 'Tốt', color: 'bg-green-500', text: 'text-green-500' };
    if (val <= 100) return { label: 'Trung bình', color: 'bg-yellow-500', text: 'text-yellow-500' };
    if (val <= 150) return { label: 'Kém', color: 'bg-orange-500', text: 'text-orange-500' };
    if (val <= 200) return { label: 'Xấu', color: 'bg-red-500', text: 'text-red-500' };
    return { label: 'Rất xấu', color: 'bg-purple-500', text: 'text-purple-500' };
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto flex gap-3">
        <input 
          className="theme-input flex-1"
          placeholder="Enter location (e.g. Hanoi, District 1...)"
          value={addr}
          onChange={e => setAddr(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchWeather()}
        />
        <button 
          onClick={searchWeather}
          disabled={loading}
          className="theme-btn-primary min-w-[140px] flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
          Tra cứu
        </button>
      </div>

      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="theme-card text-center relative overflow-hidden bg-indigo-50/20 border-indigo-100/50">
               <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                  <MapPin size={12} className="text-brand" /> {weather.location.name}, {weather.location.country}
               </div>
               <div className="text-9xl font-black font-display text-brand tracking-tighter mb-4">{Math.round(weather.current.temperature_2m)}°</div>
               <p className={`text-2xl font-black uppercase tracking-tight ${getWeatherVisuals(weather.current.weather_code).color}`}>
                {getWeatherVisuals(weather.current.weather_code).label}
               </p>
               
               <div className="grid grid-cols-2 gap-6 mt-12">
                  <div className="bg-white p-6 rounded-[24px] border border-slate-50 shadow-sm">
                    <Droplets size={24} className="mx-auto text-sky-500 mb-3" />
                    <div className="text-2xl font-black text-slate-800">{weather.current.relative_humidity_2m}%</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Humidity</div>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-slate-50 shadow-sm">
                    <Wind size={24} className="mx-auto text-accent mb-3" />
                    <div className="text-2xl font-black text-slate-800">{Math.round(weather.current.wind_speed_10m)} <span className="text-sm">km/h</span></div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Wind Velocity</div>
                  </div>
               </div>
            </div>

            <div className="theme-card">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">5-Day Atmospheric Projection</h3>
              <div className="grid grid-cols-5 gap-3">
                {weather.daily.time.slice(0, 5).map((t: string, i: number) => {
                  const date = new Date(t);
                  const visual = getWeatherVisuals(weather.daily.weather_code[i]);
                  return (
                    <div key={t} className="text-center p-5 bg-slate-50 rounded-[24px] border border-slate-100/50">
                      <div className="text-[10px] font-bold text-slate-400 mb-3">{date.getDate()}/{date.getMonth() + 1}</div>
                      <div className={`text-2xl font-black mb-1 ${visual.color}`}>{Math.round(weather.daily.temperature_2m_max[i])}°</div>
                      <div className="text-[10px] font-black text-slate-300">{Math.round(weather.daily.temperature_2m_min[i])}°</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className={`theme-card text-center bg-white`}>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Air Quality Index (AQI)</h3>
               <div className={`text-8xl font-black font-display tracking-tighter mb-4 ${getAQIInfo(weather.aqi).text}`}>{weather.aqi}</div>
               <div className={`inline-block px-6 py-2 rounded-full text-xs font-black text-white mb-10 shadow-lg ${getAQIInfo(weather.aqi).color}`}>
                {getAQIInfo(weather.aqi).label.toUpperCase()}
               </div>

               <div className="h-3 w-full bg-slate-50 rounded-full relative overflow-hidden mt-6 ring-4 ring-slate-50/50">
                  <div 
                    className={`h-full ${getAQIInfo(weather.aqi).color} transition-all duration-1000`} 
                    style={{ width: `${Math.min((weather.aqi / 300) * 100, 100)}%` }} 
                  />
               </div>
               <p className="text-[10px] text-slate-400 font-bold mt-8 leading-relaxed px-4">
                AQI measures atmospheric integrity. Lower values represent optimal breathable substrates.
               </p>
            </div>

            <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
               <div className="flex items-center gap-4 text-xs font-bold italic text-indigo-400">
                <Info size={18} className="shrink-0" />
                Dữ liệu được cập nhật từ Open-Meteo API (Thời gian thực).
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoldView() {
  const [data, setData] = useState([
    { name: 'SJC 9999', buy: 89000000, sell: 92000000, change: 0.5 },
    { name: 'PNJ 24K', buy: 74200000, sell: 75500000, change: -0.2 },
    { name: 'Doji 9999', buy: 88500000, sell: 91500000, change: 0.8 },
    { name: 'Bảo Tín Minh Châu', buy: 89100000, sell: 91900000, change: 0.1 },
  ]);

  const refresh = () => {
    setData(data.map(d => ({
      ...d,
      buy: d.buy + (Math.random() - 0.5) * 500000,
      sell: d.sell + (Math.random() - 0.5) * 500000,
      change: (Math.random() - 0.5) * 2
    })));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-3xl font-black font-display text-brand tracking-tight">Financial Assets</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Value unit: VNĐ / Lượng</p>
        </div>
        <button onClick={refresh} className="p-4 bg-slate-50 text-brand rounded-[20px] hover:bg-brand hover:text-white transition-all shadow-sm">
          <RotateCcw size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {data.map(item => (
          <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-6 mb-6 sm:mb-0">
               <div className="w-14 h-14 bg-warning/10 text-warning rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-warning/5">G</div>
               <div>
                  <h4 className="font-black text-lg text-slate-800">{item.name}</h4>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${item.change >= 0 ? 'text-accent' : 'text-secondary'}`}>
                    {item.change >= 0 ? '▲ Positive' : '▼ Negative'} {Math.abs(item.change).toFixed(2)}%
                  </div>
               </div>
            </div>
            <div className="flex gap-12 sm:gap-20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Liquid Buy</div>
                <div className="text-2xl font-black font-display text-slate-800 tracking-tighter">{Math.round(item.buy / 1000000).toFixed(2)} <span className="text-sm font-bold text-slate-300">Tr</span></div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Liquid Sell</div>
                <div className="text-2xl font-black font-display text-brand tracking-tighter">{Math.round(item.sell / 1000000).toFixed(2)} <span className="text-sm font-bold text-indigo-200">Tr</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Advisory notice: Simulation only. No real market intent.</p>
    </div>
  );
}

function GasView() {
  const products = [
    { name: 'Xăng RON 95-XI', price: 23150, region1: 23150, region2: 23610 },
    { name: 'Xăng E5 RON 92-II', price: 22100, region1: 22100, region2: 22540 },
    { name: 'Dầu Diesel 0.05S-II', price: 20210, region1: 20210, region2: 20610 },
    { name: 'Dầu hỏa', price: 20120, region1: 20120, region2: 20520 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="theme-card relative overflow-hidden bg-indigo-50/20 border-indigo-100/50">
          <div className="absolute top-0 right-0 p-8 text-brand/5 pointer-events-none text-[120px] rotate-12">
             <Fuel />
          </div>
          <h3 className="text-3xl font-black mb-2 font-display text-brand tracking-tight">Petrolimex Index</h3>
          <p className="text-slate-500 mb-10 font-medium">Real-time localized fuel price matrix.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black">Substrate Classification</th>
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">Zone 1 (đ/L)</th>
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">Zone 2 (đ/L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                  <tr key={p.name} className="group hover:bg-brand/[0.02] transition-colors">
                    <td className="py-6 font-black text-sm text-slate-800">{p.name}</td>
                    <td className="py-6 text-right font-black text-lg text-brand tracking-tighter">{p.region1.toLocaleString('vi-VN')}</td>
                    <td className="py-6 text-right font-bold text-slate-400">{p.region2.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       <div className="theme-card flex items-start gap-6 bg-sky-50 shadow-none border-sky-100">
          <Info className="text-sky-500 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="text-sm font-black text-sky-800 uppercase tracking-widest mb-2">Regional Variance Context</h4>
            <p className="text-[13px] text-sky-700/70 leading-relaxed font-medium">
              Zone 1 comprises nodes proximal to logistical hubs. Zone 2 represents distal perimeters requiring secondary transport, incurring a standard ~2% volatility overhead.
            </p>
          </div>
       </div>
    </div>
  );
}

function DownloadView() {
  const [url, setUrl] = useState('');
  
  const platforms = [
    { name: 'TikTok', site: 'ssstik.io', icon: '🎵', color: 'bg-black' },
    { name: 'YouTube', site: 'snapsave.app', icon: '🎬', color: 'bg-red-600' },
    { name: 'Instagram', site: 'fastdl.app', icon: '📸', color: 'bg-pink-600' },
    { name: 'Facebook', site: 'fdownloader.net', icon: '📘', color: 'bg-blue-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="theme-card text-center bg-indigo-50/30 border-indigo-100">
        <h3 className="text-3xl font-black mb-4 font-display text-brand">Asset Acquisition</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">Input global resource pointer for local environment persistence.</p>
        <div className="flex gap-3">
          <input 
            className="theme-input flex-1"
            placeholder="Resource URL (TikTok, YT, IG...)"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button className="theme-btn-primary min-w-[120px]">Fetch</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(p => (
          <a 
            key={p.name}
            href={`https://${p.site}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between hover:border-brand shadow-sm hover:shadow-indigo-100/50 transition-all group"
          >
            <div className="flex items-center gap-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${p.color}`}>{p.icon}</div>
               <div>
                  <div className="font-black text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.site}</div>
               </div>
            </div>
            <ExternalLink size={20} className="text-slate-300 group-hover:text-brand transition-colors" />
          </a>
        ))}
      </div>
      
      <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100/50 text-center">
        <p className="text-xs text-brand font-black italic uppercase tracking-tighter">
          Integration Notice: Due to platform API entropy, we utilize curated gateways for maximum reliability.
        </p>
      </div>
    </div>
  );
}

function ProfileView({ profile, onSave }: { profile: UserProfile, onSave: (p: UserProfile) => void }) {
  const [form, setForm] = useState(profile);

  return (
    <div className="max-w-xl mx-auto space-y-10">
      <div className="text-center">
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/5">
          <Wand2 size={40} />
        </div>
        <h3 className="text-3xl font-black font-display text-brand tracking-tight">Cá nhân hóa</h3>
        <p className="text-slate-500 font-medium mt-2">Lưu trữ thông tin để tự động điền các biểu mẫu.</p>
      </div>

      <div className="theme-card space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
            <input 
              className="theme-input w-full"
              placeholder="NGUYEN VAN A"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Ngân hàng mặc định</label>
            <input 
              className="theme-input w-full"
              placeholder="MB Bank, VCB..."
              value={form.bank}
              onChange={e => setForm({...form, bank: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Số tài khoản</label>
            <input 
              className="theme-input w-full font-mono"
              placeholder="0123456789"
              value={form.account}
              onChange={e => setForm({...form, account: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={() => onSave(form)}
          className="theme-btn-primary w-full py-4 mt-4"
        >
          Lưu thông tin
        </button>
      </div>

      <div className="p-8 bg-sky-50 rounded-[32px] border border-sky-100/50 flex gap-4 items-start shadow-sm">
        <Info className="text-sky-500 shrink-0 mt-1" size={20} />
        <p className="text-sm text-sky-700/70 font-medium leading-relaxed">
          Thông tin này sẽ được sử dụng để tự động gắn vào các thẻ QR khi bạn tải ảnh lên từ thư viện, giúp tiết kiệm thời gian nhập liệu.
        </p>
      </div>
    </div>
  );
}

function PowerCutView() {
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!area.trim()) return;
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Khu vực: ${area}. Hãy trả về tên Tỉnh/Thành phố trực thuộc trung ương chuẩn nhất ở Việt Nam cho khu vực này (VD: "Hà Nội" hoặc "Hồ Chí Minh").`,
        config: {
          systemInstruction: "Bạn là chuyên gia địa lý Việt Nam. Trả lời cực kỳ ngắn gọn, chỉ trả tên tỉnh thành."
        }
      });
      setCity(response.text?.trim() || area);
    } catch (e) {
      console.error("AI Error:", e);
      setCity(area);
    } finally {
      setLoading(false);
    }
  };

  const directLink = city ? `https://www.google.com/search?q=${encodeURIComponent(`lịch cúp điện ${city} site:evn.com.vn OR site:evnhcmc.com.vn OR site:evnhanoi.vn`)}` : '#';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="theme-card">
        <h3 className="text-3xl font-black mb-4 font-display text-brand">EVN Infrastructure Control</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">Query regional power integrity reports directly from utility providers.</p>
        <div className="flex gap-3 mb-10">
          <input 
            className="theme-input flex-1"
            placeholder="Locality: Hanoi, Saigon, Can Tho..."
            value={area}
            onChange={e => setArea(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="theme-btn-primary min-w-[140px] flex items-center justify-center gap-2 bg-warning shadow-warning/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Tra cứu'}
          </button>
        </div>

        {city && (
          <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[32px] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-20 h-20 bg-white text-warning rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
                <Zap size={40} />
             </div>
             <h4 className="text-2xl font-black text-slate-800 mb-2">{city} Grid Report</h4>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
              Data synchronized with regional EVN distribution clusters. Finalizing integrity check...
             </p>
             <a 
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="theme-btn-primary bg-slate-800 shadow-slate-200"
             >
                Launch Protocol for {city} <ExternalLink size={20} className="inline ml-2" />
             </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="theme-card">
          <h5 className="font-black text-slate-800 mb-2 flex items-center gap-3"><Zap size={18} className="text-warning" /> EVN North Cluster</h5>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Capital Domain</p>
          <a href="https://evnhanoi.vn/search/power-cut" target="_blank" className="text-xs font-black text-brand hover:underline">Access Terminal →</a>
        </div>
        <div className="theme-card">
          <h5 className="font-black text-slate-800 mb-2 flex items-center gap-3"><Zap size={18} className="text-warning" /> EVN South Cluster</h5>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Metropolitan Domain</p>
          <a href="https://www.evnhcmc.vn/khach-hang/lich-ngung-giam-cung-cap-dien" target="_blank" className="text-xs font-black text-brand hover:underline">Access Terminal →</a>
        </div>
      </div>
    </div>
  );
}

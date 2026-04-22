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
// Gemini removed per request

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
  const user = auth?.currentUser;
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

// --- Translations ---
const translations = {
  vi: {
    nav_home: 'Trang chủ',
    nav_bank: 'Bank & Nợ',
    nav_food: 'Gợi ý món ăn',
    nav_weather: 'Thời tiết',
    nav_gold: 'Giá vàng',
    nav_gas: 'Giá xăng',
    nav_download: 'Tải video',
    nav_powercut: 'Lịch cúp điện',
    nav_profile: 'Cá nhân',
    hub_title: 'LifeHub v2.0',
    hub_desc: 'Trung tâm tiện ích đánh bóng cho hiệu quả hiện đại.',
    login_google: 'Đăng nhập Google',
    logout: 'Đăng xuất',
    cloud_disabled: 'Lưu trữ đám mây chưa bật',
    toolbox: 'Hộp công cụ',
    auth_required: 'Yêu cầu đăng nhập',
    auth_desc_bank: 'Bạn cần đăng nhập để quản lý nợ và mã QR an toàn trên đám mây.',
    auth_desc_profile: 'Cá nhân hóa trải nghiệm và lưu trữ an toàn.',
    login_now: 'Đăng nhập ngay',
    tab_debt: 'Quản lý nợ',
    tab_qr: 'QR Ngân hàng',
    add_note: 'Thêm ghi chú',
    person_name: 'Tên người',
    amount: 'Số tiền (VNĐ)',
    type_lend: 'Cho vay',
    type_borrow: 'Đi vay',
    note_extra: 'Ghi chú thêm',
    add_data: 'Thêm dữ liệu',
    registry_empty: 'Danh sách trống',
    no_metadata: 'Không có dữ liệu',
    add_qr: 'Thêm mã QR',
    quick_import: 'Nhập nhanh',
    pick_library: 'Chọn từ thư viện',
    supported_formats: '(Hỗ trợ PNG, JPG)',
    or_manual: 'Hoặc thủ công',
    bank_institution: 'Ngân hàng',
    qr_url: 'Đường dẫn ảnh QR',
    acc_id: 'Số tài khoản',
    id_holder: 'Chủ tài khoản',
    establish_qr: 'Tạo mã QR',
    no_crypto: 'Chưa có mã QR nào',
    id_no: 'STK',
    bearer: 'Chủ TK',
    cuisine_title: 'CulinAI Laboratory',
    cuisine_desc: 'Nhập các nguyên liệu bạn có để AI gợi ý công thức món ăn.',
    substrate: 'Nguyên liệu: Trứng, Cà chua, Hành lá, Thịt bò...',
    synthesizing: 'Đang tổng hợp...',
    generate_recipe: 'Gợi ý món ăn',
    weather_search: 'Nhập địa điểm (vd: Hà Nội, Quận 1...)',
    weather_btn: 'Tra cứu',
    weather_not_found: 'Không tìm thấy địa điểm này.',
    weather_error: 'Lỗi khi tải dữ liệu thời tiết.',
    humidity: 'Độ ẩm',
    wind_velocity: 'Tốc độ gió',
    forecast: 'Dự báo 5 ngày',
    aqi_title: 'Chỉ số chất lượng không khí (AQI)',
    aqi_desc: 'Chỉ số đo mức độ ô nhiễm không khí. Giá trị thấp nghĩa là không khí trong lành.',
    realtime_notice: 'Dữ liệu từ OpenWeatherMap & WAQI.',
    financial_assets: 'Tài sản tài chính',
    value_unit: 'Đơn vị: VNĐ / Lượng',
    liquid_buy: 'Giá mua',
    liquid_sell: 'Giá bán',
    market_notice: 'Thông báo: Dữ liệu mô phỏng, không có giá trị giao dịch.',
    petrol_index: 'Chỉ số xăng dầu',
    fuel_desc: 'Bảng giá xăng dầu cục bộ theo thời gian thực.',
    fuel_class: 'Loại nhiên liệu',
    zone1: 'Vùng 1 (đ/L)',
    zone2: 'Vùng 2 (đ/L)',
    fuel_notice_title: 'Bối cảnh biến động vùng',
    fuel_notice_desc: 'Vùng 1 gần kho đầu mối. Vùng 2 ở xa hơn nên giá cao hơn khoảng 2%.',
    asset_acq: 'Tải tài nguyên',
    asset_desc: 'Nhập liên kết để tải video hoặc tài nguyên.',
    resource_url: 'Đường dẫn (TikTok, YT, IG...)',
    fetch: 'Tải về',
    download_notice: 'Lưu ý: Sử dụng các cổng trung gian để đảm bảo tin cậy.',
    personalize: 'Cá nhân hóa',
    personalize_desc: 'Lưu trữ thông tin để tự động điền các biểu mẫu.',
    full_name: 'Họ và tên',
    default_bank: 'Ngân hàng mặc định',
    save_info: 'Lưu thông tin',
    profile_info_notice: 'Thông tin này sẽ tự động gắn vào mã QR khi bạn tải ảnh lên.',
    evn_title: 'Kiểm soát hạ tầng EVN',
    evn_desc: 'Tra cứu lịch cúp điện từ nhà cung cấp dịch vụ.',
    locality: 'Địa phương: Hà Nội, Sài Gòn, Cần Thơ...',
    launch_protocol: 'Truy cập lịch cúp điện',
    grid_report: 'Báo cáo lưới điện',
    evn_north: 'EVN Miền Bắc',
    evn_south: 'EVN Miền Nam',
    domain_capital: 'Khu vực Thủ đô/Miền Bắc',
    domain_metro: 'Khu vực Thành phố/Miền Nam',
    ai_food_prompt: (ing: string) => `Nguyên liệu đang có: ${ing}. Hãy gợi ý 3-5 món ăn ngon, kèm theo công thức ngắn gọn và lưu ý khi nấu. Trình bày bằng tiếng Việt, định dạng Markdown rõ ràng.`,
    ai_food_system: 'Bạn là một đầu bếp chuyên gia người Việt Nam, thân thiện và sáng tạo.',
    ai_power_prompt: (area: string) => `Khu vực: ${area}. Hãy trả về tên Tỉnh/Thành phố trực thuộc trung ương chuẩn nhất ở Việt Nam cho khu vực này (VD: "Hà Nội" hoặc "Hồ Chí Minh").`,
    ai_power_system: 'Bạn là chuyên gia địa lý Việt Nam. Trả lời cực kỳ ngắn gọn, chỉ trả tên tỉnh thành.',
    nav_search: 'Tìm kiếm',
    search_explore: 'Khám phá thế giới',
    search_desc: 'Tìm kiếm địa điểm, quán ăn và thông tin từ Google.',
    google_search: 'Tìm kiếm Google',
    google_maps: 'Bản đồ Google',
    search_results: 'Kết quả tìm kiếm',
    map_results: 'Địa điểm tìm thấy',
    rating: 'Đánh giá',
    model_deepseek: 'DeepSeek (Beeknoee)',
    model_mistral: 'Mistral AI',
    select_model: 'Chọn mô hình AI',
  },
  en: {
    nav_home: 'Home',
    nav_bank: 'Bank & Debt',
    nav_food: 'AI Food',
    nav_weather: 'Weather',
    nav_gold: 'Gold Price',
    nav_gas: 'Fuel Price',
    nav_download: 'Downloader',
    nav_powercut: 'Power Grid',
    nav_profile: 'Profile',
    hub_title: 'LifeHub v2.0',
    hub_desc: 'Polished utility hub for modern efficiency.',
    login_google: 'Sign in with Google',
    logout: 'Sign out',
    cloud_disabled: 'Cloud Storage Disabled',
    toolbox: 'Toolbox',
    auth_required: 'Authentication Required',
    auth_desc_bank: 'You need to sign in to manage debts and QR codes securely in the cloud.',
    auth_desc_profile: 'Personalize your experience and save securely.',
    login_now: 'Sign in now',
    tab_debt: 'Debt Management',
    tab_qr: 'Bank QR',
    add_note: 'Add Note',
    person_name: 'Person Name',
    amount: 'Amount (VNĐ)',
    type_lend: 'Lend',
    type_borrow: 'Borrow',
    note_extra: 'Extra Note',
    add_data: 'Add Data',
    registry_empty: 'Registry Empty',
    no_metadata: 'No metadata',
    add_qr: 'Add QR',
    quick_import: 'Quick Import',
    pick_library: 'Pick from Library',
    supported_formats: '(PNG, JPG supported)',
    or_manual: 'Or Manual',
    bank_institution: 'Bank Institution',
    qr_url: 'QR Image URL',
    acc_id: 'Account ID',
    id_holder: 'ID Holder',
    establish_qr: 'Establish QR',
    no_crypto: 'No cryptographics detected',
    id_no: 'ID N°',
    bearer: 'Bearer',
    cuisine_title: 'CulinAI Laboratory',
    cuisine_desc: 'Input available substrate for neural recipe synthesis.',
    substrate: 'Substrate: Eggs, Tomato, Scallions, Minced Beef...',
    synthesizing: 'Synthesizing...',
    generate_recipe: 'Generate Recipe',
    weather_search: 'Enter location (e.g. London, Tokyo...)',
    weather_btn: 'Search',
    weather_not_found: 'Location not found.',
    weather_error: 'Error loading weather data.',
    humidity: 'Humidity',
    wind_velocity: 'Wind Velocity',
    forecast: '5-Day Forecast',
    aqi_title: 'Air Quality Index (AQI)',
    aqi_desc: 'Measures air pollution levels. Lower values indicate cleaner air.',
    realtime_notice: 'Data from OpenWeatherMap & WAQI.',
    financial_assets: 'Financial Assets',
    value_unit: 'Unit: VNĐ / Tael',
    liquid_buy: 'Buy Price',
    liquid_sell: 'Sell Price',
    market_notice: 'Notice: Simulated data, no trading value.',
    petrol_index: 'Petrolimex Index',
    fuel_desc: 'Real-time localized fuel price matrix.',
    fuel_class: 'Fuel Type',
    zone1: 'Zone 1 (đ/L)',
    zone2: 'Zone 2 (đ/L)',
    fuel_notice_title: 'Regional Variance',
    fuel_notice_desc: 'Zone 1 is proximal to hubs. Zone 2 is distal, incurring ~2% overhead.',
    asset_acq: 'Asset Acquisition',
    asset_desc: 'Input global resource pointer for persistence.',
    resource_url: 'Resource URL (TikTok, YT, IG...)',
    fetch: 'Fetch',
    download_notice: 'Note: Uses curated gateways for reliability.',
    personalize: 'Personalization',
    personalize_desc: 'Store information to auto-fill forms.',
    full_name: 'Full Name',
    default_bank: 'Default Bank',
    save_info: 'Save Profile',
    profile_info_notice: 'This info will be automatically attached to your QR uploads.',
    evn_title: 'Infrastructure Control',
    evn_desc: 'Query regional power grid reports.',
    locality: 'Locality: Hanoi, Saigon, Can Tho...',
    launch_protocol: 'Launch Protocol',
    grid_report: 'Grid Report',
    evn_north: 'EVN North',
    evn_south: 'EVN South',
    domain_capital: 'Capital Domain',
    domain_metro: 'Metropolitan Domain',
    ai_food_prompt: (ing: string) => `Ingredients: ${ing}. Suggest 3-5 recipes with concise instructions. Present in English, Markdown format.`,
    ai_food_system: 'You are an expert chef, creative and helpful.',
    ai_power_prompt: (area: string) => `Area: ${area}. Return the most accurate Province/City name in Vietnam for this area.`,
    ai_power_system: 'You are a Vietnam geography expert. Respond briefly with just the city name.',
    nav_search: 'Search',
    search_explore: 'Explore the World',
    search_desc: 'Find places, food, and info from Google ecosystem.',
    google_search: 'Google Search',
    google_maps: 'Google Maps',
    search_results: 'Search Results',
    map_results: 'Local results',
    rating: 'Rating',
    model_deepseek: 'DeepSeek (Beeknoee)',
    model_mistral: 'Mistral AI',
    select_model: 'Select AI Model',
  },
  zh: {
    nav_home: '首页',
    nav_bank: '银行与债务',
    nav_food: 'AI 美食',
    nav_weather: '天气',
    nav_gold: '黄金价格',
    nav_gas: '汽油价格',
    nav_download: '下载器',
    nav_powercut: '电网状态',
    nav_profile: '个人中心',
    hub_title: 'LifeHub v2.0',
    hub_desc: '现代效率的精美实用中心。',
    login_google: '谷歌登录',
    logout: '退出登录',
    cloud_disabled: '云存储已禁用',
    toolbox: '工具箱',
    auth_required: '需要身份验证',
    auth_desc_bank: '您需要登录才能在云端安全地管理债务和二维码。',
    auth_desc_profile: '个性化您的体验并安全存储。',
    login_now: '立即登录',
    tab_debt: '债务管理',
    tab_qr: '银行二维码',
    add_note: '添加备注',
    person_name: '姓名',
    amount: '金额 (VNĐ)',
    type_lend: '借出',
    type_borrow: '借入',
    note_extra: '额外备注',
    add_data: '添加数据',
    registry_empty: '列表为空',
    no_metadata: '无数据',
    add_qr: '添加二维码',
    quick_import: '快速导入',
    pick_library: '从相册选择',
    supported_formats: '(支持 PNG, JPG)',
    or_manual: '或手动输入',
    bank_institution: '所属银行',
    qr_url: '二维码图片链接',
    acc_id: '账号',
    id_holder: '持卡人',
    establish_qr: '创建二维码',
    no_crypto: '未检测到二维码',
    id_no: '账号',
    bearer: '持有人',
    cuisine_title: 'AI 烹饪实验室',
    cuisine_desc: '输入现有食材，让 AI 生成菜谱。',
    substrate: '食材：鸡蛋、西红柿、葱、牛肉...',
    synthesizing: '正在生成...',
    generate_recipe: '生成菜谱',
    weather_search: '输入城市（如：北京、东京、胡志明市...）',
    weather_btn: '查询',
    weather_not_found: '未找到该位置。',
    weather_error: '加载天气数据出错。',
    humidity: '湿度',
    wind_velocity: '风速',
    forecast: '5天预报',
    aqi_title: '空气质量指数 (AQI)',
    aqi_desc: '测量空气污染程度。数值越低表示空气越清新。',
    realtime_notice: '数据来自 OpenWeatherMap 和 WAQI。',
    financial_assets: '金融资产',
    value_unit: '单位：越南盾 / 两',
    liquid_buy: '买入价',
    liquid_sell: '卖出价',
    market_notice: '注意：模拟数据，无交易价值。',
    petrol_index: '汽油指数',
    fuel_desc: '实时本地化燃油价格矩阵。',
    fuel_class: '燃油类型',
    zone1: '区域 1 (đ/L)',
    zone2: '区域 2 (đ/L)',
    fuel_notice_title: '区域差异',
    fuel_notice_desc: '区域 1 靠近物流中心。区域 2 较远，有约 2% 的额外成本。',
    asset_acq: '资源获取',
    asset_desc: '输入链接以保存视频或资源。',
    resource_url: '资源链接 (TikTok, YT, IG...)',
    fetch: '获取',
    download_notice: '注意：使用精心挑选的网关以确保可靠性。',
    personalize: '个性化',
    personalize_desc: '存储信息以自动填写表单。',
    full_name: '姓名',
    default_bank: '默认银行',
    save_info: '保存个人资料',
    profile_info_notice: '此信息将自动附加到您上传的二维码中。',
    evn_title: '基础设施控制',
    evn_desc: '查询区域电网报告。',
    locality: '地区：河内、西贡、芹苴...',
    launch_protocol: '启动查询',
    grid_report: '电网报告',
    evn_north: '北方电力',
    evn_south: '南方电力',
    domain_capital: '首都/北方区域',
    domain_metro: '都市/南方区域',
    ai_food_prompt: (ing: string) => `现有食材：${ing}。请推荐 3-5 道菜，并附上简短的说明。请用中文呈现，采用 Markdown 格式。`,
    ai_food_system: '你是一位专业的厨师，富有创意且乐于助人。',
    ai_power_prompt: (area: string) => `区域：${area}。请返回越南该地区最准确的省/市名称（如 “河内” 或 “胡志明市”）。`,
    ai_power_system: '你是一位越南地理专家。请简短回答，仅提供城市名称。',
    nav_search: '搜索',
    search_explore: '探索世界',
    search_desc: '从谷歌生态系统中寻找地点、美食和信息。',
    google_search: '谷歌搜索',
    google_maps: '谷歌地图',
    search_results: '搜索结果',
    map_results: '本地结果',
    rating: '评分',
    model_deepseek: 'DeepSeek (Beeknoee)',
    model_mistral: 'Mistral AI',
    select_model: '选择 AI 模型',
  }
};

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
  const [lang, setLang] = useState<'vi' | 'en' | 'zh'>('vi');
  const [activeView, setActiveView] = useState('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: '', bank: '', account: '' });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const t = (key: keyof typeof translations.vi): any => translations[lang][key] || translations.vi[key];

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setProfile({ name: '', bank: '', account: '' });
      }
    });

    // Validate connection to Firestore
    const testConnection = async () => {
      if (!db) return;
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
    if (!user || !db) return;
    
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

  const handleSignIn = async () => {
    try {
      if (!auth) {
        alert("Firebase is not initialized. Please check your config.");
        return;
      }
      await signIn();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn("User closed the sign-in popup.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Domain Not Authorized: Please add this domain to authorized domains in Firebase Console.");
      } else {
        console.error("Authentication Error:", error);
        alert(`Login failed: ${error.message}`);
      }
    }
  };
  
  const views = [
    { id: 'home', title: t('nav_home'), icon: <LayoutDashboard size={20} /> },
    { id: 'bank', title: t('nav_bank'), icon: <Wallet size={20} /> },
    { id: 'food', title: t('nav_food'), icon: <Utensils size={20} /> },
    { id: 'weather', title: t('nav_weather'), icon: <CloudSun size={20} /> },
    { id: 'gold', title: t('nav_gold'), icon: <Coins size={20} /> },
    { id: 'gas', title: t('nav_gas'), icon: <Fuel size={20} /> },
    { id: 'download', title: t('nav_download'), icon: <Download size={20} /> },
    { id: 'search', title: t('nav_search'), icon: <Search size={20} /> },
    { id: 'powercut', title: t('nav_powercut'), icon: <Zap size={20} /> },
    { id: 'profile', title: t('nav_profile'), icon: <Wand2 size={20} /> },
  ];

  const bottomViews = [
    { id: 'home', icon: <LayoutDashboard size={22} /> },
    { id: 'bank', icon: <Wallet size={22} /> },
    { id: 'food', icon: <Utensils size={22} /> },
    { id: 'weather', icon: <CloudSun size={22} /> },
    { id: 'profile', icon: <Wand2 size={22} /> },
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
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display cursor-pointer" onClick={() => setActiveView('home')}>
              <span className="text-brand">Life</span>Hub
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">Open-source Hub</p>
          </div>
          <div className="flex flex-col gap-1">
            {(['vi', 'en', 'zh'] as const).map(l => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition-all ${lang === l ? 'bg-brand text-white border-brand' : 'text-slate-300 border-slate-200 hover:border-brand/30'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {!user ? (
            <div className="px-4 py-6 mb-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">{t('cloud_disabled')}</p>
              <button 
                onClick={handleSignIn}
                className="theme-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={14} /> {t('login_google')}
              </button>
            </div>
          ) : (
            <div className="px-4 py-4 mb-4 bg-indigo-50/20 rounded-3xl border border-indigo-100/50 flex items-center gap-3">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-800 truncate">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline">{t('logout')}</button>
              </div>
            </div>
          )}
          
          <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-widest font-black">{t('toolbox')}</p>
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
        <header className="fixed top-0 right-0 left-0 md:left-[280px] h-[64px] bg-bg/80 backdrop-blur-xl border-b border-slate-100 z-50 flex items-center px-4 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="ml-4 md:ml-0 bg-indigo-50 text-brand px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
            {currentTitle}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!user ? (
               <button onClick={handleSignIn} className="bg-brand text-white px-3 py-1.5 rounded-xl text-[10px] font-bold md:hidden">
                 {t('login_google')}
               </button>
            ) : (
               <img src={user.photoURL || ''} className="w-8 h-8 rounded-xl border border-white shadow-sm md:hidden" alt="User" />
            )}
          </div>
        </header>

        <div className="pt-[84px] px-3 md:px-6 pb-28 md:pb-12 max-w-5xl mx-auto">
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
                {activeView === 'home' && <HomeView onNavigate={setActiveView} t={t} />}
                {activeView === 'bank' && (
                  user ? <BankView profile={profile} user={user} t={t} lang={lang} /> : (
                    <div className="text-center py-24">
                      <Wallet size={64} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-2xl font-black text-slate-400">{t('auth_required')}</h3>
                      <p className="text-slate-400 mb-8">{t('auth_desc_bank')}</p>
                      <button onClick={handleSignIn} className="theme-btn-primary px-8 py-4">{t('login_now')}</button>
                    </div>
                  )
                )}
                {activeView === 'food' && <FoodView t={t} />}
                {activeView === 'weather' && <WeatherView t={t} lang={lang} />}
                {activeView === 'gold' && <GoldView t={t} />}
                {activeView === 'gas' && <GasView t={t} />}
                {activeView === 'download' && <DownloadView t={t} />}
                {activeView === 'search' && <SearchView t={t} />}
                {activeView === 'powercut' && <PowerCutView t={t} />}
                {activeView === 'profile' && (
                  user ? <ProfileView profile={profile} onSave={saveProfile} t={t} /> : (
                    <div className="text-center py-24">
                      <Wand2 size={64} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-2xl font-black text-slate-400">{t('auth_required')}</h3>
                      <p className="text-slate-400 mb-8">{t('auth_desc_profile')}</p>
                      <button onClick={handleSignIn} className="theme-btn-primary px-8 py-4">{t('login_now')}</button>
                    </div>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 py-3 z-[100] md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-around">
          {bottomViews.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`p-3 rounded-2xl transition-all ${activeView === view.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400'}`}
            >
              {view.icon}
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl text-slate-400"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>
    </div>
  );
}

// --- SUB-VIEWS ---

function HomeView({ onNavigate, t }: { onNavigate: (v: string) => void, t: any }) {
  const cards = [
    { id: 'bank', title: t('nav_bank'), desc: t('nav_bank') + ' ' + t('registry_empty'), color: 'bg-brand/10 text-brand', icon: <Wallet /> },
    { id: 'food', title: t('nav_food'), desc: t('cuisine_desc'), color: 'bg-secondary/10 text-secondary', icon: <Utensils /> },
    { id: 'weather', title: t('nav_weather'), desc: t('nav_weather'), color: 'bg-sky-500/10 text-sky-500', icon: <CloudSun /> },
    { id: 'gold', title: t('nav_gold'), desc: t('financial_assets'), color: 'bg-warning/10 text-warning', icon: <Coins /> },
    { id: 'gas', title: t('nav_gas'), desc: t('petrol_index'), color: 'bg-rose-500/10 text-rose-500', icon: <Fuel /> },
    { id: 'download', title: t('nav_download'), desc: t('asset_acq'), color: 'bg-purple-500/10 text-purple-500', icon: <Download /> },
    { id: 'search', title: t('nav_search'), desc: t('search_desc'), color: 'bg-emerald-500/10 text-emerald-500', icon: <Search /> },
  ];

  return (
    <div className="text-center md:text-left">
      <div className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-7xl font-black font-display tracking-tight text-brand mb-4 leading-[1.1]">
          {t('hub_title')}
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto md:mx-0">
          {t('hub_desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
        {cards.map(card => (
          <button 
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className="group theme-card flex flex-col items-center md:items-start text-center md:text-left !p-6 md:!p-8 h-full shadow-sm hover:shadow-xl transition-all"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-4 md:mb-6 transition-transform group-hover:scale-110 ${card.color}`}>
              {card.icon}
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">{card.title}</h3>
            <p className="text-slate-400 text-xs md:text-sm font-medium line-clamp-2 md:line-clamp-none leading-relaxed tracking-tight">{card.desc}</p>
          </button>
        ))}
        <button 
          onClick={() => onNavigate('powercut')}
          className="group theme-card col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col items-start text-left"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl mb-6 bg-warning/10 text-warning transition-transform group-hover:scale-110">
            <Zap />
          </div>
          <h3 className="text-xl font-bold font-display mb-2">{t('nav_powercut')}</h3>
          <p className="text-sm text-slate-400 font-medium">{t('evn_desc')}</p>
        </button>
      </div>
    </div>
  );
}

function BankView({ profile, user, t, lang }: { profile: UserProfile, user: User, t: any, lang: string }) {
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
        date: new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US'),
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
        name: qrForm.name || `${t('tab_qr')} ${qrs.length + 1}`,
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
          name: profile.bank || `${t('tab_qr')} ${qrs.length + 1}`,
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
        >{t('tab_debt')}</button>
        <button 
          onClick={() => setTab('qr')}
          className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${tab === 'qr' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
        >{t('tab_qr')}</button>
      </div>

      {tab === 'debts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="theme-card">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-brand"><Plus size={18} /> {t('add_note')}</h3>
              <div className="space-y-4">
                <input 
                  className="theme-input" 
                  placeholder={t('person_name')}
                  value={debtForm.person}
                  onChange={e => setDebtForm({...debtForm, person: e.target.value})}
                />
                <input 
                  className="theme-input" 
                  type="number"
                  placeholder={t('amount')}
                  value={debtForm.amount}
                  onChange={e => setDebtForm({...debtForm, amount: e.target.value})}
                />
                <select 
                  className="theme-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.25rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-12"
                  value={debtForm.type}
                  onChange={e => setDebtForm({...debtForm, type: e.target.value as any})}
                >
                  <option value="cho_vay">{t('type_lend')}</option>
                  <option value="di_vay">{t('type_borrow')}</option>
                </select>
                <input 
                  className="theme-input" 
                  placeholder={t('note_extra')}
                  value={debtForm.note}
                  onChange={e => setDebtForm({...debtForm, note: e.target.value})}
                />
                <button 
                  onClick={addDebt}
                  className="theme-btn-primary w-full"
                >{t('add_data')}</button>
              </div>
            </div>
            
            <div className="theme-card">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Market Pulse</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Asset Velocity:</span>
                  <span className="text-brand font-black">{totalChoVay.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Debt Pressure:</span>
                  <span className="text-secondary font-black">{totalDiVay.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} đ</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-tighter">Net Capital:</span>
                  <span className={`text-xl font-black ${(totalChoVay - totalDiVay) >= 0 ? 'text-accent' : 'text-secondary'}`}>
                    {(totalChoVay - totalDiVay).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} đ
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
                  <p className="text-slate-400 font-bold">{t('registry_empty')}</p>
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
                        <p className="text-sm font-medium text-slate-400 mt-1">{debt.note || t('no_metadata')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`text-xl font-black ${(debt.type === 'cho_vay' || debt.type as any === 'cho_vay') ? 'text-brand' : 'text-secondary'}`}>
                        {debt.type === 'cho_vay' ? '+' : '-'}{debt.amount.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
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
              <h3 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-widest"><Plus size={18} className="text-brand" /> {t('add_qr')}</h3>
              
              {/* Direct Upload Section */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('quick_import')}</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-[32px] bg-white hover:bg-brand/5 hover:border-brand cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <CloudSun className="text-indigo-200 group-hover:text-brand mb-2" size={32} />
                    <p className="text-[10px] font-black text-slate-400 group-hover:text-brand text-center px-4">{t('pick_library')}<br/>{t('supported_formats')}</p>
                  </div>
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="relative mb-8 text-center px-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-[#fdfdfd] px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('or_manual')}</span>
              </div>

              <div className="space-y-4">
                <input 
                  className="theme-input w-full text-sm" 
                  placeholder={t('bank_institution')}
                  value={qrForm.name}
                  onChange={e => setQrForm({...qrForm, name: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm" 
                  placeholder={t('qr_url')}
                  value={qrForm.image}
                  onChange={e => setQrForm({...qrForm, image: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm font-mono" 
                  placeholder={t('acc_id')}
                  value={qrForm.number}
                  onChange={e => setQrForm({...qrForm, number: e.target.value})}
                />
                <input 
                  className="theme-input w-full text-sm uppercase" 
                  placeholder={t('id_holder')}
                  value={qrForm.holder}
                  onChange={e => setQrForm({...qrForm, holder: e.target.value})}
                />
                <button 
                  onClick={addQR}
                  className="theme-btn-primary w-full py-4 mt-2"
                >{t('establish_qr')}</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {qrs.length === 0 ? (
               <div className="col-span-full text-center py-24 bg-white/50 rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[24px] flex items-center justify-center mb-6">
                    <QrCode size={40} />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('no_crypto')}</p>
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
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('id_no')}</span>
                      <span className="font-black text-brand text-sm font-mono tracking-tight">{qr.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('bearer')}</span>
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

function FoodView({ t }: { t: any }) {
  const [ingredients, setIngredients] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'glm-4.7-flash' | 'qwen-3-235b' | 'gpt-oss-120b' | 'deepseek-chat' | 'mistral'>('glm-4.7-flash');

  const getSuggestion = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const isMistral = model === 'mistral';
      const endpoint = isMistral ? '/api/ai/mistral' : '/api/ai/beeknoee';
      const aiModel = isMistral ? 'mistral-large-2512' : ( 
        model === 'qwen-3-235b' ? 'qwen-3-235b-a22b-instruct-2507' : 
        model === 'gpt-oss-120b' ? 'openai/gpt-oss-120b' : model
      );
      const response = await axios.post(endpoint, {
        model: aiModel,
        messages: [
          { role: 'system', content: t('ai_food_system') },
          { role: 'user', content: t('ai_food_prompt')(ingredients) }
        ],
        temperature: 0.7
      });
      setResult(response.data.choices[0].message.content || t('no_metadata'));
    } catch (e: any) {
      console.error("AI Error:", e);
      if (e.response?.status === 401) {
        setResult("⚠️ Unauthorized: Your API key for " + model + " seems invalid or expired.");
      } else if (e.response?.status === 429) {
        setResult("⚠️ " + (e.response?.data?.error || "Rate limit reached. Please wait a moment."));
      } else if (e.response?.status === 524 || e.code === 'ECONNABORTED') {
        setResult("⚠️ AI Timeout: Server took too long to respond. The AI might be overloaded, please try again with simpler ingredients.");
      } else {
        const errorDetail = e.response?.data?.error?.message || e.response?.data?.error || e.message;
        setResult(`⚠️ Error: ${errorDetail}`);
      }
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
        <h3 className="text-3xl font-black mb-4 font-display text-brand">{t('cuisine_title')}</h3>
        
        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('select_model')}</label>
          <div className="flex flex-wrap gap-2">
            {(['glm-4.7-flash', 'qwen-3-235b', 'gpt-oss-120b', 'deepseek-chat', 'mistral'] as const).map(m => (
              <button 
                key={m}
                onClick={() => setModel(m)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${model === m ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {m.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-8 leading-loose font-medium">{t('cuisine_desc')}</p>
        <textarea 
          className="theme-input min-h-[160px] mb-6 font-medium text-base leading-relaxed"
          placeholder={t('substrate')}
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
        />
        <button 
          onClick={getSuggestion}
          disabled={loading || !ingredients.trim()}
          className="theme-btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={22} />}
          {loading ? t('synthesizing') : t('generate_recipe')}
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

function WeatherView({ t, lang }: { t: any, lang: string }) {
  const [addr, setAddr] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchWeather = async () => {
    if (!addr.trim()) return;
    setLoading(true);
    setWeather(null);
    try {
      // Step 1: Geocoding via Internal Proxy
      const { data: geoData } = await axios.get(`/api/geocoding?q=${encodeURIComponent(addr)}`);
      
      if (!geoData || geoData.length === 0) {
        alert(t('weather_not_found'));
        return;
      }

      const { lat, lon, name, country } = geoData[0];

      // Step 2: Weather & AQI
      const [{ data: wData }, { data: aData }] = await Promise.all([
        axios.get(`/api/weather?lat=${lat}&lon=${lon}`),
        axios.get(`/api/aqi?latlng=${lat},${lon}`)
      ]);

      const aqiValue = (aData.status === 'ok' && typeof aData.data?.aqi === 'number') ? aData.data.aqi : null;

      setWeather({
        current: wData.current,
        daily: wData.daily || [],
        aqi: aqiValue,
        location: { name, country }
      });
    } catch (e: any) {
      console.error("API Fetch Error:", e);
      if (e.response?.status === 401) {
        alert("⚠️ Unauthorized: Please check your API keys or subscription level (e.g., OpenWeather One Call 3.0).");
      } else {
        alert(t('weather_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeatherVisuals = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('clear')) return { label: lang === 'vi' ? 'Trời quang' : 'Clear', color: 'text-yellow-400' };
    if (c.includes('cloud')) return { label: lang === 'vi' ? 'Nhiều mây' : 'Cloudy', color: 'text-slate-400' };
    if (c.includes('rain')) return { label: lang === 'vi' ? 'Mưa' : 'Rain', color: 'text-blue-500' };
    if (c.includes('snow')) return { label: lang === 'vi' ? 'Tuyết' : 'Snow', color: 'text-blue-200' };
    if (c.includes('mist') || c.includes('fog')) return { label: lang === 'vi' ? 'Sương mù' : 'Fog', color: 'text-slate-300' };
    return { label: condition, color: 'text-brand' };
  };

  const aqiLabels: Record<string, string[]> = {
    vi: ['Tốt', 'Trung bình', 'Kém', 'Xấu', 'Rất xấu'],
    en: ['Good', 'Moderate', 'Unhealthy for sensitive', 'Unhealthy', 'Very Unhealthy'],
    zh: ['优', '良', '轻度污染', '中度污染', '重度污染']
  };

  const aqiMap = [
    { label: (aqiLabels[lang] || aqiLabels.vi)[0], color: 'bg-green-500', text: 'text-green-500', max: 50 },
    { label: (aqiLabels[lang] || aqiLabels.vi)[1], color: 'bg-yellow-500', text: 'text-yellow-500', max: 100 },
    { label: (aqiLabels[lang] || aqiLabels.vi)[2], color: 'bg-orange-500', text: 'text-orange-500', max: 150 },
    { label: (aqiLabels[lang] || aqiLabels.vi)[3], color: 'bg-red-500', text: 'text-red-500', max: 200 },
    { label: (aqiLabels[lang] || aqiLabels.vi)[4], color: 'bg-purple-500', text: 'text-purple-500', max: 999 },
  ];

  const getAQIInfo = (val: number) => aqiMap.find(m => val <= m.max) || aqiMap[4];

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto flex gap-3">
        <input 
          className="theme-input flex-1"
          placeholder={t('weather_search')}
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
          {t('weather_btn')}
        </button>
      </div>

      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="theme-card text-center relative overflow-hidden bg-indigo-50/20 border-indigo-100/50">
               <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                  <MapPin size={12} className="text-brand" /> {weather.location.name}, {weather.location.country}
               </div>
               <div className="text-9xl font-black font-display text-brand tracking-tighter mb-4">{Math.round(weather.current.temp)}°</div>
               <p className={`text-2xl font-black uppercase tracking-tight ${getWeatherVisuals(weather.current.weather[0].main).color}`}>
                {getWeatherVisuals(weather.current.weather[0].main).label}
               </p>
               
               <div className="grid grid-cols-2 gap-6 mt-12">
                  <div className="bg-white p-6 rounded-[24px] border border-slate-50 shadow-sm">
                    <Droplets size={24} className="mx-auto text-sky-500 mb-3" />
                    <div className="text-2xl font-black text-slate-800">{weather.current.humidity}%</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('humidity')}</div>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-slate-50 shadow-sm">
                    <Wind size={24} className="mx-auto text-accent mb-3" />
                    <div className="text-2xl font-black text-slate-800">{Math.round(weather.current.wind_speed)} <span className="text-sm">m/s</span></div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('wind_velocity')}</div>
                  </div>
               </div>
            </div>

            <div className="theme-card">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{t('forecast')}</h3>
              <div className="grid grid-cols-5 gap-3">
                {weather.daily.slice(0, 5).map((dValue: any, i: number) => {
                  const date = new Date(dValue.dt * 1000);
                  const visual = getWeatherVisuals(dValue.weather[0].main);
                  return (
                    <div key={i} className="text-center p-5 bg-slate-50 rounded-[24px] border border-slate-100/50">
                      <div className="text-[10px] font-bold text-slate-400 mb-3">{date.getDate()}/{date.getMonth() + 1}</div>
                      <div className={`text-2xl font-black mb-1 ${visual.color}`}>{Math.round(dValue.temp.max)}°</div>
                      <div className="text-[10px] font-black text-slate-300">{Math.round(dValue.temp.min)}°</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className={`theme-card text-center bg-white`}>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{t('aqi_title')}</h3>
               {weather.aqi !== null ? (
                 <>
                   <div className={`text-8xl font-black font-display tracking-tighter mb-4 ${getAQIInfo(weather.aqi).text}`}>{weather.aqi}</div>
                   <div className={`inline-block px-6 py-2 rounded-full text-xs font-black text-white mb-10 shadow-lg ${getAQIInfo(weather.aqi).color}`}>
                    {(getAQIInfo(weather.aqi).label || '').toUpperCase()}
                   </div>

                   <div className="h-3 w-full bg-slate-50 rounded-full relative overflow-hidden mt-6 ring-4 ring-slate-50/50">
                      <div 
                        className={`h-full ${getAQIInfo(weather.aqi).color} transition-all duration-1000`} 
                        style={{ width: `${Math.min((weather.aqi / 300) * 100, 100)}%` }} 
                      />
                   </div>
                 </>
               ) : (
                 <div className="py-12 text-slate-300 font-bold italic">{t('no_metadata')}</div>
               )}
               <p className="text-[10px] text-slate-400 font-bold mt-8 leading-relaxed px-4">
                {t('aqi_desc')}
               </p>
            </div>

            <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
               <div className="flex items-center gap-4 text-xs font-bold italic text-indigo-400">
                <Info size={18} className="shrink-0" />
                {t('realtime_notice')}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoldView({ t }: { t: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data: res } = await axios.get('/api/gold/prices');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-3xl font-black font-display text-brand tracking-tight">{t('financial_assets')}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('value_unit')}</p>
        </div>
        <button onClick={fetchPrices} disabled={loading} className="p-4 bg-slate-50 text-brand rounded-[20px] hover:bg-brand hover:text-white transition-all shadow-sm">
          <RotateCcw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {data.map(item => (
          <div key={item.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-6 mb-6 sm:mb-0">
               <div className="w-14 h-14 bg-warning/10 text-warning rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-warning/5">{item.code === 'XAUUSD' ? '$' : 'G'}</div>
               <div>
                  <h4 className="font-black text-lg text-slate-800">{item.name}</h4>
                  <div className={`text-[10px] font-black uppercase tracking-widest text-slate-400`}>
                    Code: {item.code}
                  </div>
               </div>
            </div>
            <div className="flex gap-12 sm:gap-20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">{t('liquid_sell')}</div>
                <div className="text-2xl font-black font-display text-brand tracking-tighter">
                  {item.price.toLocaleString()} 
                  <span className="text-sm font-bold text-indigo-200 ml-1">{item.code === 'XAUUSD' ? 'USD' : 'Tr'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">{t('market_notice')}</p>
    </div>
  );
}

function SearchView({ t }: { t: any }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'google' | 'maps'>('google');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params: any = { q: query, hl: 'vi', gl: 'vn' };
      if (type === 'google') {
        params.engine = 'google';
      } else {
        params.engine = 'google_maps';
        params.type = 'search';
      }
      const { data } = await axios.get('/api/search', { params });
      setResults(data);
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 401) {
        alert("⚠️ Unauthorized: Your SerpApi key is invalid or has reached its quota.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="theme-card text-center bg-emerald-50/20 border-emerald-100">
        <h3 className="text-3xl font-black mb-4 font-display text-emerald-600">{t('search_explore')}</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">{t('search_desc')}</p>
        
        <div className="flex gap-2 justify-center mb-6">
          <button onClick={() => setType('google')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${type === 'google' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{t('google_search')}</button>
          <button onClick={() => setType('maps')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${type === 'maps' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{t('google_maps')}</button>
        </div>

        <div className="flex gap-3">
          <input 
            className="theme-input flex-1"
            placeholder={type === 'google' ? t('google_search') : t('google_maps')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="theme-btn-primary bg-emerald-500 min-w-[120px] shadow-emerald-200">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <Search size={20} className="mx-auto" />}
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 gap-6">
          {type === 'google' ? (
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('search_results')}</h4>
              {results.organic_results?.map((res: any, idx: number) => (
                <div key={idx} className="theme-card">
                  <a href={res.link} target="_blank" className="text-lg font-black text-brand hover:underline block mb-1">{res.title}</a>
                  <p className="text-slate-500 text-sm leading-relaxed">{res.snippet}</p>
                  <div className="text-[10px] text-slate-300 font-bold mt-2 truncate">{res.displayed_link}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h4 className="col-span-full text-sm font-black uppercase tracking-widest text-slate-400">{t('map_results')}</h4>
              {results.local_results?.map((place: any, idx: number) => (
                <div key={idx} className="theme-card flex gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                    <MapPin size={32} />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-800">{place.title}</h5>
                    <p className="text-[10px] text-slate-400 mb-2">{place.address}</p>
                    {place.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex text-warning">{'★'.repeat(Math.round(place.rating))}</div>
                        <span className="text-[10px] font-black text-slate-400">{place.rating} ({place.reviews})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GasView({ t }: { t: any }) {
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
          <h3 className="text-3xl font-black mb-2 font-display text-brand tracking-tight">{t('petrol_index')}</h3>
          <p className="text-slate-500 mb-10 font-medium">{t('fuel_desc')}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black">{t('fuel_class')}</th>
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">{t('zone1')}</th>
                  <th className="pb-6 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">{t('zone2')}</th>
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
            <h4 className="text-sm font-black text-sky-800 uppercase tracking-widest mb-2">{t('fuel_notice_title')}</h4>
            <p className="text-[13px] text-sky-700/70 leading-relaxed font-medium">
              {t('fuel_notice_desc')}
            </p>
          </div>
       </div>
    </div>
  );
}

function DownloadView({ t }: { t: any }) {
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
        <h3 className="text-3xl font-black mb-4 font-display text-brand">{t('asset_acq')}</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">{t('asset_desc')}</p>
        <div className="flex gap-3">
          <input 
            className="theme-input flex-1"
            placeholder={t('resource_url')}
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button className="theme-btn-primary min-w-[120px]">{t('fetch')}</button>
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
          {t('download_notice')}
        </p>
      </div>
    </div>
  );
}

function ProfileView({ profile, onSave, t }: { profile: UserProfile, onSave: (p: UserProfile) => void, t: any }) {
  const [form, setForm] = useState(profile);

  return (
    <div className="max-w-xl mx-auto space-y-10">
      <div className="text-center">
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/5">
          <Wand2 size={40} />
        </div>
        <h3 className="text-3xl font-black font-display text-brand tracking-tight">{t('personalize')}</h3>
        <p className="text-slate-500 font-medium mt-2">{t('personalize_desc')}</p>
      </div>

      <div className="theme-card space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">{t('full_name')}</label>
            <input 
              className="theme-input w-full"
              placeholder="NGUYEN VAN A"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">{t('default_bank')}</label>
            <input 
              className="theme-input w-full"
              placeholder="MB Bank, VCB..."
              value={form.bank}
              onChange={e => setForm({...form, bank: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">{t('acc_id')}</label>
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
          {t('save_info')}
        </button>
      </div>

      <div className="p-8 bg-sky-50 rounded-[32px] border border-sky-100/50 flex gap-4 items-start shadow-sm">
        <Info className="text-sky-500 shrink-0 mt-1" size={20} />
        <p className="text-sm text-sky-700/70 font-medium leading-relaxed">
          {t('profile_info_notice')}
        </p>
      </div>
    </div>
  );
}

function PowerCutView({ t }: { t: any }) {
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!area.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/beeknoee', {
        model: 'glm-4.5-flash',
        messages: [
          { role: 'system', content: t('ai_power_system') },
          { role: 'user', content: t('ai_power_prompt')(area) }
        ],
        temperature: 0.3
      });
      setCity(response.data.choices[0].message.content?.trim() || area);
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
        <h3 className="text-3xl font-black mb-4 font-display text-brand">{t('evn_title')}</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">{t('evn_desc')}</p>
        <div className="flex gap-3 mb-10">
          <input 
            className="theme-input flex-1"
            placeholder={t('locality')}
            value={area}
            onChange={e => setArea(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="theme-btn-primary min-w-[140px] flex items-center justify-center gap-2 bg-warning shadow-warning/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('weather_btn')}
          </button>
        </div>

        {city && (
          <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[32px] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-20 h-20 bg-white text-warning rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
                <Zap size={40} />
             </div>
             <h4 className="text-2xl font-black text-slate-800 mb-2">{city} {t('grid_report')}</h4>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
              {t('aqi_desc')}
             </p>
             <a 
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="theme-btn-primary bg-slate-800 shadow-slate-200"
             >
                {t('launch_protocol')} {city} <ExternalLink size={20} className="inline ml-2" />
             </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="theme-card">
          <h5 className="font-black text-slate-800 mb-2 flex items-center gap-3"><Zap size={18} className="text-warning" /> {t('evn_north')}</h5>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{t('domain_capital')}</p>
          <a href="https://evnhanoi.vn/search/power-cut" target="_blank" className="text-xs font-black text-brand hover:underline">Access Terminal →</a>
        </div>
        <div className="theme-card">
          <h5 className="font-black text-slate-800 mb-2 flex items-center gap-3"><Zap size={18} className="text-warning" /> {t('evn_south')}</h5>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{t('domain_metro')}</p>
          <a href="https://www.evnhcmc.vn/khach-hang/lich-ngung-giam-cung-cap-dien" target="_blank" className="text-xs font-black text-brand hover:underline">Access Terminal →</a>
        </div>
      </div>
    </div>
  );
}


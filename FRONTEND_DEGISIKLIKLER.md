# 🎨 Frontend Değişiklikleri Nasıl Yapılır?

## ⚠️ ÖNEMLİ: Kod Değişikliği Yapmadan Önce

Şu anki sistemde **volume mount kapalı** olduğu için kod değişiklikleri otomatik yansımaz.

### 2 Seçeneğin Var:

---

## 🚀 Yöntem 1: Hızlı Test (Önerilen - Geliştirme İçin)

Frontend'i **Docker dışında** çalıştır (değişiklikler anında yansır)

### Adımlar:

**1. Backend Docker'da Çalışsın**
```powershell
cd devops
docker compose up -d backend postgres redis
```

**2. Frontend'i Local Çalıştır**
```powershell
cd frontend

# İlk sefer (paketleri yükle)
npm install

# Frontend'i başlat
npm run dev
```

**3. Tarayıcıda Aç**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5001 (Docker)

**4. Kod Değiştir**
- `frontend/src` klasöründeki dosyaları düzenle
- Kaydet → Tarayıcı otomatik yenilenir ✨

**5. Bitince Docker'a Taşı**
```powershell
# Frontend container'ını rebuild et
cd devops
docker compose up -d --build frontend
```

---

## 🐳 Yöntem 2: Docker ile (Production)

Her değişiklikten sonra rebuild gerekir.

### Adımlar:

**1. Kodu Değiştir**
- `frontend/src` klasöründeki dosyaları düzenle
- Kaydet

**2. GitHub'a Push**
```powershell
# Git status kontrol et
git status

# Değişiklikleri ekle
git add .

# Commit yap
git commit -m "Frontend güncelleme: [ne yaptın]"

# Push yap
git push
```

**3. Docker'da Rebuild Et**
```powershell
cd devops

# Frontend'i yeniden build et
docker compose up -d --build frontend

# Logları kontrol et
docker compose logs -f frontend
```

**4. Tarayıcıyı Yenile**
- http://localhost:5000
- Ctrl + F5 (cache'i temizle)

---

## 📁 Frontend Dosya Yapısı

```
frontend/
├── src/
│   ├── components/      # Reusable bileşenler
│   ├── pages/          # Sayfa bileşenleri
│   ├── store/          # Zustand state management
│   ├── services/       # API çağrıları
│   ├── utils/          # Yardımcı fonksiyonlar
│   ├── App.jsx         # Ana app component
│   └── main.jsx        # Entry point
├── public/             # Static dosyalar
├── package.json        # Dependencies
└── vite.config.js      # Vite config
```

---

## 🎯 Sık Yapılan Değişiklikler

### 1️⃣ Yeni Sayfa Eklemek

**Dosya:** `frontend/src/pages/YeniSayfa.jsx`
```jsx
import React from 'react';

const YeniSayfa = () => {
  return (
    <div>
      <h1>Yeni Sayfam</h1>
      <p>İçerik buraya</p>
    </div>
  );
};

export default YeniSayfa;
```

**Route Ekle:** `frontend/src/App.jsx`
```jsx
import YeniSayfa from './pages/YeniSayfa';

// Routes içine ekle
<Route path="/yeni-sayfa" element={<YeniSayfa />} />
```

---

### 2️⃣ API Endpoint Değiştirmek

**Dosya:** `frontend/src/services/api.js`
```javascript
// Backend URL'i değiştir
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

**Environment Variable:** `frontend/.env.local` oluştur
```env
VITE_API_URL=http://localhost:5001
```

---

### 3️⃣ State Yönetimi (Zustand)

**Yeni Store Oluştur:** `frontend/src/store/yeniStore.js`
```javascript
import { create } from 'zustand';

export const useYeniStore = create((set) => ({
  data: [],
  setData: (data) => set({ data }),
  clearData: () => set({ data: [] }),
}));
```

**Kullan:** Herhangi bir component'te
```jsx
import { useYeniStore } from '../store/yeniStore';

const MyComponent = () => {
  const { data, setData } = useYeniStore();

  return <div>{data.length} öğe var</div>;
};
```

---

### 4️⃣ Stil Değiştirmek

**Tailwind CSS kullanılıyor** (zaten kurulu)

```jsx
<button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Tıkla
</button>
```

**Veya Custom CSS:** `frontend/src/index.css`
```css
.custom-button {
  background-color: #3b82f6;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}
```

---

### 5️⃣ Model Eğitimi Sayfası Eklemek

**Dosya:** `frontend/src/pages/FineTuningPage.jsx`
```jsx
import React, { useState } from 'react';
import axios from 'axios';

const FineTuningPage = () => {
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(false);

  const createModel = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/fine-tuning/model/create', {
        modelName,
      });
      alert('Model oluşturuldu: ' + response.data.modelName);
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Model Eğitimi</h1>

      <input
        type="text"
        placeholder="Model adı (örn: erp-turkish-v1)"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={createModel}
        disabled={loading || !modelName}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {loading ? 'Oluşturuluyor...' : 'Model Oluştur'}
      </button>
    </div>
  );
};

export default FineTuningPage;
```

**Route Ekle:** `frontend/src/App.jsx`
```jsx
import FineTuningPage from './pages/FineTuningPage';

// Routes içine ekle (sadece admin için)
<Route path="/fine-tuning" element={<FineTuningPage />} />
```

---

## 🔧 Faydalı Komutlar

### Development (Local)
```powershell
npm run dev          # Development server başlat
npm run build        # Production build
npm run preview      # Build'i preview et
npm run lint         # Kod kontrolü
```

### Docker
```powershell
# Frontend rebuild
docker compose up -d --build frontend

# Frontend logları
docker compose logs -f frontend

# Frontend shell (debug için)
docker exec -it erp_frontend sh
```

---

## 🐛 Sık Karşılaşılan Sorunlar

### Problem: "npm install" çalışmıyor
**Çözüm:**
```powershell
# Node.js versiyonunu kontrol et (18+ olmalı)
node --version

# Node_modules ve package-lock.json'u sil
Remove-Item -Recurse node_modules
Remove-Item package-lock.json

# Tekrar yükle
npm install
```

### Problem: Frontend açılmıyor (Docker)
**Çözüm:**
```powershell
# Container'ı tamamen rebuild et
docker compose down
docker compose up -d --build frontend

# Cache'i temizle
docker builder prune -a
```

### Problem: API bağlanamıyor (CORS hatası)
**Çözüm:**
Backend'de CORS açık olmalı (`backend/server.js`):
```javascript
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
```

---

## ✅ Özet: Hızlı Workflow

**Geliştirme sırasında:**
1. Backend Docker'da çalışsın: `docker compose up -d backend postgres redis`
2. Frontend local'de çalışsın: `cd frontend && npm run dev`
3. Kodu değiştir → Otomatik yenilenir ✨

**Production'a taşırken:**
1. Kodu commit + push yap
2. Frontend'i rebuild et: `docker compose up -d --build frontend`
3. Test et: http://localhost:5000

**🎯 ÖNERİ: Development için Yöntem 1 kullan (npm run dev)**

Bu sayede hot reload çalışır ve çok daha hızlı geliştirme yaparsın! 🚀

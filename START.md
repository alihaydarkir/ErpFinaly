# 🚀 ERP Projesini Başlatma Rehberi

## ✅ Hazırlık Kontrolü

Tüm gereksinimler mevcut:
- ✅ Backend .env dosyası var
- ✅ Frontend .env dosyası var
- ✅ Backend dependencies kurulu
- ✅ Frontend dependencies kurulu

---

## 🎯 Hızlı Başlatma (2 Yöntem)

### YÖNTEM 1: Ayrı Terminallerde Çalıştırma (Önerilen)

#### Terminal 1 - Backend
```bash
cd /home/user/ErpFinaly/backend
npm start
```

✅ **Beklenen Çıktı:**
```
🚀 Server running on port 5000
📡 WebSocket ready
🌍 Environment: development
⚠️  Redis not available - running without cache
```

Backend artık çalışıyor: **http://localhost:5000**

---

#### Terminal 2 - Frontend
```bash
cd /home/user/ErpFinaly/frontend
npm run dev
```

✅ **Beklenen Çıktı:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173
➜  Network: use --host to expose
```

Frontend artık çalışıyor: **http://localhost:5173** (veya 3000)

---

### YÖNTEM 2: Tek Komutla Başlatma (Arka Planda)

```bash
# Backend'i arka planda başlat
cd /home/user/ErpFinaly/backend
npm start > backend.log 2>&1 &

# Frontend'i arka planda başlat
cd /home/user/ErpFinaly/frontend
npm run dev > frontend.log 2>&1 &

# Kontrol et
ps aux | grep -E "node|vite"
```

**Logları görmek için:**
```bash
tail -f /home/user/ErpFinaly/backend/backend.log
tail -f /home/user/ErpFinaly/frontend/frontend.log
```

**Durdurmak için:**
```bash
pkill -f "node server.js"
pkill -f vite
```

---

## 🔍 Test Etme

### Backend Test
```bash
# API'yi test et
curl http://localhost:5000
```

✅ **Beklenen Yanıt:**
```json
{
  "message": "ERP Backend API",
  "version": "2.0",
  "status": "running"
}
```

### Frontend Test
Tarayıcıda aç: **http://localhost:5173** (veya http://localhost:3000)

---

## ⚠️ Sorun Giderme

### Backend Başlamıyorsa

**Problem:** Port 5000 zaten kullanımda
```bash
# Hangi process kullanıyor?
lsof -i :5000

# Process'i durdur
kill -9 <PID>
```

**Problem:** Database bağlantı hatası
```bash
# PostgreSQL çalışıyor mu?
psql -U postgres -c "SELECT 1"

# Çalışmıyorsa başlat (Docker ile)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=12345 postgres:14
```

---

### Frontend Başlamıyorsa

**Problem:** Port zaten kullanımda
```bash
# Farklı port kullan
npm run dev -- --port 3001
```

**Problem:** Backend'e bağlanamıyor
```bash
# .env dosyasını kontrol et
cat /home/user/ErpFinaly/frontend/.env

# Backend çalışıyor mu?
curl http://localhost:5000
```

---

## 📊 Servisler ve Portlar

| Servis | Port | URL | Durum |
|--------|------|-----|-------|
| Backend API | 5000 | http://localhost:5000 | Aktif |
| Frontend (Vite) | 5173 | http://localhost:5173 | Aktif |
| PostgreSQL | 5432 | localhost:5432 | **Gerekli** (Docker) |
| Redis | 6379 | localhost:6379 | Opsiyonel (Docker) |
| Ollama | 11434 | http://localhost:11434 | Opsiyonel |

**NOT:** PostgreSQL **zorunludur**. Docker ile başlatın:
```bash
docker-compose up -d postgres redis
```

---

## 🛑 Projeyi Durdurma

### Terminal'de çalışıyorsa
`Ctrl + C` tuşlarına bas

### Arka planda çalışıyorsa
```bash
# Tüm node process'lerini durdur
pkill -f "node server.js"
pkill -f vite

# Veya spesifik PID ile
ps aux | grep node
kill <PID>
```

---

## 🔄 Güncellemelerden Sonra

Git pull yaptıktan sonra:

```bash
# Backend
cd /home/user/ErpFinaly/backend
npm install  # Yeni dependencies varsa
npm run migrate  # Database değişiklikleri varsa

# Frontend
cd /home/user/ErpFinaly/frontend
npm install  # Yeni dependencies varsa
```

---

## 💡 İpuçları

1. **Development için:** Her zaman 2 ayrı terminal kullanın (Backend + Frontend)
2. **Log takibi:** Backend'de `npm run dev` kullanın (nodemon ile auto-reload)
3. **Production test:** Frontend'i build edin: `npm run build`
4. **Redis/PostgreSQL:** Docker Compose ile tek seferde başlatın:
   ```bash
   cd /home/user/ErpFinaly/devops
   docker-compose up -d postgres redis
   ```

---

## 📞 Hızlı Başvuru Komutları

```bash
# Projeye git
cd /home/user/ErpFinaly

# Backend başlat
cd backend && npm start

# Frontend başlat (yeni terminal)
cd frontend && npm run dev

# Her şeyi durdur
pkill -f "node|vite"

# Logları izle
tail -f backend/*.log frontend/*.log
```

---

**Son Güncelleme:** 2025-11-03
**Durum:** ✅ Proje çalışır durumda

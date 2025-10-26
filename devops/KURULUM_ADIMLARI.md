# 🚀 Sistemi Çalıştırma Adımları

## ⚙️ Gereksinimler

1. **Docker Desktop** yüklü olmalı
2. **Docker Compose** yüklü olmalı
3. Windows PowerShell veya CMD açık

## 📝 Adım Adım Kurulum

### 1️⃣ Docker'ın Çalıştığını Kontrol Et

Terminal'de şunu çalıştır:
```powershell
docker --version
docker-compose --version
```

Eğer hata verirse Docker Desktop'ı başlat!

### 2️⃣ Development Mode (Önerilen - Hot Reload)

**Windows PowerShell'de:**
```powershell
cd devops
docker-compose -f docker-compose.dev.yml up -d
```

**Veya BAT dosyasıyla:**
```powershell
cd devops
.\start-dev.bat
```

### 3️⃣ Production Mode (Nginx Build)

```powershell
cd devops
docker-compose up -d
```

**Veya BAT dosyasıyla:**
```powershell
cd devops
.\start-prod.bat
```

## 📊 Servislerin Durumunu Kontrol Et

```powershell
docker-compose ps
```

Çıktıda görmen gerekenler:
- erp_postgres
- erp_redis
- erp_backend
- erp_frontend

## 🌐 Erişim Adresleri

Tarayıcıda aç:
- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:5001

## 📋 Logları Takip Et

### Tüm loglar:
```powershell
docker-compose -f docker-compose.dev.yml logs -f
```

### Sadece Frontend:
```powershell
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Sadece Backend:
```powershell
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 🛑 Sistemi Durdurmak

```powershell
docker-compose -f docker-compose.dev.yml down
```

**Veya:**
```powershell
.\stop.bat
```

## 🔄 Yeniden Başlatmak

```powershell
docker-compose -f docker-compose.dev.yml restart
```

## 🗄️ Veritabanı Migrasyonları

```powershell
# Backend container'ına gir
docker exec -it erp_backend sh

# İçeride çalıştır:
npm run migrate
npm run seed
```

## 🐛 Sorun Giderme

### Port 5000 zaten kullanılıyor hatası:

```powershell
# Portu kullanan process'i bul
netstat -ano | findstr :5000

# Process ID'yi öldür (PID yerine gerçek ID'yi yaz)
taskkill /PID <PID> /F
```

### Container'lar başlamıyor:

```powershell
# Tüm container'ları durdur
docker-compose down

# Volume'ları temizle
docker-compose down -v

# Yeniden başlat
docker-compose -f docker-compose.dev.yml up -d
```

### Logları göremiyorum:

```powershell
# Belirli bir container'ın loglarını kontrol et
docker logs erp_frontend
docker logs erp_backend
```

## ✅ Sistem Hazır Kontrol Listesi

- [ ] Docker Desktop çalışıyor
- [ ] Container'lar başlatıldı (`docker-compose ps`)
- [ ] http://localhost:5000 açılıyor
- [ ] http://localhost:5001/api/health çalışıyor (varsa)

## 🎯 Hızlı Komutlar

```powershell
# Başlat
docker-compose -f docker-compose.dev.yml up -d

# Durdur
docker-compose -f docker-compose.dev.yml down

# Logları göster
docker-compose -f docker-compose.dev.yml logs -f

# Yeniden build et
docker-compose -f docker-compose.dev.yml build

# Container'a gir
docker exec -it erp_frontend sh
docker exec -it erp_backend sh

# Cache temizle ve yeniden başlat
docker-compose -f docker-compose.dev.yml down
docker system prune -f
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```


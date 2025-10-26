# ERP Docker Kurulum Kılavuzu

## 🚀 Hızlı Başlangıç

### Production Mode (Nginx ile Build)
```bash
cd devops
docker-compose up -d
```

**Portlar:**
- Frontend: http://localhost:5000
- Backend API: http://localhost:5001

### Development Mode (Hot-Reload ile)
```bash
cd devops
docker-compose -f docker-compose.dev.yml up -d
```

**Portlar:**
- Frontend (Vite Dev Server): http://localhost:5000
- Backend API: http://localhost:5001

## 📝 Frontend Değişikliklerini Görmek

Development mode'da çalışırsanız:
1. Frontend dosyalarında değişiklik yapın
2. Değişiklikler otomatik olarak yansır (Hot Reload)
3. http://localhost:5000 adresinde çalışır

### Frontend Dosyaları:
- `frontend/src/components/` - React Bileşenleri
- `frontend/src/pages/` - Sayfalar
- `frontend/src/services/` - API Servisleri

### Backend Dosyaları:
- `backend/src/controllers/` - API Controller'lar
- `backend/src/routes/` - Route Tanımlamaları
- `backend/src/models/` - Veritabanı Modelleri

## 🔄 Yapılan Değişiklikleri Görmek

### Development Mode Kullanımı:
```bash
# Geliştirme modunda başlat
docker-compose -f docker-compose.dev.yml up -d

# Logları takip et
docker-compose -f docker-compose.dev.yml logs -f frontend

# Servisleri durdur
docker-compose -f docker-compose.dev.yml down
```

### Container'ları Yeniden Build Etmek:
```bash
# Sadece frontend'i yeniden build et
docker-compose -f docker-compose.dev.yml build frontend

# Sadece backend'i yeniden build et
docker-compose -f docker-compose.dev.yml build backend

# Tüm servisleri yeniden build et
docker-compose -f docker-compose.dev.yml build
```

## 🛠️ Sık Kullanılan Komutlar

```bash
# Tüm servisleri başlat
docker-compose up -d

# Belirli bir servisi başlat
docker-compose up -d postgres redis

# Logları görüntüle
docker-compose logs -f

# Container'a bağlan
docker exec -it erp_frontend sh
docker exec -it erp_backend sh

# Container'ları durdur
docker-compose down

# Container'ları ve volume'ları sil
docker-compose down -v
```

## 📊 Veritabanı Migrasyonları

```bash
# Container'a bağlan
docker exec -it erp_backend sh

# Migrasyonları çalıştır
npm run migrate

# Seed data ekle
npm run seed
```

## 🔍 Debug Modu

### Backend Debug:
```bash
# Backend loglarını göster
docker-compose logs -f backend

# Backend container'ına gir
docker exec -it erp_backend sh
```

### Frontend Debug:
```bash
# Frontend loglarını göster
docker-compose logs -f frontend

# Frontend container'ına gir
docker exec -it erp_frontend sh
```

## ⚙️ Environment Variables

Backend ve Frontend için `.env` dosyaları oluşturmanız gerekebilir:

### Backend:
```bash
cd backend
cp env.example .env
# .env dosyasını düzenleyin
```

### Frontend:
```bash
cd frontend
cp env.example .env
# .env dosyasını düzenleyin
```

## 🎯 Port Ayarları

**Production:**
- Frontend: 5000
- Backend: 5001

**Development:**
- Frontend (Vite): 5000
- Backend: 5001

## 📞 Sorun Giderme

### Port çakışması:
```bash
# Port kullanan process'i bul
netstat -ano | findstr :5000

# Docker container'ları durdur
docker-compose down
```

### Volume sorunları:
```bash
# Volume'ları sıfırla
docker-compose down -v
docker-compose up -d
```

### Cache temizleme:
```bash
# Docker cache'i temizle
docker system prune -a
docker-compose build --no-cache
```

## 🔐 Güvenlik

⚠️ **Production'a geçmeden önce:**
1. JWT_SECRET değiştirin
2. Database password değiştirin
3. SMTP ayarlarını yapın
4. OLLAMA_BASE_URL'i ayarlayın


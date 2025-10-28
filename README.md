# 🏢 ERP Finaly - Modern ERP Sistemi

Enterprise Resource Planning (ERP) sistemi - Türkçe AI destekli, modern ve basit.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker Desktop
- Ollama (model eğitimi için)

### Kurulum

**Windows PowerShell:**
```powershell
# 1. Projeyi klonla
git clone https://github.com/alihaydarkir/ErpFinaly.git
cd ErpFinaly

# 2. Kurulum script'ini çalıştır
.\setup.ps1
```

**3. Tarayıcıda aç:** http://localhost:5000

### Test Kullanıcıları
- **Admin:** admin@erp.local / admin123
- **Manager:** manager@erp.local / manager123
- **User:** user@erp.local / user123

## 📖 Dokümantasyon

- [Kurulum Rehberi](KURULUM_REHBERI.md) - Detaylı kurulum ve 25 adımlık kullanım rehberi
- [Frontend Değişiklikleri](FRONTEND_DEGISIKLIKLER.md) - UI geliştirme rehberi

## 🛠️ Teknolojiler

**Backend:** Node.js, Express, PostgreSQL, Redis
**Frontend:** React, Vite, Tailwind CSS, Zustand
**AI:** Ollama, Llama2, Fine-tuning
**DevOps:** Docker, Docker Compose

## 📊 Özellikler

✅ Kullanıcı yönetimi (Admin, Manager, User)
✅ Ürün yönetimi
✅ Sipariş takibi
✅ Raporlama
✅ AI chatbot
✅ Türkçe model eğitimi (Fine-tuning)

## 🔧 Komutlar

```powershell
# Başlat
cd devops
docker compose up -d

# Durdur
docker compose down

# Loglar
docker compose logs -f backend

# Tam sıfırlama
docker compose down -v
.\setup.ps1
```

## 📞 Destek

Sorun mu yaşıyorsun? [KURULUM_REHBERI.md](KURULUM_REHBERI.md) dosyasındaki "Sorun Giderme" bölümüne bak.

---

**Lisans:** MIT
**Durum:** ✅ Çalışır Durumda

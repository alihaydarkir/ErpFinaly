# 🚀 ERP Sistemi Kurulum ve Kullanım Rehberi

## 📋 25 Adımda Sistem Kurulumu ve Kullanımı

### 🔧 İlk Kurulum (Tek Seferlik)

**1. Docker Desktop'ı İndir ve Yükle**
   - https://www.docker.com/products/docker-desktop adresinden indir
   - Yükle ve başlat

**2. Ollama'yı İndir ve Yükle** (Model eğitimi için)
   - https://ollama.ai adresinden indir
   - Yükle ve başlat
   - PowerShell'de çalıştır: `ollama pull llama2`

**3. GitHub Desktop ile Projeyi Klonla**
   - GitHub Desktop'ı aç
   - File → Clone Repository
   - URL: `https://github.com/alihaydarkir/ErpFinaly`
   - Yerel klasör seç ve klonla

**4. Branch'i Seç**
   - GitHub Desktop'ta Current Branch'e tıkla
   - `claude/detect-latest-updates-011CUXZCHgSd59Bx2pRJbeCp` branch'ini seç

**5. PowerShell'i Aç**
   - Windows tuşu + X
   - "Windows PowerShell" seç

---

### ⚡ Sistemi Başlatma (Her Kullanımda)

**6. Proje Klasörüne Git**
   ```powershell
   cd "C:\Users\[KULLANICI_ADIN]\Documents\GitHub\ErpFinaly"
   ```

**7. Kurulum Script'ini Çalıştır**
   ```powershell
   .\setup.ps1
   ```
   - Bu script otomatik olarak:
     - .env dosyası oluşturur
     - Docker container'larını başlatır
     - Database migration'larını çalıştırır
     - Test kullanıcıları oluşturur

**8. 20 Saniye Bekle**
   - Script otomatik bekler, ekranda ilerleme göreceksin

**9. Tarayıcıda Aç**
   - http://localhost:5000 adresine git

**10. Giriş Yap**
   - Email: `admin@erp.local`
   - Şifre: `admin123`

---

### 🎯 Günlük Kullanım

**11. Sistemi Başlatma** (kısayol)
   ```powershell
   cd "C:\Users\[KULLANICI_ADIN]\Documents\GitHub\ErpFinaly\devops"
   docker compose up -d
   ```

**12. Sistem Durumunu Kontrol Et**
   ```powershell
   docker compose ps
   ```
   - Tüm servisler "Up" durumunda olmalı

**13. Logları İzle** (hata kontrolü için)
   ```powershell
   docker compose logs -f backend
   ```
   - Çıkmak için: Ctrl + C

**14. Sistemi Durdur**
   ```powershell
   docker compose down
   ```

---

### 🤖 Model Eğitimi (Fine-Tuning)

**15. Admin Olarak Giriş Yap**
   - Sadece admin kullanıcıları model eğitebilir

**16. Fine-Tuning Sayfasına Git**
   - Menüden "AI Model Training" veya "Model Eğitimi" seç

**17. Fine-Tuning Başlat**
   - API endpoint: `POST http://localhost:5001/api/fine-tuning/initialize`
   - Veya frontend arayüzünden "Initialize" butonuna tıkla

**18. Dataset Oluştur**
   - "Generate Dataset" butonuna tıkla
   - Türkçe ERP dataset'i otomatik oluşturulur

**19. Model Oluştur**
   - Model adı gir (örn: `erp-turkish-v1`)
   - "Create Model" butonuna tıkla
   - İşlem 5-10 dakika sürebilir

**20. Modeli Test Et**
   - Test alanına Türkçe soru yaz
   - Örn: "Yeni ürün nasıl eklerim?"
   - Model Türkçe cevap verecek

---

### 🔍 Sorun Giderme

**21. Backend Çalışmıyorsa**
   ```powershell
   docker compose logs backend
   ```
   - Hata mesajını oku
   - En sık: .env eksik veya DB şifresi yanlış

**22. Frontend Açılmıyorsa**
   ```powershell
   docker compose restart frontend
   ```
   - 10 saniye bekle, tekrar dene

**23. Database Hatası Alırsan**
   ```powershell
   docker compose down -v
   docker compose up -d
   ```
   - Bu tüm verileri siler, setup.ps1'i tekrar çalıştır

**24. bcrypt Hatası Alırsan**
   - Volume mount kapalı tutulmalı (şu anki durum)
   - docker-compose.yml'de volumes satırları # ile kapalı

**25. Tam Sıfırlama** (son çare)
   ```powershell
   # Tüm container'ları ve volume'ları sil
   docker compose down -v

   # .env dosyasını sil
   Remove-Item devops\.env

   # Tekrar başlat
   .\setup.ps1
   ```

---

## 📊 Sistem Mimarisi

**Servisler:**
- **Frontend**: React + Vite (Port 5000)
- **Backend**: Node.js + Express (Port 5001)
- **Database**: PostgreSQL + pgvector (Port 5432)
- **Cache**: Redis (Port 6379)
- **AI**: Ollama (Port 11434)

**Kullanıcı Rolleri:**
- **admin**: Tüm yetkiler + model eğitimi
- **manager**: Ürün/sipariş yönetimi + raporlar
- **user**: Temel işlemler

---

## 🎓 Önemli Notlar

1. **Docker her zaman çalışmalı**: Docker Desktop açık olmalı
2. **Ollama model eğitimi için gerekli**: `ollama pull llama2` komutu çalıştırılmış olmalı
3. **Hot reload yok**: Kod değişikliklerinde `docker compose up -d --build backend` çalıştır
4. **.env dosyasını paylaşma**: Hassas bilgiler içerir, GitHub'a gitmez
5. **İlk kurulum 2-3 dakika sürer**: Sabırlı ol
6. **Test kullanıcıları otomatik oluşur**: admin, manager, user
7. **Migration'lar otomatik çalışır**: Database şeması hazır gelir

---

## 🔗 Faydalı Linkler

- Frontend: http://localhost:5000
- Backend API: http://localhost:5001
- API Docs: http://localhost:5001/api-docs (eğer swagger eklenirse)
- Ollama: http://localhost:11434

---

## 📞 Yardım

Hata alırsan:
1. Önce logları kontrol et: `docker compose logs backend`
2. Container durumunu kontrol et: `docker compose ps`
3. Gerekirse tam sıfırlama yap (madde 25)

✅ **Başarılar! Sistem artık tamamen çalışır durumda.**

# 📊 Veritabanı Migration ve Seed Kılavuzu

## 🔐 Kullanıcı Bilgileri

Seed işlemi aşağıdaki kullanıcıları oluşturur:

### Admin Kullanıcı
- **Username:** `admin`
- **Email:** `admin@erp.local`
- **Password:** `admin123`
- **Role:** Admin

### Manager Kullanıcı
- **Username:** `manager`
- **Email:** `manager@erp.local`
- **Password:** `manager123`
- **Role:** Manager

### Normal Kullanıcı
- **Username:** `user`
- **Email:** `user@erp.local`
- **Password:** `user123`
- **Role:** User

---

## 🔄 Migration ve Seed Çalıştırma

### PowerShell Komutları:

```powershell
# 1. Backend container'ına gir
docker exec -it erp_backend sh

# 2. Container içinde çalıştır:
npm run migrate
npm run seed

# 3. Çıkış
exit
```

### Alternatif (Tek Satırda):
```powershell
docker exec -it erp_backend npm run migrate
docker exec -it erp_backend npm run seed
```

---

## ✅ Başarılı Seed Kontrolü

Seed başarılı olduysa şunu göreceksiniz:
```
🌱 Starting database seeding...
Creating users...
✅ Created 3 users
Creating products...
✅ Created 22 products
🎉 Database seeding completed successfully!
```

---

## 🛠️ Sorun Giderme

### Migration çalışmıyor:
```powershell
# Container loglarını kontrol et
docker logs erp_backend

# Container'a gir ve manuel kontrol et
docker exec -it erp_backend sh
```

### Veritabanı bağlantısı yok:
```powershell
# Postgres container'ın çalıştığını kontrol et
docker ps | grep postgres

# Postgres'e bağlan
docker exec -it erp_postgres psql -U postgres -d erp_db
```

### Tablolar oluşmadı:
```powershell
# Tüm migration'ları tekrar çalıştır
docker exec -it erp_backend npm run migrate
```

---

## 📋 Ek Bilgiler

- Tüm migration'lar `backend/migrations/` klasöründe
- Seed data `backend/scripts/seed-data.js` dosyasında
- Veritabanı: PostgreSQL 14 + pgvector
- Port: 5432


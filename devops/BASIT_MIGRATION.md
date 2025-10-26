# 🚀 Basit Migration Kılavuzu

## Container'a Girip Manuel Çalıştırma

PowerShell'de şu komutları çalıştırın:

```powershell
# 1. Backend container'ına gir
docker exec -it erp_backend sh

# 2. Container içinde manuel migration çalıştır
node scripts/migrate-db.js

# 3. Seed data ekle
node scripts/seed-data.js

# 4. Çıkış
exit
```

## Alternatif: Tek Satırda

```powershell
docker exec -it erp_backend node scripts/migrate-db.js
docker exec -it erp_backend node scripts/seed-data.js
```

## Başarılı Olursa Göreceğiniz Mesajlar

Migration:
```
🔄 Migrations başlatılıyor...
✅ Migration tamamlandı: 001_create_users.sql
✅ Migration tamamlandı: 002_create_products.sql
...
✅ Tüm migrations tamamlandı!
```

Seed:
```
🌱 Starting database seeding...
Creating users...
✅ Created 3 users
Creating products...
✅ Created 22 products
🎉 Database seeding completed successfully!
```

## Giriş Bilgileri

Migration ve seed başarılı olduktan sonra:

**URL:** http://localhost:5000

**Kullanıcılar:**
- Username: `admin` / Password: `admin123`
- Username: `manager` / Password: `manager123`
- Username: `user` / Password: `user123`


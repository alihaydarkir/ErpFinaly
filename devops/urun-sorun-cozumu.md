# 🔍 Ürün Ekleme Sorunu Çözümü

## 📊 Ürünler Nereye Kaydedilir?

Ürünler **PostgreSQL veritabanında** `products` tablosuna kaydedilir.

### Konumlar:
- **Veritabanı:** PostgreSQL Container (Docker Volume)
- **Tablo:** `products`
- **Host:** localhost:5432
- **Database:** erp_db

## 🔧 Sorun Tespiti

PowerShell'de çalışan container'ları kontrol edin:

```powershell
# 1. Container durumları
docker ps

# 2. Backend loglarını izle
docker logs erp_backend -f

# 3. Veritabanında ürünler var mı?
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT COUNT(*) FROM products;"
```

## ✅ Ürün Ekleme Testi

Backend loglarını açık tutun ve tarayıcıdan ürün eklemeyi deneyin:

```powershell
docker logs erp_backend -f
```

---

## 🐳 Docker'da Neler Çalışıyor?

```powershell
# Tüm container'ları gör
docker ps -a

# Sadece çalışanlar
docker ps
```

### Çalışması Gereken Servisler:
1. ✅ **erp_postgres** - PostgreSQL + pgvector
2. ✅ **erp_redis** - Redis cache
3. ✅ **erp_backend** - Node.js API
4. ✅ **erp_frontend** - React app

---

## 🔍 Veritabanı Kontrolü

### Ürünleri Görmek:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock FROM products LIMIT 10;"
```

### Tabloları Görmek:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "\dt"
```

---

## 💾 Veriler Nerede Saklanır?

**Volumes (Persistent Data):**
- Postgres data: `postgres_data` volume
- Redis data: `redis_data` volume

**Volumes'ları görmek:**
```powershell
docker volume ls
```

**Volume içeriğini görmek:**
```powershell
docker volume inspect postgres_data
```

---

## 🎯 Sorun Ne Olabilir?

1. **Redis bağlantısı:** "The client is closed" hatası
2. **AuditLog hatası:** İşleme log kaydedilemiyor
3. **Yetki sorunu:** Kullanıcı yetkisi eksik

**Logları paylaşın!**


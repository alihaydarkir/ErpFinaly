# 🚀 VERİLERİ GÖRÜNTÜLEME - HIZLI KILAVUZ

## 1️⃣ TARAYICIDAN (EN KOLAY) 🌐

**URL:** http://localhost:5000

1. Login ol
2. **Products** menüsüne tıkla
3. Eklediğin tüm ürünler burada! 🎉

---

## 2️⃣ PowerShell Komutu (HIZLI) ⚡

### Tek satırda tüm ürünleri göster:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT * FROM products;"
```

### Daha düzenli görüntüleme:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock_quantity, category FROM products ORDER BY id DESC;"
```

---

## 3️⃣ PostgreSQL Shell (DETAYLI) 🛠️

```powershell
# PostgreSQL'e bağlan
docker exec -it erp_postgres psql -U postgres -d erp_db
```

Sonra SQL komutları çalıştır:
```sql
-- Tüm ürünler
SELECT * FROM products;

-- ID'ye göre ara
SELECT * FROM products WHERE id = 11;

-- İsme göre ara  
SELECT * FROM products WHERE name LIKE '%asdf%';

-- Çıkış
\q
```

---

## 📍 VERİLER NEREYE KAYDEDİLİYOR?

**Konum:** Docker Volume `postgres_data`

**Detaylar:**
- Container: `erp_postgres`
- Database: `erp_db`
- Tablo: `products`
- **KALICI:** Container durdurulsa bile veriler korunur! ✅

---

## 🎯 TEK KOMUT İLE TÜMÜNÜ GÖR:

```powershell
cd devops
.\goster-urunler.ps1
```

Bu script tüm ürünleri gösterir! 🚀


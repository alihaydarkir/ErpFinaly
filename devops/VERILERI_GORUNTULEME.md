# 📊 Eklediğiniz Verileri Görüntüleme Kılavuzu

## 🗄️ VERİLER NEREYE KAYDEDİLİYOR?

### PostgreSQL Veritabanında:
- **Container:** `erp_postgres`
- **Database:** `erp_db`
- **Port:** 5432
- **Volume:** `postgres_data` (kalıcı saklama)

---

## 🔍 VERİLERİ GÖRME YÖNTEMLERİ:

### 1️⃣ PowerShell Komutları (Hızlı)

#### Tüm Ürünleri Görmek:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT * FROM products ORDER BY id DESC;"
```

#### Sadece Ürün İsimleri ve Fiyatları:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock_quantity, category FROM products ORDER BY id DESC;"
```

#### Kaç Ürün Var:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT COUNT(*) FROM products;"
```

#### Son 5 Ürün:
```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT * FROM products ORDER BY id DESC LIMIT 5;"
```

---

### 2️⃣ Veritabanına Bağlanarak (Detaylı)

PostgreSQL'e doğrudan bağlan:

```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db
```

Sonra SQL komutları:
```sql
-- Tüm ürünleri göster
SELECT * FROM products;

-- Belirli bir ürünü bul
SELECT * FROM products WHERE name LIKE '%asdf%';

-- Kategorilere göre grupla
SELECT category, COUNT(*) as count FROM products GROUP BY category;

-- Çıkış
\q
```

---

### 3️⃣ Tarayıcıdan (Frontend)

En kolay yöntem! 

1. **http://localhost:5000** adresine git
2. **Products** sayfasına tıkla
3. Eklediğin tüm ürünler burada listelenecek!

---

## 💾 VOLUME KONUMU (Fiziksel Disk)

### Docker Volume Lokasyonu:

```powershell
# Volume'u bul
docker volume inspect postgres_data
```

Output'ta `Mountpoint` görünür, orada fiziksel olarak veriler saklanır.

**Windows'da genellikle:**
```
\\wsl$\docker-desktop-data\version-pack-data\community\docker\volumes\postgres_data\_data
```

---

## 📊 TÜM TABLOLARI GÖRME:

```powershell
docker exec -it erp_postgres psql -U postgres -d erp_db -c "\dt"
```

Bu tüm tabloları listeler:
- `users` - Kullanıcılar
- `products` - Ürünler
- `orders` - Siparişler
- `order_items` - Sipariş detayları
- `audit_logs` - İşlem logları
- `rag_knowledge` - RAG bilgisi

---

## 🔄 VOLUME BACKUP & RESTORE:

### Backup Alma:
```powershell
docker exec erp_postgres pg_dump -U postgres erp_db > backup.sql
```

### Backup'tan Restore:
```powershell
docker exec -i erp_postgres psql -U postgres erp_db < backup.sql
```

---

## 🎯 EN PRATİK YÖNTEM:

**Tarayıcı:** http://localhost:5000  
**Products** sayfasından tüm ürünleri görebilirsin! 🚀


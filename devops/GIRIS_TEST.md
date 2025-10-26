# 🎯 Giriş Testi - Son Düzeltme

## ✅ Düzeltilen Sorun

`User.js` model dosyasında `pool` import hatası düzeltildi.

## 🔄 Şimdi Yapmanız Gerekenler:

### 1. Backend Container'ı Restart
```powershell
docker restart erp_backend
```

Veya:
```powershell
cd devops
docker-compose -f docker-compose.dev.yml restart backend
```

### 2. Tarayıcıda Test Et

**URL:** http://localhost:5000

**Giriş Bilgileri:**
- Email: `admin@erp.local`
- Password: `admin123`

VEYA

- Username: `admin`
- Password: `admin123`

### 3. Başarılı Olursa

Ana sayfaya (Dashboard) yönlendirileceksiniz!

---

## 🔍 Logları İzlemek İçin

```powershell
docker logs erp_backend -f
```

---

## 📝 Diğer Kullanıcılar

- **Manager:**
  - Email: `manager@erp.local`
  - Password: `manager123`

- **User:**
  - Email: `user@erp.local`  
  - Password: `user123`


# 🤖 Llama2 Türkçe Fine-Tuning Rehberi

Bu dokümantasyon, ERP sistemi için Llama2 modelinin Türkçe dilinde nasıl fine-tuning edileceğini açıklamaktadır.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Kurulum](#kurulum)
3. [API Endpoints](#api-endpoints)
4. [Adım Adım Fine-Tuning](#adım-adım-fine-tuning)
5. [Model Testi](#model-testi)
6. [Troubleshooting](#troubleshooting)

---

## Gereksinimler

### Sistem Gereksinimleri
- **RAM:** Minimum 16GB (32GB önerilir)
- **GPU:** CUDA destekli NVIDIA GPU (opsiyonel ama önerilir)
- **Disk:** Minimum 50GB boş alan
- **İşletim Sistemi:** Linux, macOS veya Windows (WSL2)

### Yazılım Gereksinimleri
```bash
# Ollama kurulu olmalı
curl https://ollama.ai/install.sh | sh

# Llama2 modelini indir
ollama pull llama2

# Ollama servisini başlat
ollama serve
```

---

## Kurulum

### 1. Backend Servisi Başlatma
```bash
cd backend
npm install
npm start
```

### 2. Fine-Tuning Servisini İlklendir
```bash
curl -X POST http://localhost:5001/api/fine-tuning/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Bu işlem aşağıdaki dizinleri oluşturur:
- `backend/datasets/` - Eğitim veri setleri
- `backend/models/` - Fine-tuned modeller
- `backend/fine-tuning-logs/` - İşlem logları

---

## API Endpoints

### 1. **Initialize Service**
```http
POST /api/fine-tuning/initialize
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Fine-tuning service initialized"
}
```

---

### 2. **Generate Turkish ERP Dataset**
```http
POST /api/fine-tuning/dataset/generate
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "turkish_erp_dataset_1234567890.json",
    "count": 25,
    "filepath": "/path/to/dataset.json"
  },
  "message": "Turkish ERP dataset generated successfully"
}
```

**Dataset İçeriği:**
- 25+ Türkçe ERP örneği
- Ürün yönetimi, sipariş işlemleri, raporlama
- Doğal dil soruları ve yanıtları
- ERP best practices

---

### 3. **List Available Datasets**
```http
GET /api/fine-tuning/datasets
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "filename": "turkish_erp_dataset_1234567890.json",
        "size": 45678,
        "created": "2025-10-27T10:00:00Z",
        "examples_count": 25,
        "language": "tr"
      }
    ],
    "count": 1
  }
}
```

---

### 4. **Create Fine-Tuned Model**
```http
POST /api/fine-tuning/model/create
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "modelName": "llama2-turkish-erp",
  "datasetFilename": "turkish_erp_dataset_1234567890.json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modelName": "llama2-turkish-erp",
    "logPath": "/path/to/log.log"
  },
  "message": "Model llama2-turkish-erp created successfully"
}
```

**Not:** Bu işlem 5-10 dakika sürebilir.

---

### 5. **List All Models**
```http
GET /api/fine-tuning/models
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "llama2",
        "id": "abc123",
        "size": "3.8GB",
        "modified": "2 hours ago"
      },
      {
        "name": "llama2-turkish-erp",
        "id": "def456",
        "size": "3.9GB",
        "modified": "5 minutes ago"
      }
    ],
    "count": 2
  }
}
```

---

### 6. **Test Model**
```http
POST /api/fine-tuning/model/test
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "modelName": "llama2-turkish-erp",
  "prompt": "Stoktaki ürünleri nasıl listelerim?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": "llama2-turkish-erp",
    "prompt": "Stoktaki ürünleri nasıl listelerim?",
    "response": "Stokdaki ürünleri listelemek için Ürün Yönetimi menüsünden..."
  }
}
```

---

### 7. **Delete Model**
```http
DELETE /api/fine-tuning/model/llama2-turkish-erp
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Model llama2-turkish-erp deleted successfully"
}
```

---

### 8. **Get Statistics**
```http
GET /api/fine-tuning/statistics
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_datasets": 3,
    "total_models": 5,
    "total_logs": 10,
    "base_model": "llama2",
    "ollama_url": "http://localhost:11434"
  }
}
```

---

## Adım Adım Fine-Tuning

### Adım 1: Servisi İlklendir
```bash
curl -X POST http://localhost:5001/api/fine-tuning/initialize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Adım 2: Türkçe Dataset Oluştur
```bash
curl -X POST http://localhost:5001/api/fine-tuning/dataset/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Bu işlem `backend/datasets/` dizininde JSON formatında dataset oluşturur.

### Adım 3: Dataset'i İncele (Opsiyonel)
```bash
cat backend/datasets/turkish_erp_dataset_*.json | jq
```

### Adım 4: Fine-Tuned Model Oluştur
```bash
curl -X POST http://localhost:5001/api/fine-tuning/model/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "llama2-turkish-erp",
    "datasetFilename": "turkish_erp_dataset_1234567890.json"
  }'
```

**Bekleme Süresi:** 5-10 dakika

### Adım 5: Model'i Test Et
```bash
curl -X POST http://localhost:5001/api/fine-tuning/model/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "llama2-turkish-erp",
    "prompt": "Stoktaki ürünleri göster"
  }'
```

### Adım 6: Production'da Kullan
```bash
# .env dosyasında
OLLAMA_MODEL=llama2-turkish-erp

# Servisi yeniden başlat
npm restart
```

---

## Model Testi

### Test Soruları

#### 1. Ürün Yönetimi
```
Prompt: "Stoktaki ürünleri nasıl listelerim?"
Beklenen: Ürün listeme talimatları
```

#### 2. Sipariş İşlemleri
```
Prompt: "Yeni sipariş nasıl oluşturabilirim?"
Beklenen: Sipariş oluşturma adımları
```

#### 3. Raporlama
```
Prompt: "Bu ayki satış raporunu nasıl görebilirim?"
Beklenen: Rapor görüntüleme talimatları
```

#### 4. Sistem Kullanımı
```
Prompt: "Dashboard'da neler var?"
Beklenen: Dashboard özellikleri açıklaması
```

### Performans Metrikleri

**İyi bir fine-tuned model:**
- ✅ Türkçe dilbilgisi kurallarına uygun yanıtlar verir
- ✅ ERP terimleri doğru kullanılır
- ✅ Adım adım talimatlar net ve anlaşılır
- ✅ Yanıt süresi < 3 saniye
- ✅ Alakalı ve yardımcı yanıtlar

---

## Troubleshooting

### Problem 1: "Ollama not found"
```bash
# Çözüm: Ollama'yı yükleyin
curl https://ollama.ai/install.sh | sh
```

### Problem 2: "Model creation failed"
```bash
# Çözüm 1: Ollama servisini kontrol edin
ollama list

# Çözüm 2: Base model'i indirin
ollama pull llama2

# Çözüm 3: Logları kontrol edin
tail -f backend/fine-tuning-logs/*.log
```

### Problem 3: "Out of memory"
```bash
# Çözüm: Daha hafif model kullanın
OLLAMA_MODEL=llama2:7b  # 7B parametre (daha hafif)
```

### Problem 4: "Slow response times"
```bash
# Çözüm 1: GPU kullanın
nvidia-smi  # GPU kontrolü

# Çözüm 2: Parametre optimizasyonu
# Modelfile'da:
PARAMETER num_predict 256  # Daha kısa yanıtlar
PARAMETER temperature 0.5  # Daha deterministik
```

### Problem 5: "Turkish characters broken"
```bash
# Çözüm: UTF-8 encoding kontrolü
export LANG=tr_TR.UTF-8
export LC_ALL=tr_TR.UTF-8
```

---

## İleri Seviye Kullanım

### Custom Dataset Ekleme

```javascript
// backend/datasets/custom_dataset.json
{
  "version": "1.0",
  "language": "tr",
  "examples": [
    {
      "instruction": "Özel işlem",
      "input": "Kullanıcı sorusu",
      "output": "Beklenen yanıt"
    }
  ]
}
```

### Model Parametreleri

Modelfile'da ayarlanabilir parametreler:

```
PARAMETER temperature 0.7     # Kreativite (0-1)
PARAMETER top_p 0.9           # Çeşitlilik
PARAMETER top_k 40            # Token seçimi
PARAMETER num_predict 512     # Maksimum token sayısı
```

### Batch Fine-Tuning

Birden fazla dataset ile:

```bash
for dataset in backend/datasets/*.json; do
  curl -X POST http://localhost:5001/api/fine-tuning/model/create \
    -H "Authorization: Bearer TOKEN" \
    -d "{\"modelName\":\"model_$(basename $dataset .json)\",\"datasetFilename\":\"$(basename $dataset)\"}"
done
```

---

## Model Versiyonlama

```bash
# Versiyon numarası ile model oluştur
{
  "modelName": "llama2-turkish-erp-v1.0",
  "datasetFilename": "dataset.json"
}

# Versiyon karşılaştırması
curl http://localhost:5001/api/fine-tuning/models
```

---

## Yedekleme ve Geri Yükleme

### Model Yedekleme
```bash
ollama save llama2-turkish-erp > llama2-turkish-erp-backup.tar
```

### Model Geri Yükleme
```bash
ollama load llama2-turkish-erp < llama2-turkish-erp-backup.tar
```

---

## Kaynaklar

- [Ollama Documentation](https://ollama.ai/docs)
- [Llama2 Paper](https://arxiv.org/abs/2307.09288)
- [ERP Best Practices](https://www.erp.com/best-practices)

---

## Destek

Sorularınız için:
- GitHub Issues: https://github.com/yourusername/ErpFinaly/issues
- Email: support@yourcompany.com

---

**Son Güncelleme:** 27 Ekim 2025
**Versiyon:** 1.0.0

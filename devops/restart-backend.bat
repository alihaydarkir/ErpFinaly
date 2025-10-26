@echo off
echo 🔄 Backend container yeniden başlatılıyor...
docker-compose -f docker-compose.dev.yml restart backend
echo ✅ Backend yeniden başlatıldı!
pause


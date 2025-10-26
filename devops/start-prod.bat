@echo off

REM Production mode'da tüm servisleri başlat
echo 🚀 Production mode başlatılıyor...
docker-compose up -d

echo ✅ Servisler başlatıldı!
echo.
echo 📍 Erişim Adresleri:
echo    Frontend: http://localhost:5000
echo    Backend API: http://localhost:5001
echo.
echo 📋 Logları görmek için:
echo    docker-compose logs -f

pause


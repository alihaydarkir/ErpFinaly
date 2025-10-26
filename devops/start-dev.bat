@echo off

REM Development mode'da tüm servisleri başlat
echo 🚀 Development mode başlatılıyor...
docker-compose -f docker-compose.dev.yml up -d

echo ✅ Servisler başlatıldı!
echo.
echo 📍 Erişim Adresleri:
echo    Frontend: http://localhost:5000
echo    Backend API: http://localhost:5001
echo.
echo 📋 Logları görmek için:
echo    docker-compose -f docker-compose.dev.yml logs -f

pause


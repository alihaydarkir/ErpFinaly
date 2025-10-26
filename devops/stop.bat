@echo off

REM Docker servislerini durdur
echo 🛑 Servisler durduruluyor...
docker-compose down
docker-compose -f docker-compose.dev.yml down

echo ✅ Servisler durduruldu!

pause


# Tüm Docker Container'ları ve Bilgileri Göster

Write-Host "`n🐳 ÇALIŞAN CONTAINER'LAR:`n" -ForegroundColor Cyan
docker ps

Write-Host "`n📊 VOLUME'LAR (Kalıcı Veriler):`n" -ForegroundColor Cyan
docker volume ls

Write-Host "`n💾 Postgres Volume Detayı:`n" -ForegroundColor Yellow
docker volume inspect postgres_data | Select-Object Name, Mountpoint | Format-List

Write-Host "`n🔍 VERITABANI: products tablosu`n" -ForegroundColor Cyan
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT COUNT(*) as product_count FROM products;"

Write-Host "`n📦 ÜRÜNLERİ GÖRÜNTÜLE:`n" -ForegroundColor Green
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock, category FROM products LIMIT 10;"

Write-Host "`n📊 RUNTIME DURUM:`n" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5001" -ForegroundColor Green
Write-Host "Postgres: localhost:5432" -ForegroundColor Green
Write-Host "Redis:    localhost:6379" -ForegroundColor Green


# Ürünleri Görüntüleme Scripti

Write-Host "`n📦 VERİTABANI ÜRÜNLERİ`n" -ForegroundColor Cyan

Write-Host "📊 TOPLAM ÜRÜN SAYISI:" -ForegroundColor Yellow
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT COUNT(*) as total_products FROM products;"

Write-Host "`n📋 TÜM ÜRÜNLER:" -ForegroundColor Yellow
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock_quantity, category FROM products ORDER BY id DESC;"

Write-Host "`n💰 KATEGORİ BAZINDA:" -ForegroundColor Yellow
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT category, COUNT(*) as count FROM products GROUP BY category;"

Write-Host "`n✅ VERİLER PostgreSQL Volume'da saklanıyor!" -ForegroundColor Green
Write-Host "📍 Volume: postgres_data`n" -ForegroundColor White


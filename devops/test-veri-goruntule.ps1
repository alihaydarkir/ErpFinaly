Write-Host "`n🔍 VERİLERİ GÖRÜNTÜLENİYOR...`n" -ForegroundColor Cyan

# Son 10 ürünü göster
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, name, price, stock_quantity, category FROM products ORDER BY id DESC LIMIT 10;"

Write-Host "`n✅ Tamamlandı!`n" -ForegroundColor Green
Write-Host "📱 Tarayıcıda görüntülemek için:" -ForegroundColor Yellow
Write-Host "   http://localhost:5000/products`n" -ForegroundColor White


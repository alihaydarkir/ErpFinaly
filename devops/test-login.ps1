# Kullanıcıları kontrol et ve giriş testi
Write-Host "`n📊 Veritabanı Kontrolü`n" -ForegroundColor Cyan

# Kullanıcıları listele
Write-Host "🔍 Kullanıcılar:" -ForegroundColor Yellow
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, username, email, role, created_at FROM users;"

Write-Host "`n🔍 Ürünler:" -ForegroundColor Yellow
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT COUNT(*) as product_count FROM products;"

Write-Host "`n✅ Test Giriş Bilgileri:" -ForegroundColor Green
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host "URL: http://localhost:5000`n" -ForegroundColor White


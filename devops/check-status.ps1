# Docker Container Durumlarını Göster
Write-Host "`n🐳 ÇALIŞAN CONTAINER'LAR:`n" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n📊 DETAYLI BİLGİ:`n" -ForegroundColor Cyan

Write-Host "📦 PostgreSQL:" -ForegroundColor Yellow
docker ps | findstr postgres

Write-Host "`n📦 Redis:" -ForegroundColor Yellow
docker ps | findstr redis

Write-Host "`n📦 Backend:" -ForegroundColor Yellow
docker ps | findstr backend

Write-Host "`n📦 Frontend:" -ForegroundColor Yellow
docker ps | findstr frontend

Write-Host "`n✅ Container loglarını görmek için:" -ForegroundColor Green
Write-Host "docker logs erp_backend -f" -ForegroundColor White


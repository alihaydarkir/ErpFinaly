# ERP System Quick Start Script for Windows
# Run this in PowerShell: .\setup.ps1

Write-Host "🚀 ERP Sistemi Kurulumu Başlıyor..." -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker çalışmıyor. Lütfen Docker Desktop'ı başlatın." -ForegroundColor Red
    exit 1
}

# Navigate to devops directory
Set-Location -Path $PSScriptRoot\devops

# Create .env file if not exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 .env dosyası oluşturuluyor..." -ForegroundColor Yellow

    # Generate random secrets
    $DB_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})

    # Create .env content
    @"
# Database Configuration
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=erp_db

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application Configuration
NODE_ENV=production
FRONTEND_URL=http://localhost:5000

# Ollama AI Configuration
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama2

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
"@ | Out-File -FilePath .env -Encoding utf8

    Write-Host "✅ .env dosyası oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "✅ .env dosyası mevcut" -ForegroundColor Green
}

# Stop existing containers
Write-Host "🛑 Eski container'lar durduruluyor..." -ForegroundColor Yellow
docker compose down 2>$null

# Start Docker containers
Write-Host "🐳 Docker container'ları başlatılıyor..." -ForegroundColor Yellow
docker compose up -d

# Wait for services to be ready
Write-Host "⏳ Servisler hazırlanıyor (20 saniye)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Run database migrations
Write-Host "🗄️ Database migration'ları çalıştırılıyor..." -ForegroundColor Yellow
docker exec erp_backend node -e @"
const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log('Running:', file);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log('✅', file);
    }
    console.log('Migration tamamlandı!');
  } catch (err) {
    console.log('Migration uyarısı:', err.message);
  } finally {
    process.exit(0);
  }
}
runMigrations();
"@

# Create test users
Write-Host "👤 Test kullanıcıları oluşturuluyor..." -ForegroundColor Yellow
docker exec erp_backend node -e @"
const pool = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createUsers() {
  try {
    const users = [
      { email: 'admin@erp.local', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'manager@erp.local', password: 'manager123', name: 'Manager User', role: 'manager' },
      { email: 'user@erp.local', password: 'user123', name: 'Normal User', role: 'user' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES (\$1, \$2, \$3, \$4) ON CONFLICT (email) DO NOTHING',
        [user.email, hashedPassword, user.name, user.role]
      );
      console.log('✅', user.email);
    }
    console.log('Kullanıcılar oluşturuldu!');
  } catch (err) {
    console.log('Kullanıcı uyarısı:', err.message);
  } finally {
    process.exit(0);
  }
}
createUsers();
"@

# Check status
Write-Host ""
Write-Host "🎉 Kurulum Tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Servis Durumu:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "🌐 Erişim Adresleri:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:5000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5001" -ForegroundColor White

Write-Host ""
Write-Host "👤 Test Kullanıcıları:" -ForegroundColor Cyan
Write-Host "  Admin:   admin@erp.local / admin123" -ForegroundColor White
Write-Host "  Manager: manager@erp.local / manager123" -ForegroundColor White
Write-Host "  User:    user@erp.local / user123" -ForegroundColor White

Write-Host ""
Write-Host "📝 Logları Görüntüle:" -ForegroundColor Cyan
Write-Host "  docker compose logs -f backend" -ForegroundColor White

Write-Host ""
Write-Host "🛑 Servisleri Durdur:" -ForegroundColor Cyan
Write-Host "  docker compose down" -ForegroundColor White

Write-Host ""
Write-Host "✅ Sisteme giriş yapabilirsiniz: http://localhost:5000" -ForegroundColor Green

#!/bin/bash

# Hata durumunda script'i durdur
set -e

# ISO formatında tarih ve saat (colon yerine hyphen kullanıyoruz)
TZ='Europe/Istanbul' TIMESTAMP=$(date -u +"%Y-%m-%d-%H-%M-%S")

echo "🚀 Deployment başlıyor..."

# Local build
echo "📦 Local build yapılıyor..."
cd /Users/esrefatak/Documents/code/canyoldasi/api
npm run build

# Local'de dosyaları sıkıştırma
echo "📦 Local dosyalar sıkıştırılıyor..."
cp package.json dist/
cp package-lock.json dist/
cd dist
tar czf ../deploy_${TIMESTAMP}.tar.gz .
cd ..

# Dosyaları remote'a kopyalama
echo "📤 Dosyalar remote'a kopyalanıyor..."
scp deploy_${TIMESTAMP}.tar.gz root@recommed.co:/root/canyoldasi/

# Remote'da yedekleme ve dosyaları çıkartma
echo "💾 Remote klasör yedekleniyor ve dosyalar çıkartılıyor..."
ssh root@recommed.co "set -e && \
    rm -rf /root/canyoldasi/api/node_modules && \
    rm -rf /root/canyoldasi/api/entities && \
    tar czf /root/canyoldasi/api_remote_backup_${TIMESTAMP}.tar.gz /root/canyoldasi/api && \
    tar xzf /root/canyoldasi/deploy_${TIMESTAMP}.tar.gz -C /root/canyoldasi/api"

echo "✅ npm install yapın ve sonra pm2 reload can_yoldasi yapın!"

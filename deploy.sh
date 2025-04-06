#!/bin/bash

# Hata durumunda script'i durdur
set -e

# ISO formatında tarih ve saat (colon yerine hyphen kullanıyoruz)
TZ='Europe/Istanbul' TIMESTAMP=$(date -u +"%Y-%m-%d-%H-%M-%S")

echo "🚀 Deployment başlıyor..."

# Local build
echo "📦 Local build yapılıyor..."
cd /Users/esrefatak/Documents/code/agiletech/crm/api
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
scp deploy_${TIMESTAMP}.tar.gz root@recommed.co:/root/agiletech/crm/

# Remote'da yedekleme ve dosyaları çıkartma
echo "💾 Remote klasör yedekleniyor ve dosyalar çıkartılıyor..."
ssh root@recommed.co "set -e && \
    rm -rf /root/agiletech/crm/api/node_modules && \
    rm -rf /root/agiletech/crm/api/entities && \
    tar czf /root/agiletech/crm/api_remote_backup_${TIMESTAMP}.tar.gz /root/agiletech/crm/api && \
    tar xzf /root/agiletech/crm/deploy_${TIMESTAMP}.tar.gz -C /root/agiletech/crm/api"

echo "✅ npm install yapın ve sonra pm2 reload crm yapın!"

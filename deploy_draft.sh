#!/bin/bash

# Sunucu bilgileri
SERVER="root@recommed.co"
REMOTE_DIR="/root/canyoldasi/api"

# Yerel dizin
LOCAL_DIR="/Users/esrefatak/Documents/repo/canyoldasi/api/dist"

# Dosyaları senkronize et (node_modules hariç)
echo "Dosyalar kopyalanıyor..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' $LOCAL_DIR/ $SERVER:$REMOTE_DIR/

# Uzak sunucuda komutları çalıştır
echo "Uzak sunucuda build işlemi başlatılıyor..."
ssh $SERVER "cd $REMOTE_DIR && npm install && npm run build && pm2 restart can_yoldasi"

echo "Deploy tamamlandı!"

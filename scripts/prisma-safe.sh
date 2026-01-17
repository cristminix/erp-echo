#!/bin/bash

# Skrip keamanan untuk Prisma
# Mencegah penggunaan perintah destruktif secara tidak sengaja

COMMAND="$@"

# Memblokir --force-reset
if [[ "$COMMAND" == *"--force-reset"* ]]; then
    echo "❌ ERROR: --force-reset telah DIBLOKIR"
    echo "Perintah ini MENGHAPUS SEMUA DATA DATABASE"
    echo ""
    echo "Jika Anda benar-benar perlu melakukannya:"
    echo "1. Buat cadangan: pg_dump nama_database_anda > backup.sql"
    echo "2. Konfirmasi dengan menulis: SAYA_SETUJU_HAPUS_SEMUA"
    read -p "Tulis untuk mengonfirmasi: " confirmasi
    
    if [ "$confirmasi" != "SAYA_SETUJU_HAPUS_SEMUA" ]; then
        echo "❌ Operasi dibatalkan"
        exit 1
    fi
    
    echo "⚠️  Melanjutkan dengan --force-reset..."
fi

# Menjalankan perintah Prisma asli
npx prisma $COMMAND

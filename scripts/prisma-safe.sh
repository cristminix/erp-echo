#!/bin/bash

# Script de seguridad para Prisma
# Evita el uso accidental de comandos destructivos

COMMAND="$@"

# Bloquear --force-reset
if [[ "$COMMAND" == *"--force-reset"* ]]; then
    echo "❌ ERROR: --force-reset está BLOQUEADO"
    echo "Este comando ELIMINA TODA LA BASE DE DATOS"
    echo ""
    echo "Si realmente necesitas hacerlo:"
    echo "1. Haz un backup: pg_dump tu_database > backup.sql"
    echo "2. Confirma escribiendo: CONFIRMO_BORRAR_TODO"
    read -p "Escribe para confirmar: " confirmacion
    
    if [ "$confirmacion" != "CONFIRMO_BORRAR_TODO" ]; then
        echo "❌ Operación cancelada"
        exit 1
    fi
    
    echo "⚠️  Procediendo con --force-reset..."
fi

# Ejecutar el comando original de Prisma
npx prisma $COMMAND

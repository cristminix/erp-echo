'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  nif?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  isCustomer: boolean;
  isSupplier: boolean;
  active: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    { 
      key: 'name', 
      label: 'Nombre',
      sortable: true,
      searchable: true
    },
    { 
      key: 'nif', 
      label: 'NIF',
      sortable: true,
      searchable: true,
      render: (contact: Contact) => contact.nif || '-'
    },
    { 
      key: 'email', 
      label: 'Email',
      sortable: true,
      searchable: true,
      render: (contact: Contact) => contact.email || '-'
    },
    { 
      key: 'phone', 
      label: 'Teléfono',
      searchable: true,
      render: (contact: Contact) => contact.phone || '-'
    },
    { 
      key: 'city', 
      label: 'Ciudad',
      sortable: true,
      searchable: true,
      render: (contact: Contact) => contact.city || '-'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DataTable
        title="Contactos"
        data={contacts}
        columns={columns}
        createLink="/dashboard/contacts/new"
        createLabel="Nuevo Contacto"
        onEdit={(contact) => router.push(`/dashboard/contacts/${contact.id}`)}
        emptyMessage="No hay contactos registrados"
        showColumnToggle={false}
      />
    </div>
  );
}

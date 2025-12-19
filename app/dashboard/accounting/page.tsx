'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MenuCounts {
  journals: number;
  accounts: number;
  taxes: number;
  budgetItems: number;
  transactions: number;
}

export default function AccountingPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<MenuCounts>({ journals: 0, accounts: 0, taxes: 0, budgetItems: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  async function loadCounts() {
    try {
      // Obtener empresa activa
      const companyRes = await fetch('/api/companies');

      if (!companyRes.ok) {
        throw new Error('Error al cargar la empresa');
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        return;
      }

      // Cargar contadores en paralelo
      const [journalsRes, accountsRes, taxesRes, budgetItemsRes, transactionsRes] = await Promise.all([
        fetch(`/api/accounting/journals?companyId=${activeCompany.id}`),
        fetch(`/api/accounting/accounts?companyId=${activeCompany.id}`),
        fetch(`/api/accounting/taxes?companyId=${activeCompany.id}`),
        fetch(`/api/accounting/budget-items?companyId=${activeCompany.id}`),
        fetch(`/api/accounting/transactions?companyId=${activeCompany.id}`),
      ]);

      const [journals, accounts, taxes, budgetItems, transactions] = await Promise.all([
        journalsRes.ok ? journalsRes.json() : [],
        accountsRes.ok ? accountsRes.json() : [],
        taxesRes.ok ? taxesRes.json() : [],
        budgetItemsRes.ok ? budgetItemsRes.json() : [],
        transactionsRes.ok ? transactionsRes.json() : [],
      ]);

      setCounts({
        journals: journals.length || 0,
        accounts: accounts.length || 0,
        taxes: taxes.length || 0,
        budgetItems: budgetItems.length || 0,
        transactions: transactions.length || 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    {
      name: 'Diarios',
      href: '/dashboard/accounting/journal',
      count: counts.journals,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Cuentas Contables',
      href: '/dashboard/accounting/accounts',
      count: counts.accounts,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      name: 'Impuestos',
      href: '/dashboard/accounting/taxes',
      count: counts.taxes,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Partidas Presupuestarias',
      href: '/dashboard/accounting/budget-items',
      count: counts.budgetItems,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Transacciones',
      href: '/dashboard/accounting/transactions',
      count: counts.transactions,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Contabilidad</h1>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">{item.icon}</div>
                  <span className="text-lg font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                  {item.count}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

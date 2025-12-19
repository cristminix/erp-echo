"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BudgetItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export default function BudgetItemsPage() {
  const router = useRouter();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetItems();
  }, []);

  async function loadBudgetItems() {
    try {
      // Obtener empresa activa
      const companyRes = await fetch("/api/companies");

      if (!companyRes.ok) {
        throw new Error("Error al cargar la empresa");
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert("No hay empresa activa");
        return;
      }

      // Cargar partidas presupuestarias
      const res = await fetch(
        `/api/accounting/budget-items?companyId=${activeCompany.id}`
      );

      if (!res.ok) {
        throw new Error("Error al cargar las partidas presupuestarias");
      }

      const data = await res.json();
      setBudgetItems(data);
    } catch (error) {
      console.error("Error loading budget items:", error);
      alert("Error al cargar las partidas presupuestarias");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Partidas Presupuestarias</h1>
        <button
          onClick={() => router.push("/dashboard/accounting/budget-items/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Nueva Partida
        </button>
      </div>

      {budgetItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay partidas presupuestarias creadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/accounting/budget-items/${item.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

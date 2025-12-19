"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
}

export default function NewBudgetItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Cargar usuario actual
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const user = await userRes.json();
        setUserId(user.id);
      }

      // Cargar empresa activa
      const companyRes = await fetch("/api/companies");
      if (!companyRes.ok) {
        throw new Error("Error al cargar la empresa");
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert("No hay empresa activa");
        router.push("/dashboard/accounting/budget-items");
        return;
      }

      setCompany(activeCompany);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar los datos");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!company || !userId) {
      alert("No hay empresa activa o usuario");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/accounting/budget-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company.id,
          userId: userId,
          code: formData.code,
          name: formData.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la partida");
      }

      router.push("/dashboard/accounting/budget-items");
    } catch (error: any) {
      console.error("Error creating budget item:", error);
      alert(error.message || "Error al crear la partida presupuestaria");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-black">Nueva Partida Presupuestaria</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
              placeholder="Ej: PP001, PP002"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
              placeholder="Ej: Gastos de Personal, Material de Oficina"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Creando..." : "Crear Partida"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/accounting/budget-items")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

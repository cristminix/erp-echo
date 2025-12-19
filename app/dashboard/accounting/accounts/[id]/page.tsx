"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface Company {
  id: string;
  name: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  active: boolean;
}

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "asset",
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Cargar empresa activa
      const companyRes = await fetch("/api/companies");

      if (!companyRes.ok) {
        throw new Error("Error al cargar la empresa");
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert("No hay empresa activa");
        router.push("/dashboard/accounting/accounts");
        return;
      }

      setCompany(activeCompany);

      // Cargar cuenta
      const accountRes = await fetch(
        `/api/accounting/accounts/${accountId}`
      );

      if (!accountRes.ok) {
        throw new Error("Error al cargar la cuenta");
      }

      const account: Account = await accountRes.json();
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        active: account.active,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar los datos");
      router.push("/dashboard/accounting/accounts");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!company) {
      alert("No hay empresa activa");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company.id,
          code: formData.code,
          name: formData.name,
          type: formData.type,
          active: formData.active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar la cuenta");
      }

      router.push("/dashboard/accounting/accounts");
    } catch (error: any) {
      console.error("Error updating account:", error);
      alert(error.message || "Error al actualizar la cuenta contable");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) {
      return;
    }

    try {
      const res = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la cuenta");
      }

      router.push("/dashboard/accounting/accounts");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert(error.message || "Error al eliminar la cuenta");
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Editar Cuenta Contable</h1>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>

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
              placeholder="Ej: 1001, 4001"
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
              placeholder="Ej: Caja, Bancos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
            >
              <option value="asset">Activo</option>
              <option value="liability">Pasivo</option>
              <option value="equity">Patrimonio</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Cuenta activa
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/accounting/accounts")}
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

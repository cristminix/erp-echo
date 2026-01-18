"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/Button"

interface Product {
  id: string
  code: string
  name: string
  description?: string
  image?: string
  type: string
  price: number
  tax: number
  stock?: number
  category?: string
  unit: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Obtener empresa activa
      const companiesRes = await fetch("/api/companies")
      if (!companiesRes.ok) {
        console.error("Error fetching companies")
        setLoading(false)
        return
      }

      const companies = await companiesRes.json()
      const activeCompany = companies.find((c: any) => c.active)

      if (!activeCompany) {
        console.error("No active company")
        setLoading(false)
        return
      }

      const res = await fetch(`/api/products?companyId=${activeCompany.id}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: "code",
      label: "Kode",
      sortable: true,
      searchable: true,
    },
    {
      key: "name",
      label: "Produk",
      sortable: true,
      searchable: true,
    },
    {
      key: "type",
      label: "Jenis",
      sortable: true,
      render: (product: Product) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.type === "service"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {product.type === "service" ? "🔧 Layanan" : "📦 Dapat Disimpan"}
        </span>
      ),
    },
    {
      key: "price",
      label: "Harga",
      sortable: true,
      render: (product: Product) => `€${product.price.toFixed(2)}`,
    },
    {
      key: "tax",
      label: "Pajak",
      sortable: true,
      render: (product: Product) => `${product.tax}%`,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat produk...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <DataTable
        title="Produk"
        data={products}
        columns={columns}
        createLink="/dashboard/products/new"
        createLabel="Produk Baru"
        onEdit={(product) => router.push(`/dashboard/products/${product.id}`)}
        emptyMessage="Tidak ada produk terdaftar"
        showColumnToggle={false}
      />
    </div>
  )
}

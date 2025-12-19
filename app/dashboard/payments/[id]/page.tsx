'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface Contact {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Journal {
  id: string;
  code: string;
  name: string;
}

interface BudgetItem {
  id: string;
  code: string;
  name: string;
}

interface Property {
  id: string;
  code: string;
  address: string;
}

interface Payment {
  id: string;
  number: string;
  type: 'ENTRADA' | 'SALIDA';
  estado: 'BORRADOR' | 'VALIDADO';
  amount: number;
  date: string;
  contactId?: string;
  projectId?: string;
  journalId?: string;
  description?: string;
  concepto?: string;
  budgetItemId?: string;
  propertyId?: string;
  contact?: Contact;
  project?: Project;
  journal?: Journal;
  budgetItem?: BudgetItem;
  property?: Property;
}

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { primaryColor } = useTheme();
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'ENTRADA' as 'ENTRADA' | 'SALIDA',
    estado: 'BORRADOR' as 'BORRADOR' | 'VALIDADO',
    amount: '',
    date: '',
    contactId: '',
    projectId: '',
    journalId: '',
    description: '',
    concepto: '',
    budgetItemId: '',
    propertyId: '',
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    if (companyId && id) {
      loadPayment();
      loadData();
    }
  }, [companyId, id]);

  const loadCompany = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const companies = await res.json();
        const activeCompany = companies.find((c: any) => c.active);
        if (activeCompany) {
          setCompanyId(activeCompany.id);
        }
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data);
        setFormData({
          type: data.type,
          estado: data.estado,
          amount: String(data.amount),
          date: data.date.split('T')[0],
          contactId: data.contactId || '',
          projectId: data.projectId || '',
          journalId: data.journalId || '',
          description: data.description || '',
          concepto: data.concepto || '',
          budgetItemId: data.budgetItemId || '',
          propertyId: data.propertyId || '',
        });
      } else {
        setError('Error al cargar el pago');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      setError('Error al cargar el pago');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!companyId) return;

    try {
      // Cargar contactos
      const contactsRes = await fetch(`/api/contacts?companyId=${companyId}`);
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      // Cargar proyectos
      const projectsRes = await fetch(`/api/projects?companyId=${companyId}`);
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }

      // Cargar diarios
      const journalsRes = await fetch(`/api/accounting/journals?companyId=${companyId}`);
      if (journalsRes.ok) {
        const journalsData = await journalsRes.json();
        setJournals(journalsData);
      }

      // Cargar partidas presupuestarias
      const budgetItemsRes = await fetch(`/api/accounting/budget-items?companyId=${companyId}`);
      if (budgetItemsRes.ok) {
        const budgetItemsData = await budgetItemsRes.json();
        setBudgetItems(budgetItemsData);
      }

      // Cargar propiedades
      const propertiesRes = await fetch(`/api/properties?companyId=${companyId}`);
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('El importe debe ser mayor que 0');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          estado: formData.estado,
          amount: Number(formData.amount),
          date: formData.date,
          contactId: formData.contactId || null,
          projectId: formData.projectId || null,
          journalId: formData.journalId || null,
          description: formData.description || null,
          concepto: formData.concepto || null,
          budgetItemId: formData.budgetItemId || null,
          propertyId: formData.propertyId || null,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/payments');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar el pago');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setError('Error al actualizar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este pago?')) {
      return;
    }

    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/payments');
      } else {
        alert('Error al eliminar el pago');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error al eliminar el pago');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Pago no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Pago</h1>
        <p className="text-gray-600 mt-1">Número: {payment.number}</p>
        <p className="text-gray-600">
          Tipo: <span className={`font-semibold ${payment.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
            {payment.type === 'ENTRADA' ? 'Entrada (Cobro)' : 'Salida (Pago)'}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Tipo y Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pago *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ENTRADA' | 'SALIDA' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              required
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'BORRADOR' | 'VALIDADO' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
            >
              <option value="BORRADOR">Borrador</option>
              <option value="VALIDADO">Validado</option>
            </select>
          </div>
        </div>

        {/* Importe y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importe *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
            />
          </div>
        </div>

        {/* Contacto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contacto
          </label>
          <select
            value={formData.contactId}
            onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
          >
            <option value="">Seleccionar contacto (opcional)</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>

        {/* Proyecto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proyecto
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
          >
            <option value="">Seleccionar proyecto (opcional)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Diario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diario Contable
          </label>
          <select
            value={formData.journalId}
            onChange={(e) => setFormData({ ...formData, journalId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
          >
            <option value="">Seleccionar diario (opcional)</option>
            {journals.map((journal) => (
              <option key={journal.id} value={journal.id}>
                {journal.code} - {journal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concepto
          </label>
          <input
            type="text"
            value={formData.concepto}
            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
            placeholder="Concepto del pago"
          />
        </div>

        {/* Partida Presupuestaria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Partida Presupuestaria
          </label>
          <select
            value={formData.budgetItemId}
            onChange={(e) => setFormData({ ...formData, budgetItemId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
          >
            <option value="">Seleccionar partida (opcional)</option>
            {budgetItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Propiedad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Propiedad
          </label>
          <select
            value={formData.propertyId}
            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
          >
            <option value="">Seleccionar propiedad (opcional)</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.code} - {property.address}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-gray-900"
            rows={3}
            placeholder="Descripción del pago (opcional)"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Eliminar
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/payments')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

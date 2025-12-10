'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import ImportInvoices from '@/components/ImportInvoices';

interface Backup {
  id: string;
  name: string;
  size: number;
  createdBy: string;
  createdAt: string;
}

interface OdooConfig {
  odooUrl: string;
  odooDb: string;
  odooUsername: string;
  odooPassword: string;
  odooVersion: string;
  odooPort: string;
  odooEnabled: boolean;
  odooCreateInvoiceOnSale: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  
  // Estados para API Token
  const [apiToken, setApiToken] = useState<string>('');
  const [apiEnabled, setApiEnabled] = useState<boolean>(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  
  // Estados para Odoo
  const [odooConfig, setOdooConfig] = useState<OdooConfig>({
    odooUrl: '',
    odooDb: '',
    odooUsername: '',
    odooPassword: '',
    odooVersion: '17',
    odooPort: '8069',
    odooEnabled: false,
    odooCreateInvoiceOnSale: false,
  });
  const [loadingOdoo, setLoadingOdoo] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [importLimit, setImportLimit] = useState('0');
  const [stats, setStats] = useState({ products: 0, contacts: 0 });
  const [hasStoredPassword, setHasStoredPassword] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchOdooConfig();
    fetchStats();
    fetchActiveCompany();
  }, []);

  useEffect(() => {
    if (activeCompanyId) {
      fetchApiToken();
    }
  }, [activeCompanyId]);

  const fetchActiveCompany = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const companies = await response.json();
        const activeCompany = companies.find((c: any) => c.active);
        if (activeCompany) {
          setActiveCompanyId(activeCompany.id);
        }
      }
    } catch (err) {
      console.error('Error al cargar empresa activa:', err);
    }
  };

  const fetchApiToken = async () => {
    if (!activeCompanyId) return;
    
    try {
      const response = await fetch(`/api/companies/${activeCompanyId}/api-token`);
      if (response.ok) {
        const data = await response.json();
        setApiToken(data.apiKey || '');
        setApiEnabled(data.apiEnabled || false);
      }
    } catch (err) {
      console.error('Error al cargar token:', err);
    }
  };

  const handleGenerateToken = async () => {
    if (!activeCompanyId) {
      alert('No hay empresa activa');
      return;
    }
    
    console.log('Generando token para empresa:', activeCompanyId);
    setLoadingToken(true);
    
    try {
      const response = await fetch(`/api/companies/${activeCompanyId}/api-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Respuesta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Token recibido:', data);
        setApiToken(data.apiKey);
        setApiEnabled(data.apiEnabled);
        alert('Token generado exitosamente');
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        alert(`Error: ${errorData.error || 'Error al generar token'}`);
      }
    } catch (err) {
      console.error('Error al generar token:', err);
      alert('Error al generar token: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoadingToken(false);
    }
  };

  const handleToggleApi = async () => {
    setLoadingToken(true);
    try {
      const response = await fetch(`/api/companies/${activeCompanyId}/api-token`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiEnabled: !apiEnabled }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiEnabled(data.apiEnabled);
      }
    } catch (err) {
      console.error('Error al cambiar estado de API:', err);
    } finally {
      setLoadingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleDeleteToken = async () => {
    if (!confirm('¿Estás seguro de eliminar el token? Las aplicaciones que lo usan dejarán de funcionar.')) {
      return;
    }
    
    setLoadingToken(true);
    try {
      const response = await fetch(`/api/companies/${activeCompanyId}/api-token`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setApiToken('');
        setApiEnabled(false);
        alert('Token eliminado exitosamente');
      }
    } catch (err) {
      console.error('Error al eliminar token:', err);
      alert('Error al eliminar token');
    } finally {
      setLoadingToken(false);
    }
  };

  const fetchBackups = async () => {
    try {
      console.log('Cargando lista de respaldos...');
      const response = await fetch('/api/backup/list');
      console.log('Respuesta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Respaldos recibidos:', data);
        setBackups(data);
      } else {
        const errorText = await response.text();
        console.error('Error en respuesta:', errorText);
        setError('Error al cargar respaldos');
      }
    } catch (err) {
      console.error('Error al cargar respaldos:', err);
      setError('Error al cargar respaldos');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al crear respaldo');
      }

      // Verificar si es JSON o un archivo para descargar
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        setMessage(data.message || 'Respaldo creado correctamente');
        
        // Recargar lista de respaldos
        fetchBackups();
      } else {
        // Es un archivo para descargar (fallback si no se pudo guardar en BD)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage('Respaldo descargado (no se pudo guardar en la base de datos)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar respaldo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestoreFromId = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este respaldo? Esto eliminará todos los datos actuales.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al restaurar respaldo');
      }

      setMessage('Respaldo restaurado exitosamente. Recargando página...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este respaldo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar respaldo');
      }

      setMessage('Respaldo eliminado correctamente');
      fetchBackups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fetchOdooConfig = async () => {
    try {
      const response = await fetch('/api/odoo/config');
      if (response.ok) {
        const data = await response.json();
        setOdooConfig({
          odooUrl: data.odooUrl || '',
          odooDb: data.odooDb || '',
          odooUsername: data.odooUsername || '',
          odooPassword: data.hasPassword ? '••••••••' : '',
          odooVersion: data.odooVersion || '17',
          odooPort: data.odooPort || '8069',
          odooEnabled: data.odooEnabled || false,
          odooCreateInvoiceOnSale: data.odooCreateInvoiceOnSale || false,
        });
        setHasStoredPassword(data.hasPassword || false);
        console.log('🔐 Configuración cargada. Contraseña guardada:', data.hasPassword);
      }
    } catch (err) {
      console.error('Error al cargar configuración Odoo:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // Obtener companyId del localStorage o estado global
      const companyId = localStorage.getItem('selectedCompanyId');
      if (!companyId) return;

      const [productsRes, contactsRes] = await Promise.all([
        fetch(`/api/products?companyId=${companyId}`),
        fetch(`/api/contacts?companyId=${companyId}`)
      ]);

      if (productsRes.ok && contactsRes.ok) {
        const products = await productsRes.json();
        const contacts = await contactsRes.json();
        setStats({
          products: products.length || 0,
          contacts: contacts.length || 0
        });
        console.log('📊 Estadísticas actuales:', { products: products.length, contacts: contacts.length });
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const handleSaveOdooConfig = async () => {
    setLoadingOdoo(true);
    setMessage('');
    setError('');

    try {
      // Si la contraseña son solo asteriscos, no enviarla (mantener la actual)
      const configToSave = { ...odooConfig };
      if (configToSave.odooPassword === '••••••••') {
        configToSave.odooPassword = '';
      }

      // Activar automáticamente si todos los campos están completos
      const hasAllFields = configToSave.odooUrl && configToSave.odooDb && 
                          configToSave.odooUsername && 
                          (configToSave.odooPassword || hasStoredPassword);
      
      if (hasAllFields && !configToSave.odooEnabled) {
        configToSave.odooEnabled = true;
        console.log('✅ Activando Odoo automáticamente porque todos los campos están completos');
      }

      const response = await fetch('/api/odoo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Configuración de Odoo guardada correctamente' + (hasAllFields && !odooConfig.odooEnabled ? ' (Odoo activado automáticamente)' : ''));
        // Recargar config para actualizar el estado de la contraseña
        await fetchOdooConfig();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar configuración');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setLoadingOdoo(false);
    }
  };

  const handleTestConnection = async () => {
    if (!odooConfig.odooUrl || !odooConfig.odooDb || !odooConfig.odooUsername || (!odooConfig.odooPassword && !hasStoredPassword)) {
      setError('Por favor completa todos los campos antes de probar la conexión');
      return;
    }

    setTestingConnection(true);
    setMessage('');
    setError('');

    try {
      // Si la contraseña son asteriscos, enviar vacío para usar la guardada
      const configToTest = { ...odooConfig };
      if (configToTest.odooPassword === '••••••••') {
        configToTest.odooPassword = '';
      }

      const response = await fetch('/api/odoo/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToTest),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Conexión exitosa con Odoo');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al conectar con Odoo');
      }
    } catch (err: any) {
      setError(err.message || 'Error al probar la conexión');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleImportFromOdoo = async () => {
    if (!odooConfig.odooEnabled) {
      setError('Debes activar y guardar la configuración de Odoo primero');
      return;
    }

    const limit = parseInt(importLimit) || 0;

    setImporting(true);
    setMessage('');
    setError('');

    try {
      // Importar productos
      const productsResponse = await fetch('/api/odoo/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit }),
      });

      // Importar contactos
      const contactsResponse = await fetch('/api/odoo/import-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit }),
      });

      const productsData = productsResponse.ok ? await productsResponse.json() : null;
      const contactsData = contactsResponse.ok ? await contactsResponse.json() : null;

      console.log('📦 Respuesta productos:', productsData);
      console.log('👥 Respuesta contactos:', contactsData);

      if (productsData && contactsData) {
        setMessage(`✅ Importación completada. ${productsData.message || 'Productos importados'}. ${contactsData.message || 'Contactos importados'}`);
        
        // Mostrar información de debug
        if (productsData.debug) console.log('🔍 Debug productos:', productsData.debug);
        if (contactsData.debug) console.log('🔍 Debug contactos:', contactsData.debug);
        
        // Mostrar errores si hay
        if (productsData.errors?.length) console.error('❌ Errores productos:', productsData.errors);
        if (contactsData.errors?.length) console.error('❌ Errores contactos:', contactsData.errors);
      } else if (productsData) {
        setMessage(`⚠️ Productos importados correctamente. Error al importar contactos.`);
        console.log('🔍 Debug productos:', productsData.debug);
      } else if (contactsData) {
        setMessage(`⚠️ Contactos importados correctamente. Error al importar productos.`);
        console.log('🔍 Debug contactos:', contactsData.debug);
      } else {
        let errorMsg = 'Error al importar datos desde Odoo';
        try {
          if (!productsResponse.ok) {
            const errorData = await productsResponse.json();
            console.error('❌ Error productos:', errorData);
            console.error('❌ Error productos (JSON):', JSON.stringify(errorData, null, 2));
            if (errorData.details) {
              errorMsg = `Error en productos: ${errorData.details}`;
            } else if (errorData.missing) {
              errorMsg = `Configuración incompleta. Faltan: ${errorData.missing.join(', ')}`;
            } else if (errorData.error) {
              errorMsg = `Error: ${errorData.error}`;
            }
          } else if (!contactsResponse.ok) {
            const errorData = await contactsResponse.json();
            console.error('❌ Error contactos:', errorData);
            console.error('❌ Error contactos (JSON):', JSON.stringify(errorData, null, 2));
            if (errorData.details) {
              errorMsg = `Error en contactos: ${errorData.details}`;
            } else if (errorData.error) {
              errorMsg = `Error: ${errorData.error}`;
            }
          }
        } catch (e) {
          console.error('❌ Error al parsear respuesta:', e);
        }
        setError(errorMsg);
      }
      
      // Recargar estadísticas después de importar
      setTimeout(() => fetchStats(), 1000);
    } catch (err: any) {
      setError(err.message || 'Error al importar desde Odoo');
    } finally {
      setImporting(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
      setError('Por favor selecciona un archivo JSON (.json)');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al restaurar respaldo');
      }

      setMessage('Respaldo restaurado exitosamente. Recargando página...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Configuración General</h1>
        <p className="text-gray-600 mt-2">Administra las configuraciones y herramientas del sistema</p>
      </div>

      {/* Mensajes */}
      {message && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Sección de Configuración Odoo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Integración con Odoo</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Conecta con tu instancia de Odoo para importar productos y contactos automáticamente.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Odoo *
              </label>
              <input
                type="url"
                placeholder="https://tu-instancia.odoo.com"
                value={odooConfig.odooUrl}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto *
              </label>
              <input
                type="text"
                placeholder="8069"
                value={odooConfig.odooPort}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooPort: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versión *
              </label>
              <select
                value={odooConfig.odooVersion}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooVersion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-black"
              >
                {[...Array(19)].map((_, i) => {
                  const version = (i + 1).toString();
                  return (
                    <option key={version} value={version}>
                      v{version}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base de Datos *
              </label>
              <input
                type="text"
                placeholder="nombre_db"
                value={odooConfig.odooDb}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooDb: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario *
              </label>
              <input
                type="text"
                placeholder="admin@ejemplo.com"
                value={odooConfig.odooUsername}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooUsername: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña / API Key *
                {hasStoredPassword && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    ✓ Contraseña guardada (dejar vacío para mantener)
                  </span>
                )}
              </label>
              <input
                type="password"
                placeholder={hasStoredPassword ? "Dejar vacío para mantener actual" : "••••••••"}
                value={odooConfig.odooPassword}
                onChange={(e) => setOdooConfig({ ...odooConfig, odooPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="odooEnabled"
              checked={odooConfig.odooEnabled}
              onChange={(e) => setOdooConfig({ ...odooConfig, odooEnabled: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="odooEnabled" className="ml-2 text-sm text-gray-700">
              Activar integración con Odoo
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="odooCreateInvoiceOnSale"
              checked={odooConfig.odooCreateInvoiceOnSale}
              onChange={(e) => setOdooConfig({ ...odooConfig, odooCreateInvoiceOnSale: e.target.checked })}
              disabled={!odooConfig.odooEnabled}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
            />
            <label htmlFor="odooCreateInvoiceOnSale" className={`ml-2 text-sm ${odooConfig.odooEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
              Crear factura de venta en Odoo automáticamente desde POS (en borrador)
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              loading={testingConnection}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Probar Conexión
            </Button>

            <Button
              onClick={handleSaveOdooConfig}
              variant="primary"
              loading={loadingOdoo}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Configuración
            </Button>
          </div>

          {odooConfig.odooEnabled && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Importar Datos desde Odoo</h3>
                
                {/* Estadísticas actuales */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Registros actuales en la base de datos:</p>
                  <div className="flex gap-6">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-purple-600">{stats.products}</span>
                      <span className="text-sm text-gray-600 ml-2">Productos</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-blue-600">{stats.contacts}</span>
                      <span className="text-sm text-gray-600 ml-2">Contactos</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de registros (0 = todos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={importLimit}
                    onChange={(e) => setImportLimit(e.target.value)}
                    className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = importar todos los registros | 10 = importar solo 10 registros
                  </p>
                </div>

                <Button
                  onClick={handleImportFromOdoo}
                  variant="primary"
                  loading={importing}
                  disabled={!odooConfig.odooEnabled}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Importar Productos y Contactos
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-semibold">Información</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Se importarán productos y contactos desde Odoo usando XML-RPC. Si el límite es 0, se importarán todos los registros. Asegúrate de tener los permisos necesarios en tu instancia de Odoo.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección de Importar Facturas desde Excel */}
      {activeCompanyId && (
        <div className="mb-6">
          <ImportInvoices companyId={activeCompanyId} />
        </div>
      )}

      {/* Sección de API Genérica */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-teal-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">API Genérica REST</h2>
          </div>
          {apiToken && (
            <label className="flex items-center cursor-pointer">
              <span className="mr-3 text-sm font-medium text-gray-700">
                {apiEnabled ? 'API Habilitada' : 'API Deshabilitada'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={apiEnabled}
                  onChange={handleToggleApi}
                  disabled={loadingToken}
                  className="sr-only"
                />
                <div className={`block w-14 h-8 rounded-full transition ${apiEnabled ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${apiEnabled ? 'translate-x-6' : ''}`}></div>
              </div>
            </label>
          )}
        </div>

        <p className="text-gray-600 mb-4">
          Accede a todas las tablas de la base de datos mediante API REST con autenticación por token.
        </p>

        {!apiToken ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p className="text-gray-600 mb-4">No hay token de API generado</p>
            <button
              onClick={handleGenerateToken}
              disabled={loadingToken}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loadingToken ? 'Generando...' : 'Generar Token de API'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Token de API</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToken}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    {tokenCopied ? '✓ Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleGenerateToken}
                    disabled={loadingToken}
                    className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition disabled:opacity-50"
                  >
                    Regenerar
                  </button>
                  <button
                    onClick={handleDeleteToken}
                    disabled={loadingToken}
                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 rounded px-4 py-3 font-mono text-sm overflow-x-auto">
                {apiToken}
              </div>
              {!apiEnabled && (
                <p className="text-sm text-red-600 mt-2">⚠️ La API está deshabilitada. Actívala para usar este token.</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">📖 Modelos Disponibles</h3>
            <div className="flex flex-wrap gap-2">
              {['user', 'company', 'contact', 'product', 'invoice', 'invoiceItem', 'attendance'].map((model) => (
                <span key={model} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono">
                  {model}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">🔗 Endpoints</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 font-mono text-sm">
              <div>
                <span className="text-green-600 font-semibold">GET</span>
                <span className="text-gray-700 ml-2">/api/generic/&#123;modelo&#125;</span>
                <p className="text-xs text-gray-500 mt-1 ml-12">Leer registros (con paginación y filtros)</p>
              </div>
              <div>
                <span className="text-blue-600 font-semibold">POST</span>
                <span className="text-gray-700 ml-2">/api/generic/&#123;modelo&#125;</span>
                <p className="text-xs text-gray-500 mt-1 ml-12">Crear nuevo registro</p>
              </div>
              <div>
                <span className="text-yellow-600 font-semibold">PUT</span>
                <span className="text-gray-700 ml-2">/api/generic/&#123;modelo&#125;</span>
                <p className="text-xs text-gray-500 mt-1 ml-12">Actualizar registro existente</p>
              </div>
              <div>
                <span className="text-red-600 font-semibold">DELETE</span>
                <span className="text-gray-700 ml-2">/api/generic/&#123;modelo&#125;?id=&#123;id&#125;</span>
                <p className="text-xs text-gray-500 mt-1 ml-12">Eliminar registro</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">💡 Ejemplo de uso</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs">
{`# Listar productos
curl -X GET "http://localhost:3000/api/generic/product" \\
  -H "Authorization: Bearer tu-token-secreto"

# Crear contacto
curl -X POST "http://localhost:3000/api/generic/contact" \\
  -H "Authorization: Bearer tu-token-secreto" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "isCustomer": true,
    "userId": "xxx",
    "companyId": "xxx"
  }'

# Actualizar producto
curl -X PUT "http://localhost:3000/api/generic/product" \\
  -H "Authorization: Bearer tu-token-secreto" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "xxx",
    "price": 99.99,
    "stock": 50
  }'`}
              </pre>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-semibold">Seguridad</p>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                  <li>Mantén el token seguro y nunca lo compartas</li>
                  <li>Usa HTTPS en producción</li>
                  <li>Registra todas las peticiones para auditoría</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <a 
              href="/GENERIC_API.md"
              target="_blank"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Documentación Completa
            </a>
          </div>
        </div>
      </div>

      {/* Sección de Respaldo y Restauración */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-teal-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Respaldo y Restauración</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Crea un respaldo completo de tu base de datos o restaura uno existente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Crear Respaldo */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Crear Respaldo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Descarga un respaldo completo de todos los datos (formato JSON).
            </p>
            <Button
              onClick={handleBackup}
              variant="primary"
              loading={loading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Descargar Respaldo
            </Button>
          </div>

          {/* Restaurar Respaldo */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Restaurar Respaldo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Carga un archivo JSON para restaurar todos los datos.
            </p>
            <label className="w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={loading}
                className="hidden"
              />
              <div className={`w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition cursor-pointer text-center font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Cargar Respaldo
              </div>
            </label>
          </div>
        </div>

        {/* Advertencia */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800 font-semibold">Importante</p>
              <p className="text-sm text-yellow-700 mt-1">
                Restaurar un respaldo eliminará todos los datos actuales y los reemplazará con los del archivo. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Respaldos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-teal-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Respaldos Guardados</h2>
        </div>

        {loadingBackups ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando respaldos...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">No hay respaldos guardados</p>
            <p className="text-sm text-gray-400 mt-1">Crea tu primer respaldo para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tamaño</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium text-gray-800">{backup.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(backup.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Descargar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRestoreFromId(backup.id)}
                          disabled={loading}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                          title="Restaurar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

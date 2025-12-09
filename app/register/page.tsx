'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();

  // Verificar si el registro está permitido
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== 'true') {
      router.push('/login');
    }
  }, [router]);

  // Si el registro no está permitido, no mostrar nada
  if (process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== 'true') {
    return null;
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      // Si requiere verificación, mostrar formulario de código
      if (data.requiresVerification) {
        setUserId(data.userId);
        setShowVerification(true);
      } else {
        // Si no requiere verificación, redirigir al dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar código');
      }

      alert('Código reenviado correctamente');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">FalconERP</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/blog">
                <button className="px-4 py-2 text-gray-700 hover:text-teal-600 font-medium">
                  Blog
                </button>
              </Link>
              <Link href="/login">
                <button className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium">
                  Iniciar Sesión
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md">

        {/* Card de Registro o Verificación */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!showVerification ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Crear Cuenta
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@empresa.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  loading={loading}
                >
                  Crear Cuenta
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Verifica tu Email
                </h2>
                <p className="text-gray-600">
                  Hemos enviado un código de 6 dígitos a tu correo electrónico
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Verificación
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                >
                  Verificar
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-teal-600 font-semibold hover:text-teal-700 disabled:opacity-50"
                >
                  {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                </button>
              </div>
            </>
          )}
        </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">FalconERP</span>
              </div>
              <p className="text-gray-400">
                Sistema ERP simple y completo para tu negocio
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white">Inicio</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Términos y Condiciones</li>
                <li>Política de Privacidad</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 FalconERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

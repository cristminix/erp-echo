'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color: string;
  startDate: string | null;
  endDate: string | null;
}

type ViewMode = 'day' | 'month' | 'year';

export default function ProjectsCalendarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (activeCompany) {
        const res = await fetch(`/api/projects?companyId=${activeCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.filter((p: Project) => p.endDate));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectsForDate = (date: Date) => {
    return projects.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate.toDateString() === date.toDateString();
    });
  };

  const getProjectsForMonth = (month: number, year: number) => {
    return projects.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate.getMonth() === month && endDate.getFullYear() === year;
    });
  };

  const getProjectsForYear = (year: number) => {
    return projects.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate.getFullYear() === year;
    });
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderDayView = () => {
    const projectsToday = getProjectsForDate(currentDate);

    return (
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Proyectos que finalizan el {currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          {projectsToday.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay proyectos programados para finalizar en este día
            </p>
          ) : (
            <div className="space-y-2">
              {projectsToday.map(project => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <div className="p-4 rounded-lg border-l-4 hover:bg-gray-50 cursor-pointer" style={{ borderColor: project.color }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{project.name}</h4>
                        {project.description && (
                          <p className="text-sm text-gray-600">{project.description}</p>
                        )}
                        {project.startDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Inicio: {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const projectsThisMonth = getProjectsForMonth(month, year);

    // Obtener días del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>

          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 p-2 text-sm">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2"></div>;
              }

              const date = new Date(year, month, day);
              const projectsOnDay = getProjectsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  className={`p-2 min-h-20 border rounded-lg ${isToday ? 'bg-teal-50 border-teal-300' : 'border-gray-200'} ${projectsOnDay.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => {
                    if (projectsOnDay.length > 0) {
                      setCurrentDate(date);
                      setViewMode('day');
                    }
                  }}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-teal-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {projectsOnDay.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {projectsOnDay.slice(0, 2).map(project => (
                        <div
                          key={project.id}
                          className="text-xs p-1 rounded truncate"
                          style={{ backgroundColor: project.color + '20', color: project.color }}
                        >
                          {project.name}
                        </div>
                      ))}
                      {projectsOnDay.length > 2 && (
                        <div className="text-xs text-gray-500">+{projectsOnDay.length - 2} más</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {projectsThisMonth.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-2">
                Resumen del mes ({projectsThisMonth.length} proyecto{projectsThisMonth.length !== 1 ? 's' : ''})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {projectsThisMonth.map(project => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                      <span className="text-sm text-gray-700">{project.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(project.endDate!).getDate()}/{new Date(project.endDate!).getMonth() + 1}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const projectsThisYear = getProjectsForYear(year);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">{year}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthNames.map((monthName, monthIndex) => {
              const projectsInMonth = projectsThisYear.filter(p => {
                const endDate = new Date(p.endDate!);
                return endDate.getMonth() === monthIndex;
              });

              return (
                <div
                  key={monthIndex}
                  className={`p-4 border rounded-lg ${projectsInMonth.length > 0 ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}`}
                  onClick={() => {
                    if (projectsInMonth.length > 0) {
                      setCurrentDate(new Date(year, monthIndex, 1));
                      setViewMode('month');
                    }
                  }}
                >
                  <h4 className="font-semibold text-gray-700 mb-2">{monthName}</h4>
                  {projectsInMonth.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin proyectos</p>
                  ) : (
                    <div className="space-y-1">
                      {projectsInMonth.slice(0, 3).map(project => (
                        <div key={project.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                          <span className="text-sm text-gray-700 truncate">{project.name}</span>
                        </div>
                      ))}
                      {projectsInMonth.length > 3 && (
                        <p className="text-xs text-gray-500 ml-4">+{projectsInMonth.length - 3} más</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {projectsThisYear.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-2">
                Total del año: {projectsThisYear.length} proyecto{projectsThisYear.length !== 1 ? 's' : ''}
              </h4>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📅 Calendario de Proyectos</h1>
          <p className="text-gray-600 mt-1">Visualiza las fechas de finalización de tus proyectos</p>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="secondary">← Volver a Proyectos</Button>
        </Link>
      </div>

      {/* Controles del Calendario */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'day' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('day')}
            >
              Día
            </Button>
            <Button
              variant={viewMode === 'month' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('month')}
            >
              Mes
            </Button>
            <Button
              variant={viewMode === 'year' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('year')}
            >
              Año
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ◀
            </button>
            <Button onClick={goToToday} variant="secondary">
              Hoy
            </Button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      </Card>

      {/* Vista del Calendario */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'year' && renderYearView()}
    </div>
  );
}

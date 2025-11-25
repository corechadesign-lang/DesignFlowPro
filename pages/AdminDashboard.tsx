import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Award, BarChart3, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TimeFilter } from '../types';

const COLORS = ['#4F46E5', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { users, demands, workSessions, adminFilters, setAdminFilters } = useApp();

  const designers = users.filter(u => u.role === 'DESIGNER' && u.active);

  const getDateRange = (): { start: number; end: number } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (adminFilters.period) {
      case 'today':
        return { start: today.getTime(), end: now.getTime() };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday.getTime(), end: today.getTime() - 1 };
      case 'weekly':
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - diff);
        return { start: weekStart.getTime(), end: now.getTime() };
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart.getTime(), end: now.getTime() };
      case 'yearly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart.getTime(), end: now.getTime() };
      case 'custom':
        if (adminFilters.customRange) {
          return {
            start: adminFilters.customRange.start.getTime(),
            end: adminFilters.customRange.end.getTime() + 86400000 - 1
          };
        }
        return { start: today.getTime(), end: now.getTime() };
      default:
        return { start: today.getTime(), end: now.getTime() };
    }
  };

  const filteredData = useMemo(() => {
    const { start, end } = getDateRange();
    
    let filteredDemands = demands.filter(d => d.timestamp >= start && d.timestamp <= end);
    let filteredSessions = workSessions.filter(s => s.timestamp >= start && s.timestamp <= end);
    
    if (adminFilters.designerId !== 'all') {
      filteredDemands = filteredDemands.filter(d => d.userId === adminFilters.designerId);
      filteredSessions = filteredSessions.filter(s => s.userId === adminFilters.designerId);
    }
    
    return { demands: filteredDemands, sessions: filteredSessions };
  }, [demands, workSessions, adminFilters]);

  const stats = useMemo(() => {
    const totalArts = filteredData.demands.reduce((acc, d) => acc + d.totalQuantity, 0);
    const totalPoints = filteredData.demands.reduce((acc, d) => acc + d.totalPoints, 0);
    const activeDesigners = new Set(filteredData.demands.map(d => d.userId)).size;
    const avgPointsPerDesigner = activeDesigners > 0 ? Math.round(totalPoints / activeDesigners) : 0;

    return { totalArts, totalPoints, activeDesigners, avgPointsPerDesigner };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const designerData = designers.map(designer => {
      const designerDemands = filteredData.demands.filter(d => d.userId === designer.id);
      const points = designerDemands.reduce((acc, d) => acc + d.totalPoints, 0);
      const arts = designerDemands.reduce((acc, d) => acc + d.totalQuantity, 0);
      return {
        name: designer.name.split(' - ')[1] || designer.name,
        points,
        arts
      };
    }).filter(d => d.points > 0 || d.arts > 0);

    return designerData;
  }, [designers, filteredData]);

  const pieData = useMemo(() => {
    return chartData.map((d, i) => ({
      name: d.name,
      value: d.points,
      color: COLORS[i % COLORS.length]
    }));
  }, [chartData]);

  const periodLabels: Record<TimeFilter, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    weekly: 'Esta Semana',
    monthly: 'Este Mês',
    yearly: 'Este Ano',
    custom: 'Personalizado'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visão geral da produtividade da equipe
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={adminFilters.period}
              onChange={(e) => setAdminFilters({ ...adminFilters, period: e.target.value as TimeFilter })}
              className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg appearance-none focus:ring-2 focus:ring-brand-600 outline-none"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="weekly">Esta Semana</option>
              <option value="monthly">Este Mês</option>
              <option value="yearly">Este Ano</option>
              <option value="custom">Personalizado</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>

          <div className="relative">
            <select
              value={adminFilters.designerId}
              onChange={(e) => setAdminFilters({ ...adminFilters, designerId: e.target.value })}
              className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg appearance-none focus:ring-2 focus:ring-brand-600 outline-none"
            >
              <option value="all">Todos Designers</option>
              {designers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>

          {adminFilters.period === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                onChange={(e) => setAdminFilters({
                  ...adminFilters,
                  customRange: {
                    start: new Date(e.target.value),
                    end: adminFilters.customRange?.end || new Date()
                  }
                })}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              <input
                type="date"
                onChange={(e) => setAdminFilters({
                  ...adminFilters,
                  customRange: {
                    start: adminFilters.customRange?.start || new Date(),
                    end: new Date(e.target.value)
                  }
                })}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <BarChart3 className="text-brand-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Artes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalArts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Pontos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Designers Ativos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeDesigners}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Média/Designer</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgPointsPerDesigner} pts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Produtividade por Designer
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="points" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Sem dados para o período selecionado
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Distribuição de Pontos
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Sem dados para o período selecionado
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-slate-600 dark:text-slate-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

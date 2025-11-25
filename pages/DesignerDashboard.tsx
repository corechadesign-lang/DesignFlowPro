import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Clock, Award, BarChart3, X, ChevronDown } from 'lucide-react';
import { DemandItem } from '../types';

export const DesignerDashboard: React.FC = () => {
  const { currentUser, artTypes, demands, addDemand, startWorkSession, getTodaySession, settings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<DemandItem[]>([]);
  const [selectedArtType, setSelectedArtType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [variationQty, setVariationQty] = useState(0);

  const todaySession = currentUser ? getTodaySession(currentUser.id) : undefined;
  
  useEffect(() => {
    if (currentUser && !todaySession) {
      startWorkSession(currentUser.id);
    }
  }, [currentUser, todaySession, startWorkSession]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayDemands = demands.filter(d => 
    d.userId === currentUser?.id && d.timestamp >= today.getTime()
  );

  const totalArtsToday = todayDemands.reduce((acc, d) => acc + d.totalQuantity, 0);
  const totalPointsToday = todayDemands.reduce((acc, d) => acc + d.totalPoints, 0);

  const handleAddItem = () => {
    const art = artTypes.find(a => a.id === selectedArtType);
    if (!art) return;

    const variationPoints = variationQty * (settings.variationPoints || 5);
    const itemPoints = (art.points * quantity) + variationPoints;

    const newItem: DemandItem = {
      artTypeId: art.id,
      artTypeLabel: art.label,
      pointsPerUnit: art.points,
      quantity,
      variationQuantity: variationQty,
      variationPoints,
      totalPoints: itemPoints
    };

    setItems([...items, newItem]);
    setSelectedArtType('');
    setQuantity(1);
    setVariationQty(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || !currentUser) return;

    const totalQuantity = items.reduce((acc, item) => {
      const isVariation = item.artTypeLabel.toLowerCase().includes('variação');
      return acc + (isVariation ? 0 : item.quantity);
    }, 0);
    
    const totalPoints = items.reduce((acc, item) => acc + item.totalPoints, 0);

    await addDemand({
      userId: currentUser.id,
      userName: currentUser.name,
      items,
      totalQuantity,
      totalPoints
    });

    setItems([]);
    setShowModal(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Olá, {currentUser?.name?.split(' - ')[1] || currentUser?.name}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {todaySession ? (
              <>Expediente iniciado às {formatTime(todaySession.timestamp)}</>
            ) : (
              <>Iniciando expediente...</>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nova Demanda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <Clock className="text-brand-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Início</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {todaySession ? formatTime(todaySession.timestamp) : '--:--'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Artes Hoje</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalArtsToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pontos Hoje</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalPointsToday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Histórico de Hoje</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {todayDemands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Nenhuma demanda registrada hoje
            </div>
          ) : (
            todayDemands.map(demand => (
              <div key={demand.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTime(demand.timestamp)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {demand.items.map((item, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-300"
                        >
                          {item.quantity}x {item.artTypeLabel}
                          {item.variationQuantity ? ` (+${item.variationQuantity} var)` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{demand.totalPoints} pts</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{demand.totalQuantity} artes</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Nova Demanda</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Arte
                </label>
                <div className="relative">
                  <select
                    value={selectedArtType}
                    onChange={(e) => setSelectedArtType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg appearance-none focus:ring-2 focus:ring-brand-600 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {artTypes.map(art => (
                      <option key={art.id} value={art.id}>
                        {art.label} ({art.points} pts)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Variações ({settings.variationPoints || 5} pts cada)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variationQty}
                    onChange={(e) => setVariationQty(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-600 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                disabled={!selectedArtType}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                + Adicionar Item
              </button>

              {items.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.quantity}x {item.artTypeLabel}
                        </p>
                        {item.variationQuantity ? (
                          <p className="text-sm text-slate-500">+{item.variationQuantity} variações</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-brand-600">{item.totalPoints} pts</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 flex justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="font-bold text-brand-600">
                      {items.reduce((acc, i) => acc + i.totalPoints, 0)} pts
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleSubmit}
                disabled={items.length === 0}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                Registrar Demanda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

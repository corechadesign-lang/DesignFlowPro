import React from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Eye, Clock } from 'lucide-react';

export const DesignerFeedbacks: React.FC = () => {
  const { currentUser, feedbacks, markFeedbackViewed } = useApp();

  const myFeedbacks = feedbacks.filter(f => f.designerId === currentUser?.id);
  const unviewedCount = myFeedbacks.filter(f => !f.viewed).length;

  const handleView = async (id: string) => {
    await markFeedbackViewed(id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedbacks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unviewedCount > 0 
              ? `Você tem ${unviewedCount} feedback(s) não visualizado(s)`
              : 'Todos os feedbacks foram visualizados'}
          </p>
        </div>
      </div>

      {myFeedbacks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <MessageSquare className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Nenhum feedback ainda
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Os feedbacks do administrador aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myFeedbacks.map(feedback => (
            <div 
              key={feedback.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border ${
                feedback.viewed 
                  ? 'border-slate-200 dark:border-slate-800' 
                  : 'border-brand-500 dark:border-brand-400'
              } overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      De: <span className="font-medium text-slate-700 dark:text-slate-300">{feedback.adminName}</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                      <Clock size={12} />
                      {formatDate(feedback.createdAt)}
                    </p>
                  </div>
                  {!feedback.viewed && (
                    <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium rounded-full">
                      Novo
                    </span>
                  )}
                </div>

                {feedback.comment && (
                  <p className="text-slate-700 dark:text-slate-300 mb-4">{feedback.comment}</p>
                )}

                {feedback.imageUrls && feedback.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {feedback.imageUrls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        <img src={url} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {!feedback.viewed && (
                  <button
                    onClick={() => handleView(feedback.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                    Marcar como visto
                  </button>
                )}

                {feedback.viewed && feedback.viewedAt && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Visualizado em {formatDate(feedback.viewedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

console.log('Arquivo MaterialControl.tsx carregado!');

const MaterialControl = () => {
  console.log('MaterialControl renderizou!');
  const [openAdjustmentsModal, setOpenAdjustmentsModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-fiber-gradient p-4">
      <div className="max-w-7xl mx-auto">
        {/* ... filtros e cabeçalho ... */}
        <div className="space-y-4">
          {userMaterials.map((userData) => {
            const sortedAdjustments = [...userData.adjustments].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            console.log('Ordem final dos ajustes para usuário', userData.user.name, ':', sortedAdjustments.map(a => a.created_at));

            return (
              <Card key={userData.user.id} className="bg-white shadow-md">
                {/* ... cabeçalho do técnico ... */}
                {expandedUsers.has(userData.user.id) && (
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Materiais Consumidos</h3>
                        {/* ... lista de materiais ... */}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                          Baixas Registradas
                          {userData.adjustments.length > 3 && (
                            <Dialog open={openAdjustmentsModal === userData.user.id} onOpenChange={open => setOpenAdjustmentsModal(open ? userData.user.id : null)}>
                              <DialogTrigger asChild>
                                <button className="text-blue-600 underline text-sm ml-2">Ver todas</button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Todas as Baixas Registradas</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-96 overflow-y-auto space-y-2 mt-2">
                                  {sortedAdjustments.map((adjustment) => (
                                    <div key={adjustment.id} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                                      <p className="font-medium">{adjustment.checklist_item.name}</p>
                                      <p className="text-sm text-gray-600">
                                        Redução: {adjustment.quantity_reduced} | SA: {adjustment.sa_code}
                                      </p>
                                      {adjustment.reason && (
                                        <p className="text-xs text-gray-500">
                                          Motivo: {adjustment.reason}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-400">
                                        {new Date(adjustment.created_at).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {sortedAdjustments.slice(0, 3).map((adjustment) => (
                            <div key={adjustment.id} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                              <p className="font-medium">{adjustment.checklist_item.name}</p>
                              <p className="text-sm text-gray-600">
                                Redução: {adjustment.quantity_reduced} | SA: {adjustment.sa_code}
                              </p>
                              {adjustment.reason && (
                                <p className="text-xs text-gray-500">
                                  Motivo: {adjustment.reason}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {new Date(adjustment.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          ))}
                          {userData.adjustments.length === 0 && (
                            <p className="text-sm text-gray-500">Nenhuma baixa registrada.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
        {/* ... restante do código ... */}
      </div>
      {/* ... modais de ajuste de material ... */}
    </div>
  );
}; 
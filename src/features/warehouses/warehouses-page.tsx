import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/app-context';
import type { Warehouse } from '../../lib/types';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Spinner } from '../../components/ui/spinner';
import { Modal } from '../../components/ui/modal';
import { WarehouseForm } from './warehouse-form';
import { formatDate } from '../../lib/utils';

export function WarehousesPage() {
  const { currentAgency, hasPermission } = useApp();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>();

  const canCreate = hasPermission('warehouses.create');
  const canUpdate = hasPermission('warehouses.update');

  useEffect(() => {
    if (currentAgency) {
      loadWarehouses();
    }
  }, [currentAgency]);

  const loadWarehouses = async () => {
    if (!currentAgency) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedWarehouse(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setSelectedWarehouse(undefined);
    loadWarehouses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entrepôts</h1>
          <p className="text-gray-600 mt-2">
            Gérez les entrepôts de {currentAgency?.name}
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>Nouvel entrepôt</Button>
        )}
      </div>

      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Aucun entrepôt trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-sm text-gray-500">{warehouse.code}</p>
                  </div>
                  <Badge variant={warehouse.is_active ? 'success' : 'danger'}>
                    {warehouse.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                {warehouse.settings && (
                  <div className="mb-4">
                    <Badge variant="info">
                      {(warehouse.settings as { type?: string }).type === 'main' && 'Principal'}
                      {(warehouse.settings as { type?: string }).type === 'secondary' && 'Secondaire'}
                      {(warehouse.settings as { type?: string }).type === 'transit' && 'Transit'}
                    </Badge>
                  </div>
                )}

                {warehouse.address && (
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {(warehouse.address as { city?: string }).city && (
                      <p>📍 {(warehouse.address as { city?: string }).city}</p>
                    )}
                    {(warehouse.settings as { capacity_sqm?: number }).capacity_sqm && (
                      <p>📦 {(warehouse.settings as { capacity_sqm?: number }).capacity_sqm} m²</p>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-400 mb-4">
                  Créé le {formatDate(warehouse.created_at)}
                </div>

                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleEdit(warehouse)}
                  >
                    Modifier
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
        size="lg"
      >
        <WarehouseForm
          warehouse={selectedWarehouse}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

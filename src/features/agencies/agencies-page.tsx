import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/app-context';
import type { Agency } from '../../lib/types';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Spinner } from '../../components/ui/spinner';
import { Modal } from '../../components/ui/modal';
import { AgencyForm } from './agency-form';
import { formatDate } from '../../lib/utils';

export function AgenciesPage() {
  const { hasPermission } = useApp();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | undefined>();

  const canCreate = hasPermission('agencies.create');
  const canUpdate = hasPermission('agencies.update');

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');

      if (error) throw error;
      setAgencies(data || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAgency(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (agency: Agency) => {
    setSelectedAgency(agency);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setSelectedAgency(undefined);
    loadAgencies();
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
          <h1 className="text-3xl font-bold text-gray-900">Agences</h1>
          <p className="text-gray-600 mt-2">Gérez les agences du système</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>Nouvelle agence</Button>
        )}
      </div>

      {agencies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Aucune agence trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Card key={agency.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agency.name}</h3>
                    <p className="text-sm text-gray-500">{agency.code}</p>
                  </div>
                  <Badge variant={agency.is_active ? 'success' : 'danger'}>
                    {agency.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {agency.settings && (
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {(agency.settings as { city?: string }).city && (
                      <p>📍 {(agency.settings as { city?: string }).city}</p>
                    )}
                    {(agency.settings as { phone?: string }).phone && (
                      <p>📞 {(agency.settings as { phone?: string }).phone}</p>
                    )}
                    {(agency.settings as { email?: string }).email && (
                      <p>✉️ {(agency.settings as { email?: string }).email}</p>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-400 mb-4">
                  Créée le {formatDate(agency.created_at)}
                </div>

                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleEdit(agency)}
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
        title={selectedAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}
        size="lg"
      >
        <AgencyForm
          agency={selectedAgency}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

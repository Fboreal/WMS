import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '../../components/ui/form-input';
import { FormSelect } from '../../components/ui/form-select';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/toast-context';
import { useApp } from '../../contexts/app-context';
import { Warehouse } from '../../lib/types';

const warehouseSchema = z.object({
  code: z.string().min(2, 'Le code doit contenir au moins 2 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().default('France'),
  }).optional(),
  settings: z.object({
    capacity_sqm: z.number().optional(),
    type: z.enum(['main', 'secondary', 'transit']).optional(),
  }).optional(),
  is_active: z.boolean().default(true),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  warehouse?: Warehouse;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WarehouseForm({ warehouse, onSuccess, onCancel }: WarehouseFormProps) {
  const { showToast } = useToast();
  const { currentAgency } = useApp();
  const isEditing = !!warehouse;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouse
      ? {
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address as WarehouseFormData['address'],
          settings: warehouse.settings as WarehouseFormData['settings'],
          is_active: warehouse.is_active,
        }
      : {
          address: { country: 'France' },
          settings: { type: 'main' },
          is_active: true,
        },
  });

  const onSubmit = async (data: WarehouseFormData) => {
    if (!currentAgency) {
      showToast('Erreur: Aucune agence sélectionnée', 'error');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('warehouses')
          .update({
            code: data.code,
            name: data.name,
            address: data.address || {},
            settings: data.settings || {},
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', warehouse.id);

        if (error) throw error;
        showToast('Entrepôt modifié avec succès', 'success');
      } else {
        const { error } = await supabase.from('warehouses').insert({
          agency_id: currentAgency.id,
          code: data.code,
          name: data.name,
          address: data.address || {},
          settings: data.settings || {},
          is_active: data.is_active,
        } as never);

        if (error) throw error;
        showToast('Entrepôt créé avec succès', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      showToast('Erreur lors de la sauvegarde de l\'entrepôt', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Code"
          required
          {...register('code')}
          error={errors.code?.message}
          disabled={isEditing}
        />

        <FormInput
          label="Nom"
          required
          {...register('name')}
          error={errors.name?.message}
        />

        <FormSelect
          label="Type"
          {...register('settings.type')}
          options={[
            { value: 'main', label: 'Principal' },
            { value: 'secondary', label: 'Secondaire' },
            { value: 'transit', label: 'Transit' },
          ]}
          error={errors.settings?.type?.message}
        />

        <FormInput
          label="Surface (m²)"
          type="number"
          {...register('settings.capacity_sqm', { valueAsNumber: true })}
          error={errors.settings?.capacity_sqm?.message}
        />

        <FormInput
          label="Adresse"
          {...register('address.street')}
          error={errors.address?.street?.message}
        />

        <FormInput
          label="Ville"
          {...register('address.city')}
          error={errors.address?.city?.message}
        />

        <FormInput
          label="Code postal"
          {...register('address.postal_code')}
          error={errors.address?.postal_code?.message}
        />

        <FormInput
          label="Pays"
          {...register('address.country')}
          error={errors.address?.country?.message}
        />

        <FormSelect
          label="Statut"
          required
          {...register('is_active', { valueAsNumber: false })}
          options={[
            { value: 'true', label: 'Actif' },
            { value: 'false', label: 'Inactif' },
          ]}
          error={errors.is_active?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

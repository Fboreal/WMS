import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '../../components/ui/form-input';
import { FormSelect } from '../../components/ui/form-select';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/toast-context';
import { Agency } from '../../lib/types';

const agencySchema = z.object({
  code: z.string().min(2, 'Le code doit contenir au moins 2 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  settings: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().default('France'),
    phone: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
  }).optional(),
  is_active: z.boolean().default(true),
});

type AgencyFormData = z.infer<typeof agencySchema>;

interface AgencyFormProps {
  agency?: Agency;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgencyForm({ agency, onSuccess, onCancel }: AgencyFormProps) {
  const { showToast } = useToast();
  const isEditing = !!agency;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: agency
      ? {
          code: agency.code,
          name: agency.name,
          settings: agency.settings as AgencyFormData['settings'],
          is_active: agency.is_active,
        }
      : {
          settings: { country: 'France' },
          is_active: true,
        },
  });

  const onSubmit = async (data: AgencyFormData) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('agencies')
          .update({
            code: data.code,
            name: data.name,
            settings: data.settings || {},
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', agency.id);

        if (error) throw error;
        showToast('Agence modifiée avec succès', 'success');
      } else {
        const { error } = await supabase.from('agencies').insert({
          code: data.code,
          name: data.name,
          settings: data.settings || {},
          is_active: data.is_active,
        } as never);

        if (error) throw error;
        showToast('Agence créée avec succès', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving agency:', error);
      showToast(
        'Erreur lors de la sauvegarde de l\'agence',
        'error'
      );
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

        <FormInput
          label="Email"
          type="email"
          {...register('settings.email')}
          error={errors.settings?.email?.message}
        />

        <FormInput
          label="Téléphone"
          {...register('settings.phone')}
          error={errors.settings?.phone?.message}
        />

        <FormInput
          label="Adresse"
          {...register('settings.address')}
          error={errors.settings?.address?.message}
        />

        <FormInput
          label="Ville"
          {...register('settings.city')}
          error={errors.settings?.city?.message}
        />

        <FormInput
          label="Code postal"
          {...register('settings.postal_code')}
          error={errors.settings?.postal_code?.message}
        />

        <FormInput
          label="Pays"
          {...register('settings.country')}
          error={errors.settings?.country?.message}
        />

        <FormSelect
          label="Statut"
          required
          {...register('is_active', { valueAsNumber: false })}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
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

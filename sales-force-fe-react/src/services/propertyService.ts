import type { Property } from '@/lib/types';
import { api } from '@/lib/api';

export interface PropertyOption {
  value: string;
  label: string;
}

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const response = await api.getProperties();
    return response.data.properties;
  },

  toPropertyOptions(properties: Property[]): PropertyOption[] {
    return properties.map((property) => ({
      value: property.id,
      label: property.name,
    }));
  },
};

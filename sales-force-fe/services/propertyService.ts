import { Property } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PropertyOption {
  value: string;
  label: string;
}

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    const data = await response.json();
    return data;
  },

  toPropertyOptions(properties: Property[]): PropertyOption[] {
    return properties.map((property) => ({
      value: property.id,
      label: property.name,
    }));
  },
};

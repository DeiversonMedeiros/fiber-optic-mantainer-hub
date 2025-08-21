import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: number;
  name: string;
  state: string;
}

interface Neighborhood {
  id: number;
  name: string;
  city_id: number;
}

export const useCitiesNeighborhoods = () => {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  // Buscar todas as cidades com cache longo
  const { data: cities = [], isLoading: citiesLoading, error: citiesError } = useQuery({
    queryKey: ['cities'],
    queryFn: async (): Promise<City[]> => {
      console.log('🔍 Buscando cidades...');
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar cidades:', error);
        throw error;
      }
      
      console.log('✅ Cidades encontradas:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  // Pré-carregar todos os bairros para cache
  const { data: allNeighborhoods = [], error: neighborhoodsError } = useQuery({
    queryKey: ['all-neighborhoods'],
    queryFn: async (): Promise<Neighborhood[]> => {
      console.log('🔍 Pré-carregando todos os bairros...');
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar bairros:', error);
        throw error;
      }
      
      console.log('✅ Bairros pré-carregados:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  // Filtrar bairros da cidade selecionada do cache
  const neighborhoods = useMemo(() => {
    if (!selectedCityId) return [];
    return allNeighborhoods.filter(n => n.city_id === selectedCityId);
  }, [allNeighborhoods, selectedCityId]);

  // Simular loading apenas na primeira vez
  const neighborhoodsLoading = false; // Sempre false pois usa cache

  // Log de erros
  useEffect(() => {
    if (citiesError) {
      console.error('❌ Erro no hook de cidades:', citiesError);
    }
    if (neighborhoodsError) {
      console.error('❌ Erro no hook de bairros:', neighborhoodsError);
    }
  }, [citiesError, neighborhoodsError]);

  return {
    cities,
    neighborhoods,
    selectedCityId,
    setSelectedCityId,
    citiesLoading,
    neighborhoodsLoading,
    citiesError,
    neighborhoodsError
  };
}; 
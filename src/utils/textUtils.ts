// Função para normalizar texto (remover acentos, espaços extras, etc.)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .trim();
};

// Função para calcular similaridade entre strings
export const calculateSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  if (normalized1 === normalized2) return 1;
  
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
  
  if (longer.length === 0) return 1;
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

// Função para calcular distância de edição (Levenshtein)
const editDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Função para buscar correspondências fuzzy
export const findFuzzyMatches = (
  input: string, 
  options: string[], 
  threshold: number = 0.7
): string[] => {
  if (!input.trim()) return [];
  
  const matches = options
    .map(option => ({
      option,
      similarity: calculateSimilarity(input, option)
    }))
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(match => match.option);
  
  return matches;
};

// Função para encontrar a melhor correspondência
export const findBestMatch = (
  input: string, 
  options: string[], 
  threshold: number = 0.7
): string | null => {
  const matches = findFuzzyMatches(input, options, threshold);
  return matches.length > 0 ? matches[0] : null;
}; 
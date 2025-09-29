/**
 * Mapeamento das categorias do Flash para os benefícios do sistema
 * 
 * Categorias Flash disponíveis:
 * - PREMIACAO VIRTUAL
 * - REFEICAO E ALIMENTACAO  
 * - MOBILIDADE
 * - FLEXIVEL
 * - VALE TRANSPORTE PIX
 */

export interface FlashCategoryMapping {
  systemBenefitType: string;
  flashCategory: string;
  description: string;
  isActive: boolean;
}

export const FLASH_CATEGORY_MAPPINGS: FlashCategoryMapping[] = [
  {
    systemBenefitType: 'VR',
    flashCategory: 'REFEICAO E ALIMENTACAO',
    description: 'Vale Refeição - Categoria Flash para alimentação',
    isActive: true
  },
  {
    systemBenefitType: 'VA', 
    flashCategory: 'REFEICAO E ALIMENTACAO',
    description: 'Vale Alimentação - Categoria Flash para alimentação',
    isActive: true
  },
  {
    systemBenefitType: 'transporte',
    flashCategory: 'VALE TRANSPORTE PIX',
    description: 'Transporte - Categoria Flash para vale transporte',
    isActive: true
  },
  {
    systemBenefitType: 'premiacao',
    flashCategory: 'PREMIACAO VIRTUAL',
    description: 'Premiação - Categoria Flash para premiações',
    isActive: true
  },
  {
    systemBenefitType: 'producao',
    flashCategory: 'PREMIACAO VIRTUAL', 
    description: 'Produtividade - Categoria Flash para premiações',
    isActive: true
  },
  {
    systemBenefitType: 'equipamento',
    flashCategory: 'PREMIACAO VIRTUAL',
    description: 'Locação de Equipamentos - Categoria Flash para premiações',
    isActive: true
  }
];

/**
 * Obtém a categoria Flash para um tipo de benefício do sistema
 */
export function getFlashCategory(systemBenefitType: string): string | null {
  const mapping = FLASH_CATEGORY_MAPPINGS.find(
    m => m.systemBenefitType === systemBenefitType && m.isActive
  );
  return mapping?.flashCategory || null;
}

/**
 * Obtém todos os tipos de benefícios que usam uma categoria Flash específica
 */
export function getSystemBenefitTypesByCategory(flashCategory: string): string[] {
  return FLASH_CATEGORY_MAPPINGS
    .filter(m => m.flashCategory === flashCategory && m.isActive)
    .map(m => m.systemBenefitType);
}

/**
 * Obtém o mapeamento completo para um tipo de benefício
 */
export function getBenefitMapping(systemBenefitType: string): FlashCategoryMapping | null {
  return FLASH_CATEGORY_MAPPINGS.find(
    m => m.systemBenefitType === systemBenefitType && m.isActive
  ) || null;
}

/**
 * Valida se um tipo de benefício tem mapeamento Flash
 */
export function hasFlashMapping(systemBenefitType: string): boolean {
  return getFlashCategory(systemBenefitType) !== null;
}

/**
 * Lista todas as categorias Flash disponíveis
 */
export function getAvailableFlashCategories(): string[] {
  return [...new Set(FLASH_CATEGORY_MAPPINGS.map(m => m.flashCategory))];
}

/**
 * Lista todos os tipos de benefícios do sistema
 */
export function getSystemBenefitTypes(): string[] {
  return FLASH_CATEGORY_MAPPINGS.map(m => m.systemBenefitType);
}


export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Função para escapar valores CSV adequadamente
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Se é um objeto, tentar serializar adequadamente
    if (typeof value === 'object' && value !== null) {
      try {
        // Se é um array, juntar com ponto e vírgula
        if (Array.isArray(value)) {
          return value.map(item => {
            if (typeof item === 'object' && item !== null) {
              if (item.url) return item.url;
              if (item.name) return item.name;
              if (item.id) return String(item.id);
              return JSON.stringify(item);
            }
            return String(item);
          }).join('; ');
        }
        // Se é um objeto, tentar extrair informações úteis
        if (value.url) return value.url;
        if (value.name) return value.name;
        if (value.id) return String(value.id);
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    
    const stringValue = String(value);
    
    // Se contém ponto e vírgula, aspas ou quebra de linha, envolver em aspas
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  const csvContent = [
    headers.map(header => escapeCSVValue(header)).join(';'),
    ...data.map(row => 
      headers.map(header => escapeCSVValue(row[header])).join(';')
    )
  ].join('\r\n');

  // Adicionar BOM para UTF-8 (importante para Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReimbursementForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Solicitação de reembolso enviada com sucesso",
      });
      
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: '',
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação de reembolso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Solicitação de Reembolso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Data da Despesa</Label>
              <Input 
                id="date" 
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="meals">Alimentação</SelectItem>
                <SelectItem value="materials">Materiais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input 
              id="description" 
              placeholder="Descrição da despesa"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReimbursementForm;
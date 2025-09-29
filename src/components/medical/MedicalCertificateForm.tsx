// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MedicalCertificateForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    days: 0,
    reason: '',
    doctorName: '',
    doctorCrm: '',
    type: 'medical_leave'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Certificado médico registrado com sucesso",
      });
      
      setFormData({
        employeeId: '',
        startDate: '',
        endDate: '',
        days: 0,
        reason: '',
        doctorName: '',
        doctorCrm: '',
        type: 'medical_leave'
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar certificado médico",
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
        <CardTitle>Registro de Certificado Médico</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Funcionário</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(value) => handleInputChange('employeeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">João Silva</SelectItem>
                <SelectItem value="2">Maria Santos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motivo/CID</Label>
            <Textarea 
              id="reason" 
              placeholder="Descreva o motivo do afastamento"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Salvando...' : 'Salvar Certificado'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MedicalCertificateForm;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Segunda', preventiva: 12, corretiva: 8, emergencia: 3 },
  { name: 'Terça', preventiva: 15, corretiva: 6, emergencia: 2 },
  { name: 'Quarta', preventiva: 10, corretiva: 12, emergencia: 5 },
  { name: 'Quinta', preventiva: 18, corretiva: 4, emergencia: 1 },
  { name: 'Sexta', preventiva: 14, corretiva: 9, emergencia: 4 },
  { name: 'Sábado', preventiva: 8, corretiva: 15, emergencia: 7 },
  { name: 'Domingo', preventiva: 5, corretiva: 11, emergencia: 3 },
];

const MaintenanceChart = () => {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Manutenções por Tipo (últimos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="preventiva" fill="#1a9446" name="Preventiva" radius={[2, 2, 0, 0]} />
              <Bar dataKey="corretiva" fill="#c1f832" name="Corretiva" radius={[2, 2, 0, 0]} />
              <Bar dataKey="emergencia" fill="#ef4444" name="Emergência" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceChart;

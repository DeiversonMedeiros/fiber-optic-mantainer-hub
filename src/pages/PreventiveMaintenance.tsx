
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RisksManagement from "@/components/preventive/RisksManagement";
import PreventiveSchedule from "@/components/preventive/PreventiveSchedule";

const PreventiveMaintenance = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-2 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Preventiva</h1>
        <p className="text-muted-foreground">
          Gerencie riscos identificados e programe inspeções preventivas
        </p>
      </div>

      <Tabs defaultValue="risks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
          <TabsTrigger value="schedule">Cronograma de Preventiva</TabsTrigger>
        </TabsList>

        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Riscos</CardTitle>
              <CardDescription>
                Lista de riscos enviados através dos relatórios de vistoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RisksManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Preventiva</CardTitle>
              <CardDescription>
                Programe inspeções preventivas de cabos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreventiveSchedule />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreventiveMaintenance;

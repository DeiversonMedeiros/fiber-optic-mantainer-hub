// ===== TIPOS PARA SISTEMA DE LOCAÇÃO DE EQUIPAMENTOS =====

export interface EquipmentRental {
  id: string;
  company_id: string;
  employee_id: string;
  equipment_type: 'vehicle' | 'computer' | 'phone' | 'other';
  equipment_name: string;
  equipment_description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  license_plate?: string; // Para veículos
  monthly_value: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface EquipmentRentalInsert {
  company_id: string;
  employee_id: string;
  equipment_type: 'vehicle' | 'computer' | 'phone' | 'other';
  equipment_name: string;
  equipment_description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  license_plate?: string;
  monthly_value: number;
  start_date: string;
  end_date?: string;
  status?: 'active' | 'inactive' | 'terminated';
  created_by: string;
}

export interface EquipmentRentalUpdate {
  equipment_name?: string;
  equipment_description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  license_plate?: string;
  monthly_value?: number;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'inactive' | 'terminated';
  updated_by?: string;
}

export interface EquipmentRentalPayment {
  id: string;
  company_id: string;
  equipment_rental_id: string;
  payment_month: string; // YYYY-MM
  payment_year: number;
  amount: number;
  payment_date?: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_method?: 'bank_transfer' | 'pix' | 'cash' | 'check';
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface EquipmentRentalPaymentInsert {
  company_id: string;
  equipment_rental_id: string;
  payment_month: string;
  payment_year: number;
  amount: number;
  payment_date?: string;
  status?: 'pending' | 'paid' | 'cancelled';
  payment_method?: 'bank_transfer' | 'pix' | 'cash' | 'check';
  payment_reference?: string;
  notes?: string;
  created_by: string;
}

export interface EquipmentRentalPaymentUpdate {
  payment_date?: string;
  status?: 'pending' | 'paid' | 'cancelled';
  payment_method?: 'bank_transfer' | 'pix' | 'cash' | 'check';
  payment_reference?: string;
  notes?: string;
  updated_by?: string;
}

export interface EquipmentRentalWithEmployee extends EquipmentRental {
  employee: {
    id: string;
    name: string;
    cpf: string;
  };
}

export interface EquipmentRentalWithPayments extends EquipmentRentalWithEmployee {
  payments: EquipmentRentalPayment[];
  total_paid: number;
  pending_amount: number;
}

export interface EquipmentRentalStats {
  total_equipments: number;
  active_equipments: number;
  total_monthly_value: number;
  equipments_by_type: {
    vehicle: number;
    computer: number;
    phone: number;
    other: number;
  };
  pending_payments: number;
  overdue_payments: number;
}

// ===== TIPOS PARA FILTROS E BUSCA =====
export interface EquipmentRentalFilters {
  employee_id?: string;
  equipment_type?: 'vehicle' | 'computer' | 'phone' | 'other';
  status?: 'active' | 'inactive' | 'terminated';
  start_date_from?: string;
  start_date_to?: string;
  monthly_value_min?: number;
  monthly_value_max?: number;
}

export interface EquipmentRentalPaymentFilters {
  equipment_rental_id?: string;
  payment_month?: string;
  payment_year?: number;
  status?: 'pending' | 'paid' | 'cancelled';
  payment_date_from?: string;
  payment_date_to?: string;
}

// ===== TIPOS PARA RELATÓRIOS =====
export interface EquipmentRentalReport {
  period: string;
  total_equipments: number;
  total_value: number;
  equipments_by_type: Record<string, number>;
  top_employees: Array<{
    employee_name: string;
    total_value: number;
    equipments_count: number;
  }>;
}

export interface EquipmentRentalPaymentReport {
  period: string;
  total_payments: number;
  total_paid: number;
  pending_payments: number;
  overdue_payments: number;
  payments_by_method: Record<string, number>;
}


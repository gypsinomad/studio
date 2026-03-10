import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

export interface ImportConfig {
  collection: string;
  mapping: Record<string, string>; // Excel column -> Firestore field
  validation?: Record<string, (value: any) => boolean>;
  transform?: Record<string, (value: any) => any>;
}

export interface ExportConfig {
  collection: string;
  fields: string[];
  filters?: Record<string, any>;
  format: 'xlsx' | 'csv' | 'json';
}

export const importFromExcel = async (
  file: File,
  config: ImportConfig
): Promise<{ success: boolean; imported: number; errors: string[] }> => {
  try {
    const data = await readExcelFile(file);
    const errors: string[] = [];
    let imported = 0;

    for (const row of data) {
      try {
        // Map Excel columns to Firestore fields
        const mappedData: Record<string, any> = {};
        
        for (const [excelColumn, firestoreField] of Object.entries(config.mapping)) {
          const value = row[excelColumn];
          
          if (value !== undefined && value !== null && value !== '') {
            // Apply validation if configured
            if (config.validation && config.validation[firestoreField]) {
              if (!config.validation[firestoreField](value)) {
                errors.push(`Row ${imported + 1}: Invalid ${firestoreField}: ${value}`);
                continue;
              }
            }
            
            // Apply transformation if configured
            if (config.transform && config.transform[firestoreField]) {
              mappedData[firestoreField] = config.transform[firestoreField](value);
            } else {
              mappedData[firestoreField] = value;
            }
          }
        }
        
        // Add timestamps
        mappedData.createdAt = new Date();
        mappedData.updatedAt = new Date();
        
        // Add to Firestore
        await addDoc(collection(firestore, config.collection), mappedData);
        imported++;
        
      } catch (error) {
        errors.push(`Row ${imported + 1}: ${error}`);
      }
    }
    
    return {
      success: imported > 0,
      imported,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [`File processing error: ${error}`]
    };
  }
};

export const readExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = async (config: ExportConfig): Promise<Blob> => {
  try {
    // Fetch data from Firestore
    let q = query(collection(firestore, config.collection), orderBy('createdAt', 'desc'));
    
    if (config.filters) {
      // Apply filters (simplified - would need more complex filtering)
      Object.entries(config.filters).forEach(([field, value]) => {
        q = query(q, where(field, '==', value));
      });
    }
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Transform data for export
    const exportData = data.map(item => {
      const exportItem: Record<string, any> = {};
      
      config.fields.forEach(field => {
        if (field === 'id') {
          exportItem[field] = item.id;
        } else {
          exportItem[field] = item[field];
        }
      });
      
      return exportItem;
    });
    
    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.collection);
    
    // Generate file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
  } catch (error) {
    throw new Error(`Export failed: ${error}`);
  }
};

export const exportToCSV = async (config: ExportConfig): Promise<Blob> => {
  try {
    // Similar to exportToExcel but CSV format
    const excelBlob = await exportToExcel({ ...config, format: 'xlsx' });
    
    // Convert to CSV
    const data = await excelBlob.text();
    const csvData = XLSX.utils.sheet_to_csv(XLSX.read(data, { type: 'string' }).Sheets[config.collection]);
    
    return new Blob([csvData], { type: 'text/csv' });
    
  } catch (error) {
    throw new Error(`CSV export failed: ${error}`);
  }
};

export const exportToJSON = async (config: ExportConfig): Promise<Blob> => {
  try {
    // Fetch data from Firestore
    let q = query(collection(firestore, config.collection), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Transform data for export
    const exportData = data.map(item => {
      const exportItem: Record<string, any> = {};
      
      config.fields.forEach(field => {
        if (field === 'id') {
          exportItem[field] = item.id;
        } else {
          exportItem[field] = item[field];
        }
      });
      
      return exportItem;
    });
    
    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
    
  } catch (error) {
    throw new Error(`JSON export failed: ${error}`);
  }
};

// Predefined configurations
export const IMPORT_CONFIGS: Record<string, ImportConfig> = {
  leads: {
    collection: 'leads',
    mapping: {
      'Full Name': 'fullName',
      'Email': 'email',
      'Phone': 'phone',
      'Company': 'companyName',
      'Source': 'source',
      'Status': 'status',
      'Product Interest': 'productInterest',
      'Destination Country': 'destinationCountry'
    },
    validation: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^\+?[\d\s-()]+$/.test(value)
    },
    transform: {
      status: (value) => value.toLowerCase().replace(' ', '_'),
      source: (value) => value.toLowerCase().replace(' ', '')
    }
  },
  customers: {
    collection: 'companies',
    mapping: {
      'Company Name': 'name',
      'Email': 'email',
      'Phone': 'phone',
      'Website': 'website',
      'Industry': 'industry',
      'Address': 'address',
      'Country': 'country'
    }
  }
};

export const EXPORT_CONFIGS: Record<string, ExportConfig> = {
  leads: {
    collection: 'leads',
    fields: ['id', 'fullName', 'email', 'phone', 'companyName', 'status', 'source', 'productInterest', 'createdAt'],
    format: 'xlsx'
  },
  customers: {
    collection: 'companies',
    fields: ['id', 'name', 'email', 'phone', 'website', 'industry', 'createdAt'],
    format: 'xlsx'
  },
  orders: {
    collection: 'exportOrders',
    fields: ['id', 'title', 'status', 'totalValue', 'customerName', 'productType', 'createdAt'],
    format: 'xlsx'
  }
};

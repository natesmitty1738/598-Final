'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface CsvUploadProps {
  type: 'salesHistory' | 'inventoryItems';
  onDataParsed: (data: any[]) => void;
}

export default function CsvUpload({ type, onDataParsed }: CsvUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Define required fields based on type
  const requiredFields = 
    type === 'salesHistory' 
      ? ['date', 'productName', 'quantity', 'unitPrice', 'totalAmount'] 
      : ['sku', 'name'];
  
  // Example template for the CSV download
  const getCsvTemplate = () => {
    if (type === 'salesHistory') {
      return 'date,productId,productName,quantity,unitPrice,totalAmount\n2023-05-01,PRD001,Widget A,5,19.99,99.95\n2023-05-02,PRD002,Widget B,2,29.99,59.98';
    } else {
      return 'sku,name,description,category,unitCost,sellingPrice,stockQuantity,location,size,color\nSKU001,Widget A,Premium widget,Electronics,12.99,24.99,50,Warehouse A,Small,Blue\nSKU002,Widget B,Economy widget,Electronics,8.99,17.99,100,Warehouse B,Medium,Red';
    }
  };
  
  // Download template function
  const downloadTemplate = () => {
    const templateCsv = getCsvTemplate();
    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Validate headers for CSV file
  const validateHeaders = (headers: string[]) => {
    const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Check if all required fields are present
    const missingFields = requiredFields.filter(field => 
      !lowerCaseHeaders.includes(field.toLowerCase())
    );
    
    if (missingFields.length > 0) {
      return `Missing required fields: ${missingFields.join(', ')}`;
    }
    
    return null;
  };
  
  // Process CSV file
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check for parsing errors
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`);
          setIsProcessing(false);
          return;
        }
        
        // Validate headers
        const headerError = validateHeaders(results.meta.fields || []);
        if (headerError) {
          setError(headerError);
          setIsProcessing(false);
          return;
        }
        
        // Process data
        try {
          let processedData;
          
          if (type === 'salesHistory') {
            // Process sales history data
            processedData = results.data.map((row: any) => ({
              date: row.date,
              productId: row.productId || '',
              productName: row.productName,
              quantity: parseInt(row.quantity, 10) || 0,
              unitPrice: parseFloat(row.unitPrice) || 0,
              totalAmount: parseFloat(row.totalAmount) || 0,
            }));
          } else {
            // Process inventory items data
            processedData = results.data.map((row: any) => ({
              sku: row.sku,
              name: row.name,
              description: row.description || '',
              category: row.category || '',
              unitCost: row.unitCost ? parseFloat(row.unitCost) : null,
              sellingPrice: row.sellingPrice ? parseFloat(row.sellingPrice) : null,
              stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity, 10) : null,
              location: row.location || '',
              size: row.size || '',
              color: row.color || '',
            }));
          }
          
          // Send processed data to parent component
          onDataParsed(processedData);
          setSuccess(true);
          toast.success(`Successfully parsed ${processedData.length} records`);
        } catch (error) {
          console.error('Error processing CSV data:', error);
          setError('Error processing file. Please check the format and try again.');
        }
        
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setError('Failed to parse CSV file. Please check the format and try again.');
        setIsProcessing(false);
      }
    });
  };
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    
    processFile(file);
  }, []);
  
  // Initialize dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            File processed successfully. Review the data below.
          </AlertDescription>
        </Alert>
      )}
      
      <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isProcessing ? (
            <p className="text-sm text-muted-foreground">
              Processing file...
            </p>
          ) : isDragActive ? (
            <p className="text-sm text-muted-foreground">
              Drop the CSV file here...
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop a CSV file here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'salesHistory' ? 'Upload sales history CSV' : 'Upload inventory items CSV'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="h-4 w-4 mr-2" />
          <span>Only CSV files are supported</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          type="button"
        >
          Download Template
        </Button>
      </div>
    </div>
  );
} 
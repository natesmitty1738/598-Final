'use client';

import React from 'react';

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <p className="text-gray-600">
          Your products will appear here. You can add new products using the form below.
        </p>
        <div className="mt-4 flex justify-end">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
} 
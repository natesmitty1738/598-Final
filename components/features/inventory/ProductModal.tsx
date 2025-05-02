import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import FileUpload from '@/components/shared/FileUpload'
import { X } from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  unitCost: number
  sellingPrice: number
  stockQuantity: number
  location?: string
  category?: string
  size?: string
  color?: string
  images?: string[]
  documents?: string[]
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onSave: (product: Partial<Product>) => void
}

export default function ProductModal({
  product,
  onClose,
  onSave,
}: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      sku: '',
      name: '',
      description: '',
      unitCost: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      location: '',
      category: '',
      size: '',
      color: '',
      images: [],
      documents: [],
    }
  )
  const [error, setError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleImageUpload(url: string) {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), url],
    }))
  }

  function handleImageRemove(url: string) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((image) => image !== url) || [],
    }))
  }

  function handleDocumentUpload(url: string) {
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), url],
    }))
  }

  function handleDocumentRemove(url: string) {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents?.filter((doc) => doc !== url) || [],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.sku || !formData.name) {
      setError('SKU and Name are required')
      return
    }

    // Validate numeric fields
    if (
      isNaN(Number(formData.unitCost)) ||
      isNaN(Number(formData.sellingPrice)) ||
      isNaN(Number(formData.stockQuantity))
    ) {
      setError('Cost, Price, and Stock must be valid numbers')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl rounded-lg bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-secondary/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU*
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit Cost*
              </label>
              <input
                type="number"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selling Price*
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock Quantity*
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                required
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Product Images
            </label>
            <FileUpload
              onChange={handleImageUpload}
              onRemove={handleImageRemove}
              value={formData.images || []}
              type="image"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Documents
            </label>
            <FileUpload
              onChange={handleDocumentUpload}
              onRemove={handleDocumentRemove}
              value={formData.documents || []}
              type="document"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
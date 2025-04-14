import React from 'react';

export default function HelpPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Help Center</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h2>
            <div className="text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Welcome to MerchX! This simple tool helps you keep track of your inventory digitally instead of using paper records.
              </p>
              <p>
                To get started, click on the "Inventory" link in the navigation bar at the top of the page. This will take you to your inventory management screen.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Managing Your Inventory</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Adding Items</h3>
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2 pl-4">
                  <li>Go to the Inventory page</li>
                  <li>Click the "Add New Item" button at the top right</li>
                  <li>Fill in the item details in the form</li>
                  <li>Click "Add Item" to save it to your inventory</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Editing Items</h3>
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2 pl-4">
                  <li>Find the item you want to change in your inventory list</li>
                  <li>Click the "Edit" button next to that item</li>
                  <li>Update the information as needed</li>
                  <li>Click "Update Item" to save your changes</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Removing Items</h3>
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2 pl-4">
                  <li>Find the item you want to remove</li>
                  <li>Click the "Delete" button next to that item</li>
                  <li>Confirm that you want to delete the item</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Searching and Filtering</h2>
            <div className="text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                You can easily find specific items in your inventory:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Search:</strong> Type in the search box to find items by name or SKU</li>
                <li><strong>Category Filter:</strong> Use the category dropdown to show only items in a specific category</li>
                <li><strong>Stock Filter:</strong> Quickly see which items are out of stock or running low</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">FAQs</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I print my inventory?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Currently, you can use your browser's print function (Ctrl+P or Cmd+P) while on the inventory page to print your current view.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Is my data backed up?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, all your inventory data is automatically saved and backed up.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Can I use this on my phone or tablet?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! MerchX works on any device with a web browser, including smartphones and tablets.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I switch between light and dark mode?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Click the sun/moon icon in the top right corner of the page to switch between light and dark mode.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Need More Help?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have questions that aren't covered here, please contact our support team at:
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium mt-2">
              support@merchx.example.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 
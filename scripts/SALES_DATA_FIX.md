# Sales Data Fix Script

This script fixes inconsistencies in sales data that might occur after CSV imports or other data operations.

## What it does

1. **Fixes missing product names in SaleItems**:
   - Finds SaleItems without a productName but with a valid productId
   - Updates them with the correct product name from the related Product

2. **Fixes missing date field in Sales**:
   - Identifies Sale records with a null date field
   - Sets the date field based on the createdAt timestamp

3. **Standardizes importSource values**:
   - Identifies sales that were likely imported (have SaleItems with productName set)
   - Sets their importSource field to 'CSV' if it's not already set

## Running the Script

```bash
# Make sure you have all dependencies installed
npm install

# Run the script
npm run fix-sales-data
```

## When to run this script

Run this script if:

1. You notice inconsistencies in your sales data display
2. Some imported sales aren't appearing on the sales page
3. You've imported CSV data but it's not properly labeled as imported
4. You want to ensure all historical data has consistent fields

The script is safe to run multiple times and will only modify records that need fixing. 
# Analytics Testing Documentation

## ProjectedEarningsCalculator Tests

### Overview
This directory contains comprehensive tests for the `ProjectedEarningsCalculator` class, which is responsible for calculating projected earnings based on historical sales data. The tests cover various aspects of the functionality, including error handling, date formatting, growth rate calculations, and edge cases.

### Coverage Statistics
Current test coverage:
- **Statements**: 97.12%
- **Branches**: 86.27%
- **Functions**: 100%
- **Lines**: 96.94%

### Test Categories

#### Core Functionality Tests
- Different time ranges (7-day, 30-day, 365-day, all-time)
- Resolution selection (daily, weekly, monthly)
- Growth rate calculations
- Date formatting
- Time series generation

#### Error Handling Tests
- Database connection failures
- Insufficient data scenarios
- Error handling in database queries
- Fallback strategies when finding oldest sale fails

#### Edge Case Tests
- Leap year date handling
- Empty data handling
- Outlier data points
- Negative growth scenarios
- Extremely high growth scenarios
- Data with gaps (periods with no sales)

#### Internal Method Tests
- Testing private methods via type assertion:
  - `determineResolution`
  - `formatDateByResolution`
  - `calculateGrowthRate`
  - `calculateTodayIndex`
  - `fetchHistoricalSales`
  - `generateTimePeriods`
  - `formatActualData`

### Test Structure
The tests are organized into three main describe blocks:
1. `calculateProjectedEarnings` - Testing the main public API
2. `internal methods` - Testing private methods directly
3. `error handling` - Testing error cases and recovery strategies

### Uncovered Lines
A few lines remain uncovered (95-96, 174, 331), which represent edge cases that are difficult to trigger in tests but are part of defensive programming practices.

### Potential Next Steps
1. Further testing of integration with API endpoints
2. Performance testing with large datasets
3. Expanding test coverage to other analytics modules
4. End-to-end testing with real database interactions

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Coverage Configuration
Coverage thresholds are set in `jest.config.js` with the following requirements:
- Statements: 95%
- Branches: 85%
- Functions: 100%
- Lines: 95% 
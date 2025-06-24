# API Best Practices Implementation

## Overview
This document outlines the best practices implemented in the 12LMSAPI project, focusing on code organization, maintainability, and scalability.

## 🏗️ Architecture Improvements

### 1. Separation of Concerns (SoC)
- **Controllers**: Business logic separated from routes
- **Routes**: Only handle HTTP request/response
- **Services**: Data access and business operations
- **Middleware**: Cross-cutting concerns (validation, auth, etc.)

### 2. Directory Structure
```
src/
├── config/           # Configuration files
│   ├── constants.js  # Centralized constants
│   └── database.js   # Database configuration
├── controllers/      # Business logic
│   └── transportController.js
├── middleware/       # Express middleware
│   ├── ldapAuth.js   # Authentication
│   └── validation.js # Input validation
├── routes/          # Route definitions
│   └── transport.js
├── utils/           # Utility functions
│   ├── cache.js     # Caching utilities
│   ├── logger.js    # Logging utilities
│   ├── responseFormatter.js # Response formatting
│   └── routeHandler.js # Route handler wrapper
└── app.js          # Main application file
```

## 🔧 Key Improvements

### 1. Centralized Constants (`src/config/constants.js`)
```javascript
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
};

const TRANSPORT = {
  STORED_PROCEDURES: {
    PAGE_BACKLOG: 'page_Backlog'
  },
  CASES: {
    SHOW_DATABL: 'show_databl',
    SHOW_WH: 'show_wh',
    SHOW_PO_DETAIL: 'show_po_detail'
  }
};
```

**Benefits:**
- Single source of truth for all constants
- Easy to maintain and update
- Prevents magic numbers/strings
- Improves code readability

### 2. Route Handler Wrapper (`src/utils/routeHandler.js`)
```javascript
const createRouteHandler = (controllerFunction, options = {}) => {
  // Handles validation, error handling, and response formatting
};
```

**Benefits:**
- Reduces code duplication (DRY principle)
- Consistent error handling
- Standardized response format
- Centralized validation logic

### 3. Response Formatter (`src/utils/responseFormatter.js`)
```javascript
const createSuccessResponse = (data, metadata = {}) => {
  return {
    status: { code: 200, message: "Success", timestamp, timezone },
    data: data,
    pagination: { /* pagination info */ }
  };
};
```

**Benefits:**
- Consistent API responses
- Thai timezone support
- Standardized error format
- Pagination metadata

### 4. Validation Middleware (`src/middleware/validation.js`)
```javascript
const validateRequiredParams = (requiredParams) => {
  return (req, res, next) => {
    // Validation logic
  };
};
```

**Benefits:**
- Reusable validation functions
- Input sanitization
- Type checking
- Customizable validation rules

### 5. **Caching**
- Intelligent cache key generation
- Configurable TTL
- Cache invalidation strategies
- **New**: Manual cache clearing endpoint

### 6. **Logging**
- Structured logging
- Error tracking
- Performance monitoring
- Request/response logging
- Helmet security headers

## 🚀 New API Endpoints

### PO Details Endpoint
Based on your PHP code, we've implemented:

```javascript
// GET /api/transport/po-details?po_no=PO123
// POST /api/transport/po-details
{
  "po_no": "PO123"
}
```

**Response:**
```json
{
  "status": {
    "code": 200,
    "message": "Success",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "timezone": "Asia/Bangkok"
  },
  "data": [
    // PO details from stored procedure
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 5,
    "per_page": 10,
    "has_next": false,
    "has_previous": false
  }
}
```

## 📋 Best Practices Implemented

### 1. **DRY (Don't Repeat Yourself)**
- Route handler wrapper eliminates duplicate code
- Shared utility functions
- Centralized constants

### 2. **Single Responsibility Principle**
- Each function has one clear purpose
- Controllers handle business logic only
- Routes handle HTTP concerns only

### 3. **Error Handling**
- Consistent error response format
- Proper HTTP status codes
- Development vs production error details

### 4. **Input Validation**
- Required parameter validation
- Type checking
- Input sanitization
- Pagination validation

### 5. **Caching**
- Intelligent cache key generation
- Configurable TTL
- Cache invalidation strategies
- **New**: Manual cache clearing endpoint

### 6. **Logging**
- Structured logging
- Error tracking
- Performance monitoring
- Request/response logging
- Helmet security headers

### 7. **Security**
- Input sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## 🔄 Migration from PHP

### Original PHP Code:
```php
<?php
include('../config/cnn.php');
$po_no = $_POST['po_no'] ?? '';

$sql = "EXEC [dbo].[page_Backlog] 'show_po_detail', '$po_no','','','','','','','','',''";
$qsql = $conn->sqlQuery($sql);

$details = [];
while ($row = sqlsrv_fetch_array($qsql, SQLSRV_FETCH_ASSOC)) {
    $details[] = $row;
}
?>
```

### Equivalent Node.js Implementation:
```javascript
// Controller
const getPODetailsData = async (params) => {
  const { po_no } = params;
  
  if (!po_no) {
    throw new Error('po_no parameter is required');
  }
  
  const result = await executeStoredProcedure('page_Backlog', {
    hcase: 'show_po_detail',
    p1: po_no,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
  
  return Array.isArray(result) ? result : [];
};

// Route
router.get('/po-details', createRouteHandler(getPODetailsData, {
  requiredParams: ['po_no'],
  stringParams: ['po_no']
}));
```

## 🎯 Benefits of This Approach

1. **Maintainability**: Easy to modify and extend
2. **Scalability**: Modular architecture supports growth
3. **Testability**: Isolated components are easier to test
4. **Consistency**: Standardized patterns across the API
5. **Documentation**: Self-documenting code structure
6. **Performance**: Efficient caching and validation
7. **Security**: Built-in security measures
8. **Monitoring**: Comprehensive logging and error tracking

## 📝 Usage Examples

### Adding New Endpoints
```javascript
// 1. Add controller function
const getNewData = async (params) => {
  // Business logic here
};

// 2. Add route with validation
router.get('/new-endpoint', createRouteHandler(getNewData, {
  requiredParams: ['param1', 'param2'],
  stringParams: ['param1'],
  numericParams: ['param2']
}));
```

### Custom Validation
```javascript
// Add to validation middleware
const validateCustomParams = (customRules) => {
  return (req, res, next) => {
    // Custom validation logic
  };
};
```

##  caching ##
### Cache Invalidation

To address the issue of stale data, a cache invalidation mechanism has been implemented. This allows for the performance benefits of caching while ensuring data freshness when required.

#### How It Works:
1.  **Cache Clearing Utility**: A function `clearCacheByPrefix` has been added to `src/utils/cache.js` to programmatically delete cache entries based on a given prefix (e.g., `transport_`).
2.  **Secure Endpoint**: A new secure endpoint, `POST /api/cache/clear`, has been created. This endpoint is protected by authentication middleware to ensure only authorized users can clear the cache.

#### Usage:
When data in the database is updated, you can manually clear the relevant cache by sending a POST request to the `/api/cache/clear` endpoint with the appropriate prefix in the request body.

**Example Request:**
```http
POST /api/cache/clear
Host: your-api-domain.com
Authorization: Bearer <your_auth_token>
Content-Type: application/json

{
  "prefix": "transport"
}
```

This request will delete all cache entries whose keys start with `transport`, forcing the application to fetch fresh data from the database on the next request.

**Benefits:**
-   **Data Freshness**: Ensures users can access the latest data on demand.
-   **Performance**: Retains the performance advantages of caching for frequently accessed, non-volatile data.
-   **Control**: Provides administrators with direct control over the cache state.

## 🎯 Benefits of This Approach

1. **Maintainability**: Easy to modify and extend
2. **Scalability**: Modular architecture supports growth
3. **Testability**: Isolated components are easier to test
4. **Consistency**: Standardized patterns across the API
5. **Documentation**: Self-documenting code structure
6. **Performance**: Efficient caching and validation
7. **Security**: Built-in security measures
8. **Monitoring**: Comprehensive logging and error tracking

This implementation follows industry best practices and provides a solid foundation for a scalable, maintainable API. 
# 🚚 ระบบจัดการ Logistics API

ระบบจัดการ Logistics ที่พัฒนาด้วย Node.js และ Express.js สำหรับจัดการข้อมูลการขนส่ง คลังสินค้า และ Backlog

## 📋 คุณสมบัติหลัก

### 🔧 **Backend API**
- **Node.js** + **Express.js** framework
- **SQL Server** database connection
- **LDAP Authentication** สำหรับระบบความปลอดภัย
- **Caching System** สำหรับเพิ่มประสิทธิภาพ
- **Logging System** สำหรับติดตามการทำงาน
- **WebSocket** สำหรับ real-time updates

### 📊 **ฟีเจอร์หลัก**
- **จัดการข้อมูล Backlog** - ติดตามคำสั่งซื้อที่ค้างส่ง
- **จัดการข้อมูล Warehouse** - ข้อมูลคลังสินค้า
- **ระบบขนส่ง** - จัดการข้อมูลการขนส่ง
- **ระบบ Authentication** - ตรวจสอบสิทธิ์ผู้ใช้
- **ระบบ Logging** - บันทึกการทำงานของระบบ

## 🏗️ โครงสร้างโปรเจค

```
12LogisticAPI/
├── logs/                    # ไฟล์ log ต่างๆ
│   ├── combined.log
│   └── error.log
├── src/
│   ├── app.js              # ไฟล์หลักของแอปพลิเคชัน
│   ├── config/
│   │   └── database.js     # การตั้งค่าฐานข้อมูล
│   ├── middleware/
│   │   └── ldapAuth.js     # LDAP Authentication
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── inventory.js    # Inventory management
│   │   ├── logs.js         # Log management
│   │   └── transport.js    # Transport & Logistics
│   ├── utils/
│   │   ├── cache.js        # Caching system
│   │   ├── logger.js       # Logging utilities
│   │   ├── morganStream.js # HTTP request logging
│   │   └── socketTransport.js # WebSocket transport
│   └── views/
│       └── layout.ejs      # EJS template layout
├── package.json
└── package-lock.json
```

## 🚀 การติดตั้งและใช้งาน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม
สร้างไฟล์ `.env` และกำหนดค่าต่างๆ:
```env
# Database Configuration
DB_SERVER=your_server
DB_DATABASE=your_database
DB_USER=your_username
DB_PASSWORD=your_password

# LDAP Configuration
LDAP_URL=ldap://your_ldap_server
LDAP_BASE_DN=dc=example,dc=com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. รันเซิร์ฟเวอร์
```bash
npm start
```

## 📡 API Endpoints

### 🔐 Authentication
```
POST /api/auth/login     - เข้าสู่ระบบ
POST /api/auth/logout    - ออกจากระบบ
GET  /api/auth/verify    - ตรวจสอบสถานะการเข้าสู่ระบบ
```

### 📦 Transport & Logistics
```
GET  /api/transport/backlog     - ข้อมูล Backlog (Query Parameters)
POST /api/transport/backlog     - ข้อมูล Backlog (Body Parameters)
GET  /api/transport/warehouses  - ข้อมูล Warehouse (Query Parameters)
POST /api/transport/warehouses  - ข้อมูล Warehouse (Body Parameters)
GET  /api/transport            - ข้อมูลทั่วไป (Query Parameters)
POST /api/transport            - ข้อมูลทั่วไป (Body Parameters)
```

### 📋 Inventory Management
```
GET  /api/inventory     - ข้อมูล Inventory
POST /api/inventory     - เพิ่มข้อมูล Inventory
PUT  /api/inventory/:id - อัปเดตข้อมูล Inventory
DELETE /api/inventory/:id - ลบข้อมูล Inventory
```

### 📝 Log Management
```
GET  /api/logs          - ดูข้อมูล Log
POST /api/logs          - เพิ่ม Log ใหม่
```

## 🔧 การใช้งาน API

### ตัวอย่างการเรียกใช้ Backlog API

#### GET Request (Query Parameters)
```bash
GET /api/transport/backlog?wh=102&status=ALL&page=1&per_page=10
```

#### POST Request (Body Parameters)
```json
{
  "wh": "102",
  "status": "ALL",
  "page": 1,
  "per_page": 10
}
```

### Response Format
```json
{
  "status": {
    "code": 200,
    "message": "Success",
    "timestamp": "2025-01-17T10:30:00.000Z",
    "timezone": "Asia/Bangkok"
  },
  "data": [
    {
      "wh_no": "102",
      "date_create": "2025-05-21T00:00:00.000Z",
      "date_send": "2025-05-26T00:00:00.000Z",
      "po_no": "680527057",
      "cus_code": "40170012",
      "cus_name": "บิ๊กบี",
      "addressbl": "571ม.11 ต.หนองโก อ.กระนวน จ.ขอนแก่น 40170",
      "provincebl": "ต.หนองโก อ.กระนวน",
      "overdue": -22,
      "fg": 12,
      "pm": 5,
      "reason": null,
      "otherbl": null,
      "po_detail": null,
      "created_at": "2025-06-17T13:33:44.963Z",
      "modify_at": null,
      "modify_by": null
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 1,
    "per_page": 10,
    "has_next": false,
    "has_previous": false
  }
}
```

## 🔒 ความปลอดภัย

### LDAP Authentication
- ใช้ LDAP สำหรับตรวจสอบสิทธิ์ผู้ใช้
- รองรับ Active Directory และ OpenLDAP
- Session management ที่ปลอดภัย

### Middleware Security
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 📊 การติดตามและ Logging

### Log Files
- `logs/combined.log` - Log ทั้งหมด
- `logs/error.log` - Log เฉพาะ Error

### Log Levels
- **INFO** - ข้อมูลทั่วไป
- **WARN** - คำเตือน
- **ERROR** - ข้อผิดพลาด
- **DEBUG** - ข้อมูลสำหรับ debug

## 🚀 Performance Optimization

### Caching System
- Redis-based caching
- Cache invalidation strategy
- Performance monitoring

### Database Optimization
- Connection pooling
- Query optimization
- Stored procedures usage

## 🔧 การพัฒนา

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing
```bash
npm test
```

## 📞 การสนับสนุน

สำหรับคำถามหรือปัญหาต่างๆ กรุณาติดต่อ:
- **Email**: support@logistics.com
- **Phone**: +66-2-XXX-XXXX
- **Documentation**: [Wiki](https://wiki.logistics.com)

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

---

**พัฒนาโดย** Logistics Development Team  
**เวอร์ชัน** 1.0.0  
**อัปเดตล่าสุด** 2025-01-17 
# Transport Cost Edit API

API สำหรับการจัดการ Shipment และคำนวณค่าขนส่ง

## Endpoint

```
GET /api/transport/cost-edit
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `who_no` | string | Yes | หมายเลขคลัง (WHO_NO) |
| `begin_no` | string | Yes | หมายเลขเริ่มต้น (BEGIN_NO) |
| `end_no` | string | Yes | หมายเลขสิ้นสุด (END_NO) |
| `route_no` | string | Yes | หมายเลขเส้นทาง (ROUTE_NO) |
| `shipment_no` | string | Yes | หมายเลข Shipment (SHIPMENT_NO) |
| `cal_id1` | string | No | ค่า CAL1 (default: '0') |
| `cal_id2` | string | No | ค่า CAL2 (default: '0') |
| `cal_id3` | string | No | ค่า CAL3 (default: '0') |
| `type_no` | string | No | ประเภท (default: '1') |
| `helpper` | string | No | ค่า Helper (default: '0') |

## Stored Procedures Used

### 1. show_shipment
```sql
EXEC [dbo].[page_TransCost] 'show_shipment','105','001','100','BNT015','2509040','',''
```

### 2. costtype
```sql
EXEC [dbo].[page_TransCost] 'costtype','','','','','','',''
```

### 3. cost_rate
```sql
EXEC [dbo].[page_TransCost] 'cost_rate','','','','','','',''
```

### 4. show_detail
```sql
EXEC [dbo].[page_TransCost] 'show_detail','105','2509040','','','','',''
```

## Response Format

```json
{
  "success": true,
  "data": {
    "shipment": {
      "OQDSDT": "20250627",
      "OQWHLO": "105",
      "OQROUT": "BNT015",
      "OQCONN": "2509040",
      "URPLQA": 189,
      "URPRQA": 0,
      "COST": 0,
      "pallet_cost": 0,
      "BPERCTN": 0,
      "cBill": 2,
      "Drive_name": "FWD | ",
      "who_name": "ศูนย์กระจายสินค้าสมุทรปราการ",
      "wh_name": "105-ศูนย์กระจายสินค้าสมุทรปราการ",
      "Route_name": "BNT015-เมืองชลบุรี-บางปะกง-บางวัว-บางแสน-พานทอง",
      "calculated_cost": 600,
      "calculated_cost_ctn": 3.17,
      "cal3": null
    },
    "cost_types": [
      {
        "cost_type_id": "1",
        "cost_type_name": "รูปแบบที่ 1"
      },
      {
        "cost_type_id": "2",
        "cost_type_name": "รูปแบบที่ 2"
      }
    ],
    "cost_rates": [
      {
        "FORCOST": "200"
      },
      {
        "FORCOST": "300"
      }
    ],
    "details": [
      {
        "OACUNO": "C001",
        "ODORTP": "FG",
        "ODTX40": "Order Name",
        "OQRIDN": "DOC001",
        "URITNO": "ITEM001",
        "MMITDS": "Product Name",
        "CTN_QTY": 10
      }
    ],
    "session": {
      "WHO_NO": "105",
      "BEGIN_NO": "001",
      "END_NO": "100",
      "ROUTE_NO": "BNT015",
      "SHIPMENT_NO": "2509040",
      "CAL1": "200",
      "CAL2": "200",
      "CAL3": null,
      "TYPE_NO": "1",
      "HELPPER": "0"
    }
  }
}
```

## Usage Examples

### JavaScript Fetch
```javascript
const params = new URLSearchParams({
  who_no: '105',
  begin_no: '001',
  end_no: '100',
  route_no: 'BNT015',
  shipment_no: '2509040',
  cal_id1: '200',
  cal_id2: '200',
  cal_id3: '200',
  type_no: '1',
  helpper: '0'
});

fetch(`/api/transport/cost-edit?${params}`)
  .then(response => response.json())
  .then(data => {
    console.log('Shipment Data:', data.data.shipment);
    console.log('Cost Types:', data.data.cost_types);
    console.log('Cost Rates:', data.data.cost_rates);
    console.log('Details:', data.data.details);
  });
```

### cURL
```bash
curl -X GET "http://localhost:3000/api/transport/cost-edit?who_no=105&begin_no=001&end_no=100&route_no=BNT015&shipment_no=2509040&cal_id1=200&cal_id2=200&cal_id3=200&type_no=1&helpper=0"
```

### HTML Form Example
```html
<form id="editForm">
  <div>
    <label>คลัง:</label>
    <input type="text" name="who_no" value="105" readonly>
  </div>
  <div>
    <label>Shipment:</label>
    <input type="text" name="shipment_no" value="2509040" readonly>
  </div>
  <div>
    <label>รูปแบบ:</label>
    <select name="type_no" id="type_select">
      <option value="1">รูปแบบที่ 1</option>
      <option value="2">รูปแบบที่ 2</option>
    </select>
  </div>
  <div>
    <label>EXTRA:</label>
    <input type="number" name="cal_id2" value="200">
  </div>
  <div>
    <label>ราคาเหมา:</label>
    <select name="cal_id1" id="rate_select">
      <option value="200">200</option>
      <option value="300">300</option>
    </select>
  </div>
  <div>
    <label>ค่าพาเลท:</label>
    <input type="number" name="cal_id3" value="200">
  </div>
  <button type="button" onclick="calculateCost()">คำนวณ</button>
</form>

<script>
async function calculateCost() {
  const formData = new FormData(document.getElementById('editForm'));
  const params = new URLSearchParams(formData);
  
  try {
    const response = await fetch(`/api/transport/cost-edit?${params}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('cost').value = data.data.shipment.calculated_cost;
      document.getElementById('cost_ctn').value = data.data.shipment.calculated_cost_ctn.toFixed(2);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
</script>
```

## Cost Calculation Logic

### เมื่อ COST = 0:
```javascript
cost = cal_id1 + cal_id2 + cal_id3;
cost_ctn = cost / (URPLQA + URPRQA);
```

### เมื่อ COST ≠ 0:
```javascript
cost = COST;
cost_ctn = COST / (URPLQA + URPRQA);
if (pallet_cost !== 0) {
  cal3 = pallet_cost;
}
```

## Features

1. **Shipment Information**: ข้อมูลพื้นฐานของ shipment
2. **Cost Types**: รายการประเภทค่าใช้จ่าย
3. **Cost Rates**: รายการอัตราค่าใช้จ่าย
4. **Detail Data**: รายละเอียดสินค้าใน shipment
5. **Session Data**: ข้อมูล session สำหรับการคำนวณ
6. **Cost Calculation**: การคำนวณค่าขนส่งและราคาต่อหีบ

## Error Handling

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
``` 
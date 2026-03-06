# 修改计划：利润统计使用 v_ord 视图

## v_ord 视图字段对比

| 字段 | 新厂新系统 | 老厂新系统 | 温森新系统 | 临海旧系统 |
|------|-----------|-----------|-----------|-----------|
| 数量 | ACCNUM | ACCNUM | ACCNUM | ACCNUM |
| 总金额 | ACCAMT | ACCAMT | ACCAMT | ACCAMT |
| 卖价单价 | PRICES | PRICES | PRICES | PRICES |
| 报价单价 | INPRICE | INPRICE | INPRICE | AGNTPRC |
| 客户名 | CLNTNME | CLNTNME | CLNTNME | CLNTNME |
| 产品名 | PRDNME | PRDNME | PRDNME | PRDNME |
| 单号 | SERIAL | SERIAL | SERIAL | SERIAL |
| 日期 | PTDATE | PTDATE | PTDATE | PTDATE |
| 业务员 | AGNTCDE | AGNTCDE | AGNTCDE | AGNTCDE |

## 关键发现

1. **所有系统都有 v_ord 视图**
2. **字段基本一致**，只有报价单价字段有差异：
   - 新系统（新厂、老厂、温森）：`INPRICE`
   - 旧系统（临海）：`AGNTPRC`

## 修改方案

使用 v_ord 视图统一查询：

```sql
-- 新系统
SELECT 
    TO_CHAR(PTDATE, 'yyyy-MM-dd') as 日期,
    SERIAL as 单号,
    CLNTNME as 客户,
    PRDNME as 产品,
    AGNTCDE as 业务员编码,
    NVL(INPRICE, 0) * NVL(ACCNUM, 0) as 报价总金额,
    NVL(PRICES, 0) * NVL(ACCNUM, 0) as 卖价总金额,
    NVL(PRICES, 0) * NVL(ACCNUM, 0) - NVL(INPRICE, 0) * NVL(ACCNUM, 0) as 毛利
FROM V_ORD
WHERE ISACTIVE = 'Y'
  AND PTDATE >= ...

-- 旧系统（临海）
SELECT 
    TO_CHAR(PTDATE, 'yyyy-MM-dd') as 日期,
    SERIAL as 单号,
    CLNTNME as 客户,
    PRDNME as 产品,
    AGNTCDE as 业务员编码,
    NVL(AGNTPRC, 0) * NVL(ACCNUM, 0) as 报价总金额,
    NVL(PRICES, 0) * NVL(ACCNUM, 0) as 卖价总金额,
    NVL(PRICES, 0) * NVL(ACCNUM, 0) - NVL(AGNTPRC, 0) * NVL(ACCNUM, 0) as 毛利
FROM V_ORD
WHERE ISACTIVE = 'Y'
  AND PTDATE >= ...
```

## 优势

1. 统一使用 v_ord 视图，代码更简洁
2. 不需要区分新系统/旧系统的复杂表关联
3. 直接获取数量和金额，计算总金额更准确
4. 所有系统都支持，字段基本一致

## 实施步骤

1. 修改 BuildQueryString 方法，使用 v_ord 视图
2. 区分新系统和旧系统的报价单价字段
3. 计算总金额 = 单价 × 数量
4. 修改列标题："差额" → "毛利"

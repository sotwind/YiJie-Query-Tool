# 简化查询方案 - 绕过 V_ORD 视图

## 关键信息

- **pb_clnt.agntcde**：业务员编码直接存储在客户表中
- **pb_clnt 表已有足够信息**：不需要关联员工表和部门表
- **仅针对新厂**：使用新厂数据库结构
- **绕过 V_ORD 视图**：直接查询基础表，避免 ORA-01427 错误

## 基础表分析

### 1. 订单主表：ORD_CT
- 字段：ID, SERIAL, CLIENTID, ORGCDE, ISACTIVE, ...

### 2. 订单基础表：ORD_BAS
- 字段：ID, SERIAL, CLIENTID, ORGCDE, CLNTCDE, PRDCDE, PRDNME, ACCNUM, PRICES, PTDATE, QUOPRC, ...

### 3. 客户表：PB_CLNT
- 字段：CLIENTID, ORGCDE, CLNTCDE, CLNTNME, **AGNTCDE**（业务员编码）, SMNME, SMPING, OBJTYP, ...

## 简化后的查询方案

### SQL 结构

```sql
SELECT 
    TO_CHAR(b.PTDATE, 'yyyy-MM-dd') as 日期,
    b.SERIAL as 单号,
    c.CLNTNME as 客户,
    b.PRDNME as 产品,
    c.AGNTCDE as 业务员编码,  -- 直接从 pb_clnt 表获取
    NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) as 报价总金额,
    NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) as 卖价总金额,
    NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) as 毛利,
    CASE 
        WHEN NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) = 0 THEN NULL
        ELSE ROUND((NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0)) / (NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0)) * 100, 2)
    END as 利率
FROM ORD_CT t
JOIN ORD_BAS b ON t.CLIENTID = b.CLIENTID AND t.ORGCDE = b.ORGCDE AND t.SERIAL = b.SERIAL
LEFT JOIN PB_CLNT c ON b.CLIENTID = c.CLIENTID 
    AND b.ORGCDE = c.ORGCDE 
    AND b.CLNTCDE = c.CLNTCDE 
    AND c.OBJTYP = 'CT'
WHERE t.ISACTIVE = 'Y'
  AND b.PTDATE >= TO_DATE('2026-03-07', 'yyyy-MM-dd')
  AND b.PTDATE < TO_DATE('2026-03-08', 'yyyy-MM-dd')
  -- 业务员筛选：直接使用 pb_clnt.agntcde
  AND c.AGNTCDE IN ('18815220168', '17671388396', ...)
ORDER BY b.PTDATE DESC
```

## 验证步骤

1. **验证 pb_clnt.agntcde 字段**：确认存储业务员编码
2. **测试查询**：使用 MCP 测试新 SQL 是否能正常执行（3月7号数据）
3. **对比结果**：与 V_ORD 视图查询结果对比

## 实施计划

1. 修改 `窗体_利润统计.cs` 中的 `BuildQueryString` 方法（新系统分支）
2. 新厂系统使用直接查询基础表的方式
3. 业务员编码从 pb_clnt.agntcde 获取
4. 测试验证

## 风险控制

- 先备份原代码
- 小范围测试（如只查询一天数据）
- 对比查询结果确保一致性

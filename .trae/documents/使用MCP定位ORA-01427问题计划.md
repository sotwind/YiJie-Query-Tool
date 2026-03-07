# 使用 MCP 定位 ORA-01427 问题计划

## 问题描述

- **时间**：3月7号（今天）的数据报错
- **时间**：3月6号（昨天）的数据正常
- **条件**：销售1部
- **错误**：ORA-01427: 单行子查询返回多个行

## 测试步骤

### 步骤1：测试 V_ORD 视图查询（3月7号 vs 3月6号）

使用 MCP 执行以下 SQL，对比两天的数据差异：

```sql
-- 3月7号的数据（会报错）
SELECT COUNT(*) as cnt
FROM V_ORD v
WHERE v.ISACTIVE = 'Y'
  AND v.PTDATE >= TO_DATE('2026-03-07', 'yyyy-MM-dd')
  AND v.PTDATE < TO_DATE('2026-03-08', 'yyyy-MM-dd')
  AND v.AGNTCDE IN (
    SELECT EMPCDE FROM PB_EMPS WHERE TEMNME LIKE '%销售1部%'
  );

-- 3月6号的数据（正常）
SELECT COUNT(*) as cnt
FROM V_ORD v
WHERE v.ISACTIVE = 'Y'
  AND v.PTDATE >= TO_DATE('2026-03-06', 'yyyy-MM-dd')
  AND v.PTDATE < TO_DATE('2026-03-07', 'yyyy-MM-dd')
  AND v.AGNTCDE IN (
    SELECT EMPCDE FROM PB_EMPS WHERE TEMNME LIKE '%销售1部%'
  );
```

### 步骤2：查看 V_ORD 视图定义

```sql
SELECT text FROM user_views WHERE view_name = 'V_ORD';
-- 或者
SELECT text FROM all_views WHERE view_name = 'V_ORD';
```

### 步骤3：定位具体出错的子查询

根据 V_ORD 视图定义，逐个测试子查询：

1. **pb_clnt 相关子查询**：
```sql
-- 测试 pb_clnt 子查询是否有重复
SELECT t.serial, t.clientid, t.orgcde, t.clntcde, COUNT(*) as cnt
FROM ord_ct t
JOIN pb_clnt p ON p.clientid = t.clientid 
  AND p.orgcde = t.orgcde 
  AND p.clntcde = t.clntcde 
  AND p.objtyp = 'CT'
WHERE t.ptdate >= TO_DATE('2026-03-07', 'yyyy-MM-dd')
  AND t.ptdate < TO_DATE('2026-03-08', 'yyyy-MM-dd')
  AND t.agntcde IN (SELECT EMPCDE FROM PB_EMPS WHERE TEMNME LIKE '%销售1部%')
GROUP BY t.serial, t.clientid, t.orgcde, t.clntcde
HAVING COUNT(*) > 1;
```

2. **其他子查询**：根据视图定义逐个测试

### 步骤4：修复方案

找到具体出错的子查询后，使用 `ROWNUM = 1` 修复：

```sql
-- 原查询（有问题）
(SELECT CLNTNME FROM pb_clnt WHERE ...)

-- 修复后
(SELECT CLNTNME FROM pb_clnt WHERE ... AND ROWNUM = 1)
```

## 实施计划

1. 使用 MCP 连接新厂数据库
2. 对比 3月6号和3月7号的数据量
3. 查看 V_ORD 视图完整定义
4. 定位具体出错的子查询
5. 制定修复方案

## 工具

- MCP Server: `mcp_yijie-xinchang`
- Tool: `execute_sql`

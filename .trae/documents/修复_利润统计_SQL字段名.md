# 修复计划：利润统计 SQL 字段名错误

## 问题分析

从截图可以看到错误信息：
```
ORA-00904: "E"."EMPNME": 标识符无效
```

SQL 中使用了错误的字段名：
- `e.empnme` - 错误，pb_agnt 表中没有这个字段
- `d.dptnme` - 错误，pb_agnt 表中没有这个字段

## 原因

在 [窗体_利润统计.cs](file:///h:/TraeDev/易捷业务数据查询/易捷查询CSharp/易捷查询CSharp/窗体_利润统计.cs) 中，对于新厂新系统：
- 业务员表从 `pb_dept_member` 改为 `pb_agnt`
- 但 SQL 中的字段名没有相应修改

## pb_agnt 表的实际字段

根据之前的查询结果：
- `AGNTCDE` - 业务员编码（不是 EMPCDE）
- `AGNTNME` - 业务员姓名（不是 EMPNME）
- `DPTCDE` - 部门编码
- `DPTNME` - 部门名称

## 修复方案

修改 `BuildQueryString` 方法，对于新厂新系统：
1. 使用 `e.agntnme` 代替 `e.empnme`
2. 使用 `d.dptnme`（这个是对的，因为 d 也是 pb_agnt 表）

实际上，由于新厂新系统的业务员表和部门表都是 `pb_agnt`，所以：
- `e.agntnme` 是业务员姓名
- `d.dptnme` 是部门名称

## 实施步骤

1. 修改 `窗体_利润统计.cs` 中的 SQL 构建逻辑
2. 对于新厂新系统，使用正确的字段别名或直接使用 pb_agnt 的字段名

## 具体修改

将 SQL 中的字段选择改为：
```sql
-- 新厂新系统
SELECT 
    e.agntnme as 业务员,
    d.dptnme as 部门,
    ...

-- 其他新系统
SELECT 
    e.empnme as 业务员,
    d.dptnme as 部门,
    ...
```

或者使用 CASE 语句动态选择字段名。

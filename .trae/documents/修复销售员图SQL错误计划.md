# 修复销售员图 SQL 错误计划

## 问题确认

### 错误信息

```
ORA-00904: "T"."ACCNUM": 标识符无效
```

### 当前SQL（有问题的）

```sql
select b.objtyp, t.agntcde, 
       nvl(sum(t.accamt),0) as 金额, 
       nvl(sum(t.acreage*t.accnum),0) as 面积, 
       count(*) as 单数 
from ord_ct t 
left join ord_bas b on t.clientid = b.clientid and t.orgcde = b.orgcde and t.serial = b.serial
where status='Y' 
  and ptdate >= to_date('2026-03-06', 'yyyy-MM-dd') 
  and ptdate < to_date('2026-03-07', 'yyyy-MM-dd') 
  and agntcde in (...)
group by t.agntcde, b.objtyp 
order by t.agntcde
```

### 问题分析

1. `ord_ct` 表中没有 `accnum` 字段
2. `ord_ct` 表中没有 `acreage` 字段
3. `ord_ct` 表中没有 `ptdate` 字段（可能）
4. `ord_ct` 表中没有 `status` 字段（可能）

## 需要确认的信息

由于MCP工具无法使用，需要通过其他方式确认：

1. **查看 v\_ord 视图定义** - 了解字段映射关系
2. **查看 ord\_bas 表结构** - 确认哪些字段在 ord\_bas 中
3. **查看 ord\_ct 表结构** - 确认 ord\_ct 有哪些字段

## 可能的解决方案

### 方案1：所有字段都在 ord\_bas 中

如果 `accamt`, `acreage`, `accnum`, `ptdate`, `status` 都在 `ord_bas` 中：

```sql
select b.objtyp, t.agntcde, 
       nvl(sum(b.accamt),0) as 金额, 
       nvl(sum(b.acreage*b.accnum),0) as 面积, 
       count(*) as 单数 
from ord_bas b 
left join ord_ct t on b.clientid = t.clientid and b.orgcde = t.orgcde and b.serial = t.serial
where b.status='Y' 
  and b.ptdate >= ...
  and t.agntcde in (...)
group by t.agntcde, b.objtyp 
```

### 方案2：需要关联其他表

可能需要关联更多表来获取完整数据。

### 方案3：使用 v\_ord 视图但修复 ORA-01427

回到使用 v\_ord 视图，但找出并修复导致 ORA-01427 的具体数据问题。

## 实施步骤

1. **查看现有代码和文档** - 寻找表结构信息
2. **确认正确的字段位置** - ord\_ct vs ord\_bas
3. **修改SQL语句** - 使用正确的表和字段
4. **测试验证** - 在所有服务器上测试

## 备选方案

如果无法确认正确表结构，可以：

1. 询问DBA或熟悉数据库的人员
2. 使用 SQL\*Plus 或其他工具直接查询数据库
3. 暂时使用 v\_ord 视图，但添加错误处理


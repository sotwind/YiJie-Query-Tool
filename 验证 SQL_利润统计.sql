-- ============================================
-- 易捷查询 - 利润统计功能 SQL 验证脚本
-- ============================================
-- 用途：验证业务员和部门表关联逻辑
-- 执行数据库：老厂新系统 (36.138.132.30)
-- 验证日期：2026-03-05
-- ============================================

SET PAGESIZE 100
SET LINESIZE 200
COL 日期 FOR A12
COL 单号 FOR A20
COL 客户 FOR A30
COL 产品 FOR A30
COL 业务员 FOR A20
COL 部门 FOR A20

-- ========================================
-- 测试 1: 检查 pb_dept_member 表结构
-- ========================================
PROMPT ========================================
PROMPT 测试 1: pb_dept_member 表结构
PROMPT ========================================

SELECT column_name, data_type, data_length, nullable
FROM all_tab_columns 
WHERE table_name = 'PB_DEPT_MEMBER' 
  AND owner = 'FERP'
ORDER BY column_id;

-- ========================================
-- 测试 2: 查看 pb_dept_member 示例数据
-- ========================================
PROMPT ========================================
PROMPT 测试 2: pb_dept_member 示例数据（前 10 条）
PROMPT ========================================

SELECT 
    user_cde, 
    empcde, 
    user_nme, 
    empnme, 
    dept_cde, 
    dptcde,
    mobile,
    isactive
FROM ferp.pb_dept_member 
WHERE isactive = 'Y' 
AND ROWNUM <= 10;

-- ========================================
-- 测试 3: 查看 pb_dept 表结构
-- ========================================
PROMPT ========================================
PROMPT 测试 3: pb_dept 表结构
PROMPT ========================================

SELECT column_name, data_type, data_length
FROM all_tab_columns 
WHERE table_name = 'PB_DEPT' 
  AND owner = 'FERP'
ORDER BY column_id;

-- ========================================
-- 测试 4: 查看 pb_dept 示例数据
-- ========================================
PROMPT ========================================
PROMPT 测试 4: pb_dept 示例数据（前 10 条）
PROMPT ========================================

SELECT dept_cde, dptcde, dept_nme, dptnme, isactive
FROM ferp.pb_dept 
WHERE isactive = 'Y' 
AND ROWNUM <= 10;

-- ========================================
-- 测试 5: 查看 ord_ct 表中 agntcde 数据
-- ========================================
PROMPT ========================================
PROMPT 测试 5: ord_ct 表中 agntcde 数据（2026-03-04）
PROMPT ========================================

SELECT agntcde, asscde, serial, created, isactive
FROM ferp.ord_ct 
WHERE isactive = 'Y' 
  AND created >= DATE '2026-03-04'
  AND created < DATE '2026-03-05'
  AND agntcde IS NOT NULL
ORDER BY created DESC;

-- ========================================
-- 测试 6: 统计 agntcde 的分布
-- ========================================
PROMPT ========================================
PROMPT 测试 6: agntcde 分布统计（前 20）
PROMPT ========================================

SELECT agntcde, COUNT(*) as 订单数
FROM ferp.ord_ct 
WHERE isactive = 'Y' 
  AND created >= DATE '2026-03-04'
  AND created < DATE '2026-03-05'
  AND agntcde IS NOT NULL
GROUP BY agntcde
ORDER BY COUNT(*) DESC
FETCH FIRST 20 ROWS ONLY;

-- ========================================
-- 测试 7: 测试 JOIN - 使用 user_cde
-- ========================================
PROMPT ========================================
PROMPT 测试 7: JOIN 测试 - t.agntcde = e.user_cde
PROMPT ========================================

SELECT 
    b.serial as 单号，
    t.agntcde as 订单业务员编码，
    e.user_cde as 业务员表 user_cde,
    e.empcde as 业务员表 empcde,
    e.user_nme as 业务员姓名，
    e.empnme as 业务员姓名 2,
    d.dept_cde as 部门编码，
    d.dept_nme as 部门名称，
    b.created as 订单日期
FROM ferp.ord_ct t
JOIN ferp.ord_bas b ON t.serial = b.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.user_cde
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
  AND ROWNUM <= 20;

-- ========================================
-- 测试 8: 测试 JOIN - 使用 empcde
-- ========================================
PROMPT ========================================
PROMPT 测试 8: JOIN 测试 - t.agntcde = e.empcde
PROMPT ========================================

SELECT 
    b.serial as 单号，
    t.agntcde as 订单业务员编码，
    e.empcde as 业务员表 empcde,
    e.user_cde as 业务员表 user_cde,
    e.user_nme as 业务员姓名，
    e.empnme as 业务员姓名 2,
    d.dept_cde as 部门编码，
    d.dept_nme as 部门名称，
    b.created as 订单日期
FROM ferp.ord_ct t
JOIN ferp.ord_bas b ON t.serial = b.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.empcde
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
  AND ROWNUM <= 20;

-- ========================================
-- 测试 9: 测试 JOIN - 使用 mobile（如果存在）
-- ========================================
PROMPT ========================================
PROMPT 测试 9: JOIN 测试 - t.agntcde = e.mobile
PROMPT ========================================

SELECT 
    b.serial as 单号，
    t.agntcde as 订单业务员编码，
    e.mobile as 业务员表 mobile,
    e.user_nme as 业务员姓名，
    d.dept_cde as 部门编码，
    d.dept_nme as 部门名称，
    b.created as 订单日期
FROM ferp.ord_ct t
JOIN ferp.ord_bas b ON t.serial = b.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.mobile
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
  AND ROWNUM <= 20;

-- ========================================
-- 测试 10: 完整利润统计查询（使用 user_cde）
-- ========================================
PROMPT ========================================
PROMPT 测试 10: 完整利润统计查询（2026-03-04）
PROMPT ========================================

SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    e.user_nme as 业务员，
    d.dept_nme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    CASE 
        WHEN nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 THEN 0
        ELSE (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) 
             / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    END as 利率_百分比
FROM ferp.ord_bas b
LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.user_cde
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
ORDER BY b.created;

-- ========================================
-- 测试 11: 按部门汇总统计
-- ========================================
PROMPT ========================================
PROMPT 测试 11: 按部门汇总统计（2026-03-04）
PROMPT ========================================

SELECT 
    d.dept_nme as 部门，
    COUNT(*) as 订单数，
    SUM(nvl(b.quoprc, 0) * nvl(b.accnum, 0)) as 报价总额，
    SUM(nvl(b.accamt, 0)) as 卖价总额，
    SUM(nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) as 利润差额，
    CASE 
        WHEN SUM(nvl(b.quoprc, 0) * nvl(b.accnum, 0)) = 0 THEN 0
        ELSE SUM(nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) 
             / SUM(nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    END as 平均利率_百分比
FROM ferp.ord_bas b
LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.user_cde
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
GROUP BY d.dept_nme
ORDER BY 报价总额 DESC;

-- ========================================
-- 测试 12: 测试部门筛选（假设部门编码为'S01'）
-- ========================================
PROMPT ========================================
PROMPT 测试 12: 部门筛选测试（请替换为实际部门编码）
PROMPT ========================================

-- 先查询所有部门编码
SELECT dept_cde, dept_nme 
FROM ferp.pb_dept 
WHERE isactive = 'Y'
ORDER BY dept_nme;

-- 然后用实际部门编码测试（示例）
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    e.user_nme as 业务员，
    d.dept_nme as 部门，
    nvl(b.accamt, 0) as 卖价总金额
FROM ferp.ord_bas b
LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
LEFT JOIN ferp.pb_dept_member e ON t.agntcde = e.user_cde
LEFT JOIN ferp.pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
  AND d.dept_cde IN (SELECT dept_cde FROM ferp.pb_dept WHERE dept_nme LIKE '%销售%' AND ROWNUM = 1)
ORDER BY b.created;

-- ========================================
-- 测试 13: 检查 hr_base 表（备用方案）
-- ========================================
PROMPT ========================================
PROMPT 测试 13: hr_base 表结构和数据
PROMPT ========================================

SELECT column_name, data_type, data_length
FROM all_tab_columns 
WHERE table_name = 'HR_BASE' 
  AND owner = 'FERP'
ORDER BY column_id;

SELECT mobile, empnme, dptcde, status, orgcde
FROM ferp.hr_base 
WHERE status = 'Y' 
  AND mobile IS NOT NULL
  AND ROWNUM <= 10;

-- ========================================
-- 测试 14: 使用 hr_base 表的 JOIN 方案
-- ========================================
PROMPT ========================================
PROMPT 测试 14: JOIN 测试 - 使用 hr_base 表
PROMPT ========================================

SELECT 
    b.serial as 单号，
    t.agntcde as 订单业务员编码，
    h.mobile as hr_base mobile,
    h.empnme as 业务员姓名，
    d.dept_cde as 部门编码，
    d.dept_nme as 部门名称
FROM ferp.ord_ct t
JOIN ferp.ord_bas b ON t.serial = b.serial
LEFT JOIN ferp.hr_base h ON t.agntcde = h.mobile
LEFT JOIN ferp.pb_dept d ON h.dptcde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= DATE '2026-03-04'
  AND b.created < DATE '2026-03-05'
  AND ROWNUM <= 20;

PROMPT ========================================
PROMPT 测试脚本执行完毕
PROMPT ========================================

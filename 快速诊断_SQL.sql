-- ============================================
-- 快速诊断脚本 - 确定正确的 JOIN 字段
-- ============================================
-- 用途：快速确定 ord_ct.agntcde 应该关联哪个字段
-- 执行数据库：老厂新系统 (36.138.132.30)
-- ============================================

SET PAGESIZE 50
SET LINESIZE 150
COL 匹配类型 FOR A15
COL 匹配数 FOR 99999

PROMPT ========================================
PROMPT 快速诊断：确定 agntcde 关联字段
PROMPT ========================================

-- 方法 1: 直接对比数据
SELECT 
    'user_cde 匹配' as 匹配类型，
    COUNT(*) as 匹配数
FROM ferp.ord_ct t
JOIN ferp.pb_dept_member e ON t.agntcde = e.user_cde
WHERE t.isactive = 'Y'
  AND t.created >= DATE '2026-03-04'
  AND t.created < DATE '2026-03-05'
  AND t.agntcde IS NOT NULL
UNION ALL
SELECT 
    'empcde 匹配' as 匹配类型，
    COUNT(*) as 匹配数
FROM ferp.ord_ct t
JOIN ferp.pb_dept_member e ON t.agntcde = e.empcde
WHERE t.isactive = 'Y'
  AND t.created >= DATE '2026-03-04'
  AND t.created < DATE '2026-03-05'
  AND t.agntcde IS NOT NULL
UNION ALL
SELECT 
    'mobile 匹配' as 匹配类型，
    COUNT(*) as 匹配数
FROM ferp.ord_ct t
JOIN ferp.pb_dept_member e ON t.agntcde = e.mobile
WHERE t.isactive = 'Y'
  AND t.created >= DATE '2026-03-04'
  AND t.created < DATE '2026-03-05'
  AND t.agntcde IS NOT NULL
UNION ALL
SELECT 
    'hr_base.mobile 匹配' as 匹配类型，
    COUNT(*) as 匹配数
FROM ferp.ord_ct t
JOIN ferp.hr_base h ON t.agntcde = h.mobile
WHERE t.isactive = 'Y'
  AND t.created >= DATE '2026-03-04'
  AND t.created < DATE '2026-03-05'
  AND t.agntcde IS NOT NULL
ORDER BY 匹配数 DESC;

PROMPT ========================================
PROMPT 结论：匹配数最多的字段就是正确的关联字段
PROMPT ========================================

-- 显示示例数据验证
PROMPT ========================================
PROMPT 示例数据验证（前 5 条）
PROMPT ========================================

SELECT 
    t.serial as 单号，
    t.agntcde as 订单业务员编码，
    e.user_cde,
    e.empcde,
    e.mobile,
    e.user_nme as 业务员姓名，
    CASE 
        WHEN t.agntcde = e.user_cde THEN '✓ user_cde'
        WHEN t.agntcde = e.empcde THEN '✓ empcde'
        WHEN t.agntcde = e.mobile THEN '✓ mobile'
        ELSE '✗ 无匹配'
    END as 匹配结果
FROM ferp.ord_ct t
LEFT JOIN ferp.pb_dept_member e ON t.agntcde IN (e.user_cde, e.empcde, e.mobile)
WHERE t.isactive = 'Y'
  AND t.created >= DATE '2026-03-04'
  AND t.created < DATE '2026-03-05'
  AND t.agntcde IS NOT NULL
  AND ROWNUM <= 5;

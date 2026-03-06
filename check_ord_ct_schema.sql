SET PAGESIZE 1000
SET LINESIZE 200
COLUMN column_name FORMAT A30
COLUMN data_type FORMAT A20
COLUMN data_length FORMAT A12
COLUMN nullable FORMAT A8
COLUMN comments FORMAT A50

SELECT 
    c.column_name,
    c.data_type,
    c.data_length,
    c.nullable,
    cc.comments
FROM all_tab_columns c 
LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name AND c.column_name = cc.column_name 
WHERE c.table_name = 'ORD_CT' 
ORDER BY c.column_id;

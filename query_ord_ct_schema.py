import cx_Oracle

def query_ord_ct_schema():
    # 临海服务器连接信息
    dsn = cx_Oracle.makedsn("36.137.213.189", 1521, service_name="dbms")
    connection = cx_Oracle.connect(user="read", password="ejsh.read", dsn=dsn)
    cursor = connection.cursor()

    print("=" * 100)
    print("正在查询 ord_ct 表结构 (服务器: 36.137.213.189 - 临海老系统)")
    print("=" * 100)
    print()

    # 查询表字段信息
    cursor.execute("""
        SELECT
            c.column_name,
            c.data_type,
            c.data_length,
            c.nullable,
            cc.comments
        FROM all_tab_columns c
        LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name
            AND c.column_name = cc.column_name
            AND c.owner = cc.owner
        WHERE c.owner = 'EJSH' AND c.table_name = 'ORD_CT'
        ORDER BY c.column_id
    """)

    rows = cursor.fetchall()

    print("-" * 100)
    print(f"{'序号':<5} | {'字段名':<25} | {'数据类型':<15} | {'长度':<8} | {'可空':<5} | {'中文注释':<30}")
    print("-" * 100)

    for idx, row in enumerate(rows, 1):
        col_name = row[0] or ''
        data_type = row[1] or ''
        data_length = str(row[2]) if row[2] else ''
        nullable = row[3] or ''
        comments = row[4] or ''
        print(f"{idx:<5} | {col_name:<25} | {data_type:<15} | {data_length:<8} | {nullable:<5} | {comments:<30}")

    print("-" * 100)
    print(f"总计字段数: {len(rows)}")
    print()

    #
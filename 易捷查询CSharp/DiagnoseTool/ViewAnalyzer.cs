using System;
using System.Data;
using System.Text;
using ToolGood.ReadyGo3;

namespace DiagnoseTool
{
    /// <summary>
    /// v_ord 视图分析器
    /// 用于分析视图定义，找出可能导致 ORA-01427 的原因
    /// </summary>
    class ViewAnalyzer
    {
        // 新厂新系统连接字符串
        private const string 新厂连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;";

        public static void 分析视图()
        {
            Console.WriteLine("========================================");
            Console.WriteLine("v_ord 视图分析器");
            Console.WriteLine("========================================");
            Console.WriteLine();

            try
            {
                using (var helper = SqlHelperFactory.OpenDatabase(新厂连接字符串, SqlType.Oracle))
                {
                    // 1. 获取视图定义
                    Console.WriteLine("【1. 查询 v_ord 视图定义】");
                    var viewDefSql = @"
                        SELECT view_name, text
                        FROM user_views
                        WHERE view_name = 'V_ORD'";

                    var viewDef = helper.ExecuteDataTable(viewDefSql);
                    if (viewDef.Rows.Count > 0)
                    {
                        Console.WriteLine("视图定义：");
                        Console.WriteLine(viewDef.Rows[0]["text"].ToString());
                    }
                    else
                    {
                        Console.WriteLine("未找到视图定义，尝试查询 all_views...");
                        viewDefSql = @"
                            SELECT view_name, text
                            FROM all_views
                            WHERE view_name = 'V_ORD'";
                        viewDef = helper.ExecuteDataTable(viewDefSql);
                        if (viewDef.Rows.Count > 0)
                        {
                            Console.WriteLine("视图定义：");
                            Console.WriteLine(viewDef.Rows[0]["text"].ToString());
                        }
                    }
                    Console.WriteLine();

                    // 2. 检查 v_ord 视图涉及的基础表
                    Console.WriteLine("【2. 检查 v_ord 涉及的基础表】");
                    var tableSql = @"
                        SELECT table_name
                        FROM user_tables
                        WHERE table_name IN ('ORD', 'CLNT', 'CLNT_AGNT', 'PB_EMPS')
                        ORDER BY table_name";
                    var tables = helper.ExecuteDataTable(tableSql);
                    Console.WriteLine($"找到 {tables.Rows.Count} 个相关表：");
                    foreach (DataRow row in tables.Rows)
                    {
                        Console.WriteLine($"  - {row["table_name"]}");
                    }
                    Console.WriteLine();

                    // 3. 检查客户-业务员关联表结构
                    Console.WriteLine("【3. 检查客户-业务员关联表 (clnt_agnt) 结构】");
                    try
                    {
                        var clntAgntSql = @"
                            SELECT column_name, data_type, data_length
                            FROM user_tab_columns
                            WHERE table_name = 'CLNT_AGNT'
                            ORDER BY column_id";
                        var clntAgntCols = helper.ExecuteDataTable(clntAgntSql);
                        Console.WriteLine($"表结构 ({clntAgntCols.Rows.Count} 个字段)：");
                        foreach (DataRow row in clntAgntCols.Rows)
                        {
                            Console.WriteLine($"  - {row["column_name"]} ({row["data_type"]}({row["data_length"]}))");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"查询失败: {ex.Message}");
                    }
                    Console.WriteLine();

                    // 4. 检查是否存在一个客户对应多个业务员的情况
                    Console.WriteLine("【4. 检查客户-业务员一对多关系】");
                    try
                    {
                        var duplicateSql = @"
                            SELECT clntcde, COUNT(DISTINCT agntcde) as agnt_count
                            FROM clnt_agnt
                            GROUP BY clntcde
                            HAVING COUNT(DISTINCT agntcde) > 1
                            ORDER BY agnt_count DESC
                            FETCH FIRST 10 ROWS ONLY";
                        var duplicates = helper.ExecuteDataTable(duplicateSql);
                        if (duplicates.Rows.Count > 0)
                        {
                            Console.WriteLine($"⚠ 发现 {duplicates.Rows.Count} 个客户关联多个业务员（显示前10个）：");
                            foreach (DataRow row in duplicates.Rows)
                            {
                                Console.WriteLine($"  - 客户: {row["clntcde"]}, 业务员数: {row["agnt_count"]}");
                            }
                        }
                        else
                        {
                            Console.WriteLine("✓ 未发现客户关联多个业务员的情况");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"查询失败: {ex.Message}");
                    }
                    Console.WriteLine();

                    // 5. 测试直接查询 ord 表
                    Console.WriteLine("【5. 测试直接查询 ord 表（绕过 v_ord 视图）】");
                    测试直接查询Ord表(helper);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"分析失败: {ex.Message}");
            }

            Console.WriteLine();
            Console.WriteLine("分析完成！");
        }

        static void 测试直接查询Ord表(SqlHelper helper)
        {
            try
            {
                // 测试日期范围
                DateTime 开始日期 = new DateTime(2026, 3, 5);
                DateTime 结束日期 = new DateTime(2026, 3, 6);

                // 业务员编码列表
                var 业务员编码列表 = new[]
                {
                    "18815220168", "17671388396", "13655860812", "13858649687",
                    "13136577871", "13736588897", "13588966388", "15057269070",
                    "19129461754", "17857063395", "H109", "A7008", "A7002",
                    "A1110", "18313050088"
                };

                var 编码字符串 = string.Join("','", 业务员编码列表);

                // 尝试直接查询 ord 表，不使用 v_ord 视图
                var sql = $@"
                    SELECT o.objtyp, o.agntcde, 
                           NVL(SUM(o.accamt), 0) as 金额,
                           NVL(SUM(o.acreage * o.accnum), 0) as 面积,
                           COUNT(*) as 单数
                    FROM ord o
                    WHERE o.status = 'Y'
                      AND o.ptdate >= TO_DATE('{开始日期:yyyy-MM-dd}', 'yyyy-MM-dd')
                      AND o.ptdate < TO_DATE('{结束日期.AddDays(1):yyyy-MM-dd}', 'yyyy-MM-dd')
                      AND o.agntcde IN ('{编码字符串}')
                    GROUP BY o.agntcde, o.objtyp
                    ORDER BY o.agntcde";

                var dt = helper.ExecuteDataTable(sql);
                Console.WriteLine($"✓ 直接查询 ord 表成功 (返回 {dt.Rows.Count} 行)");

                // 如果 ord 表查询成功，但 v_ord 失败，说明问题在视图定义中
                Console.WriteLine();
                Console.WriteLine("【结论】");
                Console.WriteLine("直接查询 ord 表成功，说明问题出在 v_ord 视图的定义中。");
                Console.WriteLine("v_ord 视图可能包含子查询，当关联客户表或业务员表时返回多行。");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"✗ 直接查询 ord 表失败: {ex.Message}");
            }
        }
    }
}

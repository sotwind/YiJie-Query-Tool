using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using ToolGood.ReadyGo3;

namespace 易捷查询CSharp
{
    /// <summary>
    /// ORA-01427 错误诊断工具
    /// 用于定位导致"单行子查询返回多个行"错误的具体业务员编码
    /// </summary>
    class DiagnoseORA01427
    {
        // 新厂新系统连接字符串（根据报错信息判断是新厂系统）
        private const string 新厂连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;";

        public static void 运行诊断()
        {
            Console.WriteLine("========================================");
            Console.WriteLine("ORA-01427 错误诊断工具");
            Console.WriteLine("========================================");
            Console.WriteLine();

            // 从报错信息中提取的业务员编码列表
            var 业务员编码列表 = new List<string>
            {
                "18815220168", "18815220168", "17671388396", "17671388396",
                "13655860812", "13655860812", "13858649687", "13858649687",
                "13136577871", "13136577871", "13736588897", "13736588897",
                "13588966388", "13588966388", "15057269070", "15057269070",
                "19129461754", "19129461754", "17857063395", "17857063395",
                "H109", "A7008", "A7002", "A1110", "18313050088"
            };

            // 去重
            业务员编码列表 = 业务员编码列表.Distinct().ToList();

            Console.WriteLine($"待测试的业务员编码数量: {业务员编码列表.Count}");
            Console.WriteLine();

            // 测试日期范围（根据报错信息）
            DateTime 开始日期 = new DateTime(2026, 3, 5);
            DateTime 结束日期 = new DateTime(2026, 3, 6);

            var 问题编码列表 = new List<string>();
            var 正常编码列表 = new List<string>();
            var 异常信息列表 = new List<string>();

            // 逐个测试每个业务员编码
            for (int i = 0; i < 业务员编码列表.Count; i++)
            {
                var 编码 = 业务员编码列表[i];
                Console.Write($"[{i + 1}/{业务员编码列表.Count}] 测试业务员编码: {编码} ... ");

                try
                {
                    var sql = $@"
                        select objtyp, agntcde, nvl(sum(accamt),0) as 金额,
                               nvl(sum(acreage*accnum),0) as 面积, count(*) as 单数 
                        from v_ord 
                        where status='Y'
                          and ptdate >= to_date('{开始日期:yyyy-MM-dd}', 'yyyy-MM-dd')
                          and ptdate < to_date('{结束日期.AddDays(1):yyyy-MM-dd}', 'yyyy-MM-dd')
                          and agntcde = '{编码}'
                        group by agntcde, objtyp 
                        order by agntcde";

                    using (var helper = SqlHelperFactory.OpenDatabase(新厂连接字符串, SqlType.Oracle))
                    {
                        var dt = helper.ExecuteDataTable(sql);
                        Console.WriteLine($"✓ 正常 (返回 {dt.Rows.Count} 行)");
                        正常编码列表.Add(编码);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"✗ 错误: {ex.Message}");
                    问题编码列表.Add(编码);
                    异常信息列表.Add($"编码: {编码}, 错误: {ex.Message}");
                }
            }

            Console.WriteLine();
            Console.WriteLine("========================================");
            Console.WriteLine("诊断结果汇总");
            Console.WriteLine("========================================");
            Console.WriteLine();
            Console.WriteLine($"正常编码数量: {正常编码列表.Count}");
            Console.WriteLine($"问题编码数量: {问题编码列表.Count}");
            Console.WriteLine();

            if (问题编码列表.Count > 0)
            {
                Console.WriteLine("【导致错误的业务员编码】");
                foreach (var 编码 in 问题编码列表)
                {
                    Console.WriteLine($"  - {编码}");
                }
                Console.WriteLine();

                // 进一步诊断：查询这些业务员对应的订单和客户信息
                Console.WriteLine("========================================");
                Console.WriteLine("进一步诊断：查询问题业务员的客户关联");
                Console.WriteLine("========================================");
                Console.WriteLine();

                foreach (var 编码 in 问题编码列表)
                {
                    诊断客户关联(编码, 开始日期, 结束日期);
                }
            }
            else
            {
                Console.WriteLine("未发现问题编码，可能是多个编码组合查询时才会触发错误。");
                Console.WriteLine();
                Console.WriteLine("测试完整IN列表查询...");
                测试完整查询(业务员编码列表, 开始日期, 结束日期);
            }

            // 保存诊断报告
            保存诊断报告(正常编码列表, 问题编码列表, 异常信息列表);

            Console.WriteLine();
            Console.WriteLine("诊断完成！");
        }

        /// <summary>
        /// 诊断客户关联情况
        /// </summary>
        static void 诊断客户关联(string 业务员编码, DateTime 开始日期, DateTime 结束日期)
        {
            Console.WriteLine($"--- 业务员编码: {业务员编码} ---");

            try
            {
                // 查询该业务员对应的订单和客户
                var sql = $@"
                    SELECT o.ordcde, o.clntcde, o.agntcde, c.clntnme
                    FROM ord o
                    LEFT JOIN clnt c ON o.clntcde = c.clntcde
                    WHERE o.status = 'Y'
                      AND o.ptdate >= to_date('{开始日期:yyyy-MM-dd}', 'yyyy-MM-dd')
                      AND o.ptdate < to_date('{结束日期.AddDays(1):yyyy-MM-dd}', 'yyyy-MM-dd')
                      AND o.agntcde = '{业务员编码}'
                    ORDER BY o.clntcde";

                using (var helper = SqlHelperFactory.OpenDatabase(新厂连接字符串, SqlType.Oracle))
                {
                    var dt = helper.ExecuteDataTable(sql);
                    Console.WriteLine($"  订单数量: {dt.Rows.Count}");

                    if (dt.Rows.Count > 0)
                    {
                        // 统计每个客户的订单数
                        var 客户订单统计 = new Dictionary<string, int>();
                        var 客户名称映射 = new Dictionary<string, string>();

                        foreach (DataRow row in dt.Rows)
                        {
                            var 客户编码 = row["clntcde"].ToString();
                            var 客户名称 = row["clntnme"].ToString();

                            if (!客户订单统计.ContainsKey(客户编码))
                            {
                                客户订单统计[客户编码] = 0;
                                客户名称映射[客户编码] = 客户名称;
                            }
                            客户订单统计[客户编码]++;
                        }

                        Console.WriteLine($"  涉及客户数量: {客户订单统计.Count}");
                        Console.WriteLine("  客户列表:");
                        foreach (var kvp in 客户订单统计)
                        {
                            Console.WriteLine($"    - 客户编码: {kvp.Key}, 客户名称: {客户名称映射[kvp.Key]}, 订单数: {kvp.Value}");
                        }

                        // 检查客户与业务员的关联是否存在一对多
                        foreach (var 客户编码 in 客户订单统计.Keys)
                        {
                            检查客户业务员关联(客户编码);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  查询失败: {ex.Message}");
            }

            Console.WriteLine();
        }

        /// <summary>
        /// 检查客户与业务员的关联关系
        /// </summary>
        static void 检查客户业务员关联(string 客户编码)
        {
            try
            {
                // 查询客户的业务员关联（这里假设有关联表，可能需要根据实际表名调整）
                var sql = $@"
                    SELECT clntcde, agntcde, COUNT(*) as cnt
                    FROM clnt_agnt  -- 假设的关联表，需要根据实际情况调整
                    WHERE clntcde = '{客户编码}'
                    GROUP BY clntcde, agntcde";

                using (var helper = SqlHelperFactory.OpenDatabase(新厂连接字符串, SqlType.Oracle))
                {
                    var dt = helper.ExecuteDataTable(sql);

                    if (dt.Rows.Count > 1)
                    {
                        Console.WriteLine($"    ⚠ 警告: 客户 {客户编码} 关联了 {dt.Rows.Count} 个业务员！");
                        foreach (DataRow row in dt.Rows)
                        {
                            Console.WriteLine($"      - 业务员: {row["agntcde"]}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // 可能是表名不正确，忽略错误
                Console.WriteLine($"    检查客户业务员关联时出错（可能是表名不正确）: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试完整的IN列表查询
        /// </summary>
        static void 测试完整查询(List<string> 业务员编码列表, DateTime 开始日期, DateTime 结束日期)
        {
            var 编码字符串 = string.Join("','", 业务员编码列表);
            var sql = $@"
                select objtyp, agntcde, nvl(sum(accamt),0) as 金额,
                       nvl(sum(acreage*accnum),0) as 面积, count(*) as 单数 
                from v_ord 
                where status='Y'
                  and ptdate >= to_date('{开始日期:yyyy-MM-dd}', 'yyyy-MM-dd')
                  and ptdate < to_date('{结束日期.AddDays(1):yyyy-MM-dd}', 'yyyy-MM-dd')
                  and agntcde in ('{编码字符串}')
                group by agntcde, objtyp 
                order by agntcde";

            try
            {
                using (var helper = SqlHelperFactory.OpenDatabase(新厂连接字符串, SqlType.Oracle))
                {
                    var dt = helper.ExecuteDataTable(sql);
                    Console.WriteLine($"✓ 完整查询正常 (返回 {dt.Rows.Count} 行)");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"✗ 完整查询错误: {ex.Message}");
            }
        }

        /// <summary>
        /// 保存诊断报告到文件
        /// </summary>
        static void 保存诊断报告(List<string> 正常编码列表, List<string> 问题编码列表, List<string> 异常信息列表)
        {
            var 报告路径 = $"诊断报告_{DateTime.Now:yyyyMMdd_HHmmss}.txt";
            var sb = new StringBuilder();

            sb.AppendLine("========================================");
            sb.AppendLine("ORA-01427 错误诊断报告");
            sb.AppendLine($"生成时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine("========================================");
            sb.AppendLine();
            sb.AppendLine($"正常编码数量: {正常编码列表.Count}");
            sb.AppendLine($"问题编码数量: {问题编码列表.Count}");
            sb.AppendLine();

            if (问题编码列表.Count > 0)
            {
                sb.AppendLine("【导致错误的业务员编码】");
                foreach (var 编码 in 问题编码列表)
                {
                    sb.AppendLine($"  - {编码}");
                }
                sb.AppendLine();

                sb.AppendLine("【详细错误信息】");
                foreach (var 信息 in 异常信息列表)
                {
                    sb.AppendLine($"  {信息}");
                }
            }
            else
            {
                sb.AppendLine("未发现问题编码");
            }

            sb.AppendLine();
            sb.AppendLine("【正常编码列表】");
            foreach (var 编码 in 正常编码列表)
            {
                sb.AppendLine($"  - {编码}");
            }

            File.WriteAllText(报告路径, sb.ToString());
            Console.WriteLine();
            Console.WriteLine($"诊断报告已保存到: {报告路径}");
        }
    }
}

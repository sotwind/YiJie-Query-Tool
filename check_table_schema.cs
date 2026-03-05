using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Com.Ekyb.CrossFactoryOrder.Common;
using ToolGood.ReadyGo3;

namespace CheckTableSchema
{
    class Program
    {
        static void Main(string[] args)
        {
            // 易捷集团数据库连接字符串
            string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

            try
            {
                using (var helper = SqlHelperFactory.OpenDatabase(connString, SqlType.Oracle))
                {
                    Console.WriteLine("连接成功！\n");

                    // 检查 pb_dept_member 表的字段
                    string sqlColumns = @"
                        SELECT column_name, data_type, data_length, data_precision, nullable
                        FROM user_tab_columns 
                        WHERE table_name = 'PB_DEPT_MEMBER'
                        ORDER BY column_id";

                    var columns = helper.ExecuteDataTable(sqlColumns);
                    Console.WriteLine("PB_DEPT_MEMBER 表结构：");
                    Console.WriteLine("序号\t字段名\t\t\t类型\t\t长度\t精度\t可空");
                    Console.WriteLine("----------------------------------------------------------");
                    for (int i = 0; i < columns.Rows.Count; i++)
                    {
                        var row = columns.Rows[i];
                        string colName = row["COLUMN_NAME"].ToString();
                        string dataType = row["DATA_TYPE"].ToString();
                        int dataLength = int.Parse(row["DATA_LENGTH"].ToString());
                        object precisionObj = row["DATA_PRECISION"];
                        string precision = precisionObj == null || precisionObj == DBNull.Value ? "" : precisionObj.ToString();
                        string nullable = row["NULLABLE"].ToString();

                        Console.WriteLine($"{i + 1}\t{colName,-24}\t{dataType,-15}\t{dataLength}\t{precision}\t{nullable}");
                    }

                    // 尝试不同的字段名查询
                    Console.WriteLine("\n\n尝试不同的字段名查询：");
                    string[] fieldCombinations = {
                        "user_cde, user_nme",
                        "user_code, user_name",
                        "empcde, empnme",
                        "emp_code, emp_name"
                    };

                    foreach (var fields in fieldCombinations)
                    {
                        try
                        {
                            string sqlTest = $"SELECT {fields} FROM pb_dept_member WHERE ROWNUM <= 3";
                            var result = helper.Select<dynamic>(sqlTest);
                            if (result != null && result.Count() > 0)
                            {
                                Console.WriteLine($"✓ {fields} 查询成功");
                                foreach (var row in result)
                                {
                                    Console.WriteLine($"  {row}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"✗ {fields} 错误: {ex.Message}");
                        }
                    }

                    // 测试原SQL
                    Console.WriteLine("\n\n测试原SQL：");
                    string originalSql = @"SELECT user_cde as EMPCDE, dept_cde as TEMCDE, dept_cde as TEMCDE2, user_nme as EMPNME, '销售' as TEMNME
                                    FROM pb_dept_member
                                    WHERE is_active = 'Y'
                                    ORDER BY user_nme";
                    try
                    {
                        var result = helper.Select<dynamic>(originalSql);
                        Console.WriteLine($"✓ 原SQL查询成功，返回 {result.Count()} 条记录");
                        foreach (var row in result.Take(5))
                        {
                            Console.WriteLine($"  {row}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"✗ 原SQL错误: {ex.Message}");
                    }

                    // 尝试无字段名查询
                    Console.WriteLine("\n\n尝试无字段名查询：");
                    try
                    {
                        string sqlAll = "SELECT * FROM pb_dept_member WHERE ROWNUM <= 3";
                        var result = helper.Select<dynamic>(sqlAll);
                        Console.WriteLine($"✓ SELECT * 查询成功");
                        foreach (var row in result)
                        {
                            Console.WriteLine($"  {row}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"✗ SELECT * 错误: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"连接错误: {ex.Message}");
            }

            Console.WriteLine("\n按任意键退出...");
            Console.ReadKey();
        }
    }
}

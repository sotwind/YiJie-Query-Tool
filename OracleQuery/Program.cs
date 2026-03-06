using System;
using System.Data;
using Oracle.ManagedDataAccess.Client;

namespace OracleQuery
{
    class Program
    {
        static void Main(string[] args)
        {
            // 新厂新系统
            string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.134.7.141)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=b0003;Password=kuke.b0003";

            Console.WriteLine("========================================================================================================================");
            Console.WriteLine("查询新厂新系统 ord_bas 和 ord_ct 表的数量字段");
            Console.WriteLine("========================================================================================================================");

            try
            {
                using (OracleConnection conn = new OracleConnection(connString))
                {
                    conn.Open();
                    Console.WriteLine("✓ 连接成功\n");

                    using (OracleCommand cmd = new OracleCommand())
                    {
                        cmd.Connection = conn;
                        
                        // 查询 ord_bas 表的数量字段
                        Console.WriteLine("ORD_BAS 表的数量相关字段：");
                        cmd.CommandText = @"
                            SELECT column_name, data_type
                            FROM all_tab_columns
                            WHERE table_name = 'ORD_BAS'
                              AND (column_name LIKE '%NUM%' 
                                   OR column_name LIKE '%QTY%'
                                   OR column_name LIKE '%COUNT%')
                            ORDER BY column_name
                        ";
                        
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Console.WriteLine($"  {reader.GetString(0),-20} {reader.GetString(1)}");
                            }
                        }

                        // 查询 ord_ct 表的数量字段
                        Console.WriteLine("\nORD_CT 表的数量相关字段：");
                        cmd.CommandText = @"
                            SELECT column_name, data_type
                            FROM all_tab_columns
                            WHERE table_name = 'ORD_CT'
                              AND (column_name LIKE '%NUM%' 
                                   OR column_name LIKE '%QTY%'
                                   OR column_name LIKE '%COUNT%')
                            ORDER BY column_name
                        ";
                        
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Console.WriteLine($"  {reader.GetString(0),-20} {reader.GetString(1)}");
                            }
                        }

                        // 查询示例数据
                        Console.WriteLine("\n示例数据（ord_bas + ord_ct）：");
                        cmd.CommandText = @"
                            SELECT b.SERIAL, b.PRICES, b.QUOPRC, t.ACCNUM
                            FROM ORD_BAS b
                            LEFT JOIN ORD_CT t ON b.CLIENTID = t.CLIENTID AND b.ORGCDE = t.ORGCDE AND b.SERIAL = t.SERIAL
                            WHERE ROWNUM <= 5
                              AND b.ISACTIVE = 'Y'
                        ";
                        
                        using (var reader = cmd.ExecuteReader())
                        {
                            Console.WriteLine($"{"单号",-15} {"PRICES",10} {"QUOPRC",10} {"ACCNUM",10}");
                            Console.WriteLine(new string('-', 50));
                            while (reader.Read())
                            {
                                string serial = reader.IsDBNull(0) ? "" : reader.GetString(0);
                                decimal prices = reader.IsDBNull(1) ? 0 : reader.GetDecimal(1);
                                decimal quoprc = reader.IsDBNull(2) ? 0 : reader.GetDecimal(2);
                                decimal accnum = reader.IsDBNull(3) ? 0 : reader.GetDecimal(3);
                                
                                Console.WriteLine($"{serial,-15} {prices,10:0.00} {quoprc,10:0.00} {accnum,10:0.00}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 错误：{ex.Message}");
            }

            Console.WriteLine("\n========================================================================================================================");
            Console.WriteLine("查询完成！");
            Console.WriteLine("========================================================================================================================");
            Console.WriteLine("\n按任意键退出...");
            Console.ReadKey();
        }
    }
}

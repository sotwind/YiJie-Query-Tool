﻿﻿﻿﻿﻿using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ToolGood.ReadyGo3;
using System.ComponentModel;

namespace 易捷查询CSharp
{
    internal class 模块_通用函数
    {
        private const String Ora连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;";

        public static void 初始化日期从(DateTimePicker 时间器)
        {
            时间器.Value = DateTime.Today;
        }
        public static void 初始化日期到(DateTimePicker 时间器)
        {
            时间器.Value = DateTime.Today.AddDays(1).AddMilliseconds(-1);
        }

        private static DataTable 私有_部门表;
        private static DataTable 私有_业务员表;
        private static DataTable 私有_跟单员表;

        public static DataTable 易捷部门表()
        {
            try {
                if (私有_部门表 == null) {
                    var all = get业务员表();
                    Dictionary<string, dptTemp> dict = new Dictionary<string, dptTemp>();
                    foreach (var item in all) {
                        dptTemp dptTemp;
                        if (dict.TryGetValue(item.TEMNME, out dptTemp)) {
                            if (dptTemp.TEMCDE == null) {
                                dptTemp.TEMCDE = item.TEMCDE;
                            }
                            if (dptTemp.TEMCDE2 == null) {
                                dptTemp.TEMCDE2 = item.TEMCDE2;
                            }
                        } else {
                            dict[item.TEMNME] = new dptTemp() {
                                TEMCDE = item.TEMCDE,
                                TEMCDE2 = item.TEMCDE2,
                                TEMNME = item.TEMNME,
                            };
                        }
                    }
                    var list = dict.Select(q => q.Value).OrderBy(q => q.TEMNME).ToList();
                    私有_部门表 = ConvertToDatatable(list);

                    //var 业务员表 = 易捷业务员表();
                    //if (业务员表 != null) {
                    //    var Dv = new DataView(业务员表);
                    //    var cols = new string[] { "TEMCDE", "TEMCDE2", "TEMNME" };
                    //    私有_部门表 = Dv.ToTable(true, cols);
                    //}
                }
                return 私有_部门表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }

        public class dptTemp
        {
            public string TEMCDE { get; set; }
            public string TEMCDE2 { get; set; }
            public string TEMNME { get; set; }
        }
        public class empTemp
        {
            public string EMPCDE { get; set; }
            public string EMPCDE2 { get; set; }
            public string TEMCDE { get; set; }
            public string TEMCDE2 { get; set; }
            public string EMPNME { get; set; }
            public string TEMNME { get; set; }
        }


        public static DataTable 易捷业务员表()
        {
            try {
                if (私有_业务员表 == null) {
                    var all = get业务员表();
                    私有_业务员表 = ConvertToDatatable(all);
                }
                return 私有_业务员表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }
        private static List<empTemp> 业务员表;
        private static List<empTemp> get业务员表()
        {
            if (业务员表 == null) {
                Dictionary<string, empTemp> dict = new Dictionary<string, empTemp>();
                foreach (var db in DatabaseInfos.GetDatabaseInfos()) {
                    using (var helper = SqlHelperFactory.OpenDatabase(db.GetConnString(), SqlType.Oracle)) {
                        var sql = "select EMPCDE, TEMCDE, EMPNME, TEMNME from pb_emps where objtyp ='AG' order by TEMNME";
                        if (db.ServerType == "新系统") {
                            sql = @"SELECT h.MOBILE EMPCDE2,h.EMPNME EMPNME, d.dptcde TEMCDE2,d.dptNme TEMNME  from HR_BASE h, PB_DEPT d 
where d.dptcde = h.dptcde and h.ORGCDE=d.ORGCDE
and( h.MOBILE in(SELECT MOBILE from sys_user s where s.istype = 'AG' and s.STATUS='Y')
	or d.dptNme LIKE '%销售%'
	or d.dptNme LIKE '%事业部%'
)
and h.STATUS='Y' and h.MOBILE is not null
ORDER BY dptNme
";
                        }
                        var ts = helper.Select<empTemp>(sql);
                        foreach (var t in ts) {

                            if (t.TEMNME == null)
                                continue;
                            t.TEMNME = t.TEMNME.Replace("老厂销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("新厂销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("临海销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("温森一期销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("温森二期销售", "销售");
                            if (t.EMPNME == "陈海龙")
                            {
                                // 当员工名字为"陈海龙"时，打印当前数据库的factoryName和servername
                                // System.Diagnostics.Debug.WriteLine($"Employee Name: {t.EMPNME}, Department: {t.TEMNME}, DatabaseInfo: FactoryName={db.FactoryName}, ServerName={db.ServerName}");
                            }
                            empTemp temp;
                            if (dict.TryGetValue(t.TEMNME + "-" + t.EMPNME, out temp)) {
                                if (temp.EMPCDE2 == null || temp.EMPCDE2 == "") {
                                    temp.EMPCDE2 = t.EMPCDE2;
                                }
                                if (temp.EMPCDE == null || temp.EMPCDE == "") {
                                    temp.EMPCDE = t.EMPCDE;
                                }
                                if (temp.TEMCDE2 == null || temp.TEMCDE2 == "") {
                                    temp.TEMCDE2 = t.TEMCDE2;
                                }
                            } else {
                                dict[t.TEMNME + "-" + t.EMPNME] = t;
                            }
                        }
                    }
                }
                业务员表 = dict.Select(q => q.Value).OrderBy(q => q.TEMNME).ToList();
            }
            return 业务员表;
        }



        public static DataTable 易捷跟单员表()
        {
            try {
                if (私有_跟单员表 == null) {
                    私有_跟单员表 = Ora数据表请求("select EMPCDE, TEMCDE, EMPNME, TEMNME from pb_emps where objtyp ='AS' order by TEMNME");
                }
                return 私有_跟单员表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }
        public static DataTable Ora数据表请求(string sql)
        {
            try {
                using (var helper = SqlHelperFactory.OpenDatabase(Ora连接字符串, SqlType.Oracle)) {
                    return helper.ExecuteDataTable(sql);
                }

            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }

        public static DataTable ConvertToDatatable<T>(List<T> data)
        {
            PropertyDescriptorCollection properties = TypeDescriptor.GetProperties(typeof(T));
            DataTable dataTable = new DataTable();
            for (int i = 0; i < properties.Count; i++) {
                PropertyDescriptor propertyDescriptor = properties[i];
                if (propertyDescriptor.PropertyType.IsGenericType && propertyDescriptor.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>)) {
                    dataTable.Columns.Add(propertyDescriptor.Name, propertyDescriptor.PropertyType.GetGenericArguments()[0]);
                } else {
                    dataTable.Columns.Add(propertyDescriptor.Name, propertyDescriptor.PropertyType);
                }
            }
            object[] array = new object[properties.Count];
            foreach (T t in data) {
                for (int i = 0; i < array.Length; i++) {
                    array[i] = properties[i].GetValue(t);
                }
                dataTable.Rows.Add(array);
            }
            return dataTable;
        }

        public static void 查询箱型表()
        {
            string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp";
            try {
                using (var helper = SqlHelperFactory.OpenDatabase(connString, SqlType.Oracle)) {
                    var allTables = helper.Select<dynamic>("SELECT table_name FROM user_tables ORDER BY table_name");
                    System.Text.StringBuilder sb = new System.Text.StringBuilder();
                    sb.AppendLine("所有表名：");
                    foreach (var table in allTables) {
                        sb.AppendLine(table.TABLE_NAME);
                    }
                    
                    sb.AppendLine("\n\n可能包含箱型信息的表：");
                    foreach (var table in allTables) {
                        string tableName = table.TABLE_NAME.ToUpper();
                        if (tableName.Contains("BOX") || tableName.Contains("CARTON") || 
                            tableName.Contains("PACK") || tableName.Contains("TYPE") ||
                            tableName.Contains("FORMULA") || tableName.Contains("规格") ||
                            tableName.Contains("箱")) {
                            sb.AppendLine($"  {tableName}");
                        }
                    }
                    
                    sb.AppendLine("\n\n搜索包含BOX或CARTON的表及其列结构：");
                    var boxTables = helper.Select<dynamic>("SELECT table_name FROM user_tables WHERE UPPER(table_name) LIKE '%BOX%' OR UPPER(table_name) LIKE '%CARTON%' ORDER BY table_name");
                    foreach (var table in boxTables) {
                        string tableName = table.TABLE_NAME;
                        sb.AppendLine($"\n找到表: {tableName}");
                        var columns = helper.Select<dynamic>($"SELECT column_name, data_type FROM user_tab_columns WHERE table_name = '{tableName}' ORDER BY column_id");
                        sb.AppendLine("  列结构：");
                        foreach (var col in columns) {
                            sb.AppendLine($"    {col.COLUMN_NAME} - {col.DATA_TYPE}");
                        }
                    }
                    
                    string filePath = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location), "箱型表查询结果.txt");
                    System.IO.File.WriteAllText(filePath, sb.ToString());
                    MessageBox.Show($"查询结果已保存到: {filePath}", "箱型表查询结果");
                }
            } catch (Exception ex) {
                MessageBox.Show($"错误: {ex.Message}", "查询失败");
            }
        }


    }
}

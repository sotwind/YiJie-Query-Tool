using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ToolGood.ReadyGo3;

namespace 易捷查询CSharp
{
    public partial class 窗体_利润统计 : Form
    {
        public 窗体_利润统计()
        {
            InitializeComponent();
        }

        private void 窗体_利润统计_Load(object sender, EventArgs e)
        {
            模块_通用函数.初始化日期从 (日期_从);
            模块_通用函数.初始化日期到 (日期_到);

            try
            {
                列表_部门.DataSource = 模块_通用函数.易捷部门表 ();
                列表_部门.DisplayMember = "TEMNME";
                列表_部门.ValueMember = "TEMCDE";

                列表_业务员.DataSource = 模块_通用函数.易捷业务员表 ();
                列表_业务员.DisplayMember = "EMPNME";
                列表_业务员.ValueMember = "EMPCDE";

                数值_利率从.Value = -100000;
                数值_利率到.Value = 100000;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void 按钮_查询_Click(object sender, EventArgs e)
        {
            try
            {
                列表_查询结果.Items.Clear();

                List<利润统计数据> profitDataList = new List<利润统计数据>();

                foreach (var db in DatabaseInfos.GetDatabaseInfos())
                {
                    try
                    {
                        // 根据服务器类型和工厂名称生成不同的SQL
                        string sql = BuildQueryString(db.ServerType, db.FactoryName);

                        using (var helper = SqlHelperFactory.OpenDatabase(db.GetConnString(), SqlType.Oracle))
                        {
                            var list = helper.Select<利润统计数据>(sql);
                            profitDataList.AddRange(list);
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show(db.FactoryName + " 连接出错了：" + ex.Message);
                    }
                }

                显示结果 (profitDataList);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private string BuildQueryString(string serverType, string factoryName)
        {
            string sql;

            // 新厂：使用新的基础表查询方式（绕过 V_ORD 视图，避免 ORA-01427）
            if (factoryName == "新厂新系统")
            {
                // 新系统：绕过 V_ORD 视图，直接查询基础表
                // 避免 V_ORD 视图中子查询返回多行导致 ORA-01427 错误
                // 业务员编码从 pb_clnt.agntcde 获取
                // 业务逻辑：
                // 1. 排除未审核数据（STATUS != 'Y'）
                // 2. 排除 Z 开头单号且业务员为李仰忠的数据
                // 3. 森林包装集团股份有限公司 + 李仰忠 的业务员转换为莫梦辉
                sql = $@"
SELECT 
    TO_CHAR(b.PTDATE, 'yyyy-MM-dd') as 日期,
    b.SERIAL as 单号,
    c.CLNTNME as 客户,
    b.PRDNME as 产品,
    CASE 
        WHEN c.CLNTNME = '森林包装集团股份有限公司' AND c.AGNTCDE = '13655860812' 
        THEN '13586269539' 
        ELSE c.AGNTCDE 
    END as 业务员编码,
    NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) as 报价总金额,
    NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) as 卖价总金额,
    NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) as 毛利,
    CASE 
        WHEN NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0) = 0 THEN NULL
        ELSE ROUND((NVL(b.PRICES, 0) * NVL(b.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0)) / (NVL(b.QUOPRC, 0) * NVL(b.ACCNUM, 0)) * 100, 2)
    END as 利率
FROM ORD_CT t
JOIN ORD_BAS b ON t.CLIENTID = b.CLIENTID AND t.ORGCDE = b.ORGCDE AND t.SERIAL = b.SERIAL
LEFT JOIN PB_CLNT c ON b.CLIENTID = c.CLIENTID AND b.ORGCDE = c.ORGCDE AND b.CLNTCDE = c.CLNTCDE
WHERE t.ISACTIVE = 'Y'
  AND b.STATUS = 'Y'
  AND NOT (b.SERIAL LIKE 'Z%' AND c.AGNTCDE = '13655860812')
  AND b.SERIAL NOT LIKE '%.%'
  AND b.PTDATE >= to_date('{日期_从.Value.Date.ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')
  AND b.PTDATE < to_date('{日期_从.Value.Date.AddDays(1).ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')";

                // 业务员筛选
                if (列表_业务员.CheckedItems.Count > 0)
                {
                    string tmpstr = "";
                    foreach (DataRowView rowview in 列表_业务员.CheckedItems)
                    {
                        string 业务员编码 = rowview["EMPCDE"].ToString();
                        if (业务员编码 != "" && 业务员编码 != null)
                        {
                            if (tmpstr != "") tmpstr += ",";
                            tmpstr += "'" + 业务员编码 + "'";
                        }
                    }

                    if (tmpstr != "")
                    {
                        // 注意：业务员筛选需要考虑转换后的业务员编码
                        // 森林包装 + 李仰忠 转换为 莫梦辉 的编码
                        sql += " AND CASE WHEN c.CLNTNME = '森林包装集团股份有限公司' AND c.AGNTCDE = '13655860812' THEN '13586269539' ELSE c.AGNTCDE END IN (" + tmpstr + ")";
                    }
                }

                // 通用筛选条件
                if (文本_客户.Text.Trim() != "")
                {
                    sql += " AND c.CLNTNME LIKE '%" + 文本_客户.Text.Trim() + "%'";
                }

                if (文本_单号.Text.Trim() != "")
                {
                    sql += " AND b.SERIAL LIKE '%" + 文本_单号.Text.Trim() + "%'";
                }

                if (文本_产品.Text.Trim() != "")
                {
                    sql += " AND b.PRDNME LIKE '%" + 文本_产品.Text.Trim() + "%'";
                }

                sql += " ORDER BY b.PTDATE DESC";
            }
            // 老厂和温森：使用 V_ORD 视图查询方式
            else if (factoryName == "老厂新系统" || factoryName == "温森新系统")
            {
                // 老厂和温森：使用 V_ORD 视图 LEFT JOIN ORD_BAS 表获取报价单价
                // V_ORD 提供客户、产品、日期、数量、卖价等信息
                // ORD_BAS 提供报价单价 QUOPRC
                // 业务逻辑：
                // 1. 排除未审核数据（STATUS = 'Y'）
                // 2. 排除 Z 开头单号且业务员为李仰忠的数据
                // 3. 森林包装集团股份有限公司 + 李仰忠 的业务员转换为莫梦辉
                sql = $@"
SELECT 
    TO_CHAR(v.PTDATE, 'yyyy-MM-dd') as 日期,
    v.SERIAL as 单号,
    v.CLNTNME as 客户,
    v.PRDNME as 产品,
    CASE 
        WHEN v.CLNTNME = '森林包装集团股份有限公司' AND v.AGNTCDE = '13655860812' 
        THEN '13586269539' 
        ELSE v.AGNTCDE 
    END as 业务员编码,
    NVL(b.QUOPRC, 0) * NVL(v.ACCNUM, 0) as 报价总金额,
    NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) as 卖价总金额,
    NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(v.ACCNUM, 0) as 毛利,
    CASE 
        WHEN NVL(b.QUOPRC, 0) * NVL(v.ACCNUM, 0) = 0 THEN NULL
        ELSE ROUND((NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) - NVL(b.QUOPRC, 0) * NVL(v.ACCNUM, 0)) / (NVL(b.QUOPRC, 0) * NVL(v.ACCNUM, 0)) * 100, 2)
    END as 利率
FROM V_ORD v
LEFT JOIN ORD_BAS b ON v.SERIAL = b.SERIAL AND v.CLIENTID = b.CLIENTID AND v.ORGCDE = b.ORGCDE
WHERE v.STATUS = 'Y'
  AND NOT (v.SERIAL LIKE 'Z%' AND v.AGNTCDE = '13655860812')
  AND v.SERIAL NOT LIKE '%.%'
  AND v.PTDATE >= to_date('{日期_从.Value.Date.ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')
  AND v.PTDATE < to_date('{日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')";

                // 业务员筛选
                if (列表_业务员.CheckedItems.Count > 0)
                {
                    string tmpstr = "";
                    foreach (DataRowView rowview in 列表_业务员.CheckedItems)
                    {
                        string 业务员编码 = rowview["EMPCDE"].ToString();
                        if (业务员编码 != "" && 业务员编码 != null)
                        {
                            if (tmpstr != "") tmpstr += ",";
                            tmpstr += "'" + 业务员编码 + "'";
                        }
                    }

                    if (tmpstr != "")
                    {
                        // 注意：业务员筛选需要考虑转换后的业务员编码
                        // 森林包装 + 李仰忠 转换为 莫梦辉 的编码
                        sql += " AND CASE WHEN v.CLNTNME = '森林包装集团股份有限公司' AND v.AGNTCDE = '13655860812' THEN '13586269539' ELSE v.AGNTCDE END IN (" + tmpstr + ")";
                    }
                }

                // 通用筛选条件
                if (文本_客户.Text.Trim() != "")
                {
                    sql += " AND v.CLNTNME LIKE '%" + 文本_客户.Text.Trim() + "%'";
                }

                if (文本_单号.Text.Trim() != "")
                {
                    sql += " AND v.SERIAL LIKE '%" + 文本_单号.Text.Trim() + "%'";
                }

                if (文本_产品.Text.Trim() != "")
                {
                    sql += " AND v.PRDNME LIKE '%" + 文本_产品.Text.Trim() + "%'";
                }

                sql += " ORDER BY v.PTDATE DESC";
            }
            // 临海（旧系统）：使用原来的旧系统查询方式
            else
            {
                // 旧系统（临海）：使用 V_ORD 视图 LEFT JOIN ORD_CT 表获取报价单价
                // V_ORD 提供客户、产品、日期、数量、卖价等信息
                // ORD_CT 提供报价单价 AGNTPRC
                // 业务逻辑：
                // 1. 排除未审核数据（STATUS = 'Y'）
                // 2. 排除 Z 开头单号且业务员为李仰忠的数据
                // 3. 森林包装集团股份有限公司 + 李仰忠 的业务员转换为莫梦辉
                sql = $@"
SELECT 
    TO_CHAR(v.PTDATE, 'yyyy-MM-dd') as 日期,
    v.SERIAL as 单号,
    v.CLNTNME as 客户,
    v.PRDNME as 产品,
    CASE 
        WHEN v.CLNTNME = '森林包装集团股份有限公司' AND v.AGNTCDE = '13655860812' 
        THEN '13586269539' 
        ELSE v.AGNTCDE 
    END as 业务员编码,
    NVL(ct.AGNTPRC, 0) * NVL(v.ACCNUM, 0) as 报价总金额,
    NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) as 卖价总金额,
    NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) - NVL(ct.AGNTPRC, 0) * NVL(v.ACCNUM, 0) as 毛利,
    CASE 
        WHEN NVL(ct.AGNTPRC, 0) * NVL(v.ACCNUM, 0) = 0 THEN NULL
        ELSE ROUND((NVL(v.PRICES, 0) * NVL(v.ACCNUM, 0) - NVL(ct.AGNTPRC, 0) * NVL(v.ACCNUM, 0)) / (NVL(ct.AGNTPRC, 0) * NVL(v.ACCNUM, 0)) * 100, 2)
    END as 利率
FROM V_ORD v
LEFT JOIN ORD_CT ct ON v.SERIAL = ct.SERIAL AND v.CLIENTID = ct.CLIENTID AND v.ORGCDE = ct.ORGCDE
WHERE v.STATUS = 'Y'
  AND NOT (v.SERIAL LIKE 'Z%' AND v.AGNTCDE = '13655860812')
  AND v.SERIAL NOT LIKE '%.%'
  AND v.PTDATE >= to_date('{日期_从.Value.Date.ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')
  AND v.PTDATE < to_date('{日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd")}', 'yyyy-MM-dd')";

                // 业务员筛选
                if (列表_业务员.CheckedItems.Count > 0)
                {
                    string tmpstr = "";
                    foreach (DataRowView rowview in 列表_业务员.CheckedItems)
                    {
                        string 业务员编码 = rowview["EMPCDE"].ToString();
                        if (业务员编码 != "" && 业务员编码 != null)
                        {
                            if (tmpstr != "") tmpstr += ",";
                            tmpstr += "'" + 业务员编码 + "'";
                        }
                    }

                    if (tmpstr != "")
                    {
                        // 注意：业务员筛选需要考虑转换后的业务员编码
                        // 森林包装 + 李仰忠 转换为 莫梦辉 的编码
                        sql += " AND CASE WHEN v.CLNTNME = '森林包装集团股份有限公司' AND v.AGNTCDE = '13655860812' THEN '13586269539' ELSE v.AGNTCDE END IN (" + tmpstr + ")";
                    }
                }

                // 通用筛选条件
                if (文本_客户.Text.Trim() != "")
                {
                    sql += " AND v.CLNTNME LIKE '%" + 文本_客户.Text.Trim() + "%'";
                }

                if (文本_单号.Text.Trim() != "")
                {
                    sql += " AND v.SERIAL LIKE '%" + 文本_单号.Text.Trim() + "%'";
                }

                if (文本_产品.Text.Trim() != "")
                {
                    sql += " AND v.PRDNME LIKE '%" + 文本_产品.Text.Trim() + "%'";
                }

                sql += " ORDER BY v.PTDATE DESC";
            }

            return sql;
        }

        private void 显示结果(List<利润统计数据> dataList)
        {
            列表_查询结果.Items.Clear();

            // 一次性获取业务员表并构建缓存字典（优化性能）
            DataTable 业务员表 = 模块_通用函数.易捷业务员表();
            Dictionary<string, DataRow> 业务员字典 = new Dictionary<string, DataRow>();
            foreach (DataRow row in 业务员表.Rows)
            {
                string empCde = row["EMPCDE"].ToString();
                string empCde2 = row["EMPCDE2"].ToString();
                if (!string.IsNullOrEmpty(empCde) && !业务员字典.ContainsKey(empCde))
                    业务员字典[empCde] = row;
                if (!string.IsNullOrEmpty(empCde2) && !业务员字典.ContainsKey(empCde2))
                    业务员字典[empCde2] = row;
            }

            // 用于汇总实际显示的数据
            decimal 总报价 = 0;
            decimal 总卖价 = 0;
            decimal 总毛利 = 0;
            int 显示行数 = 0;

            foreach (var item in dataList)
            {
                // 利率筛选
                if (item.利率 < 数值_利率从.Value || item.利率 > 数值_利率到.Value)
                    continue;

                // 从字典查找业务员信息（O(1)复杂度）
                string 业务员姓名 = item.业务员编码 ?? "";
                string 部门名称 = "";
                if (!string.IsNullOrEmpty(item.业务员编码) && 业务员字典.ContainsKey(item.业务员编码))
                {
                    业务员姓名 = 业务员字典[item.业务员编码]["EMPNME"].ToString();
                    部门名称 = 业务员字典[item.业务员编码]["TEMNME"].ToString();
                }

                // 部门筛选（在内存中筛选）
                if (列表_部门.CheckedItems.Count > 0)
                {
                    bool 部门匹配 = false;
                    foreach (DataRowView rowview in 列表_部门.CheckedItems)
                    {
                        if (rowview["TEMNME"].ToString() == 部门名称)
                        {
                            部门匹配 = true;
                            break;
                        }
                    }
                    if (!部门匹配) continue;
                }

                // 累加实际显示的数据
                总报价 += item.报价总金额;
                总卖价 += item.卖价总金额;
                总毛利 += item.毛利;
                显示行数++;

                ListViewItem lvItem = new ListViewItem(item.日期);
                lvItem.SubItems.Add(item.单号);
                lvItem.SubItems.Add(item.客户);
                lvItem.SubItems.Add(item.产品);
                lvItem.SubItems.Add(业务员姓名);
                lvItem.SubItems.Add(部门名称);
                lvItem.SubItems.Add(item.报价总金额.ToString("0.00"));
                lvItem.SubItems.Add(item.卖价总金额.ToString("0.00"));
                lvItem.SubItems.Add(item.毛利.ToString("0.00"));
                lvItem.SubItems.Add(item.利率.ToString("0.00") + "%");

                列表_查询结果.Items.Add(lvItem);
            }

            // 添加汇总行（使用实际显示的数据）
            decimal 平均利率 = 总报价 > 0 ? (总毛利 / 总报价 * 100) : 0;
            
            if (显示行数 > 0)
            {
                ListViewItem sumItem = new ListViewItem("汇总");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add(总报价.ToString("0.00"));
                sumItem.SubItems.Add(总卖价.ToString("0.00"));
                sumItem.SubItems.Add(总毛利.ToString("0.00"));
                sumItem.SubItems.Add(平均利率.ToString("0.00") + "%");
                sumItem.BackColor = System.Drawing.Color.LightYellow;

                列表_查询结果.Items.Add(sumItem);
            }
            
            // 更新底部汇总标签
            标签_总单数.Text = 显示行数.ToString();
            标签_总报价.Text = 总报价.ToString("0.00");
            标签_总卖价.Text = 总卖价.ToString("0.00");
            标签_总利润.Text = 总毛利.ToString("0.00");
            标签_平均利率.Text = 平均利率.ToString("0.00") + "%";
        }

        private void 按钮_导出_Click(object sender, EventArgs e)
        {
            ExcelControl.ExportExcel.ListViewtoExcel(列表_查询结果);
        }

        private void 列表_部门_ItemCheck(object sender, ItemCheckEventArgs e)
        {
            var count = 列表_部门.CheckedItems.Count;
            var 当前项 = 列表_部门.SelectedIndex;
            var 当前状态 = 列表_部门.GetItemChecked(当前项);
            if (当前状态)
            {
                count -= 1;
            }
            else
            {
                count += 1;
            }
            if (count > 0)
            {
                var tmpstr = "";
                for (int i = 0; i < 列表_部门.Items.Count; i++)
                {
                    var 该项状态 = 列表_部门.GetItemChecked(i);
                    if (i == 当前项) 该项状态 = !该项状态;
                    if (该项状态 == true)
                    {
                        if (tmpstr != "")
                        {
                            tmpstr += ",";
                        }
                        tmpstr += "'" + 列表_部门.GetItemText(列表_部门.Items[i]) + "'";
                    }
                }
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "TEMNME in (" + tmpstr + ")";
            }
            else
            {
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "";
            }
        }
    }

    public class 利润统计数据
    {
        public string 日期 { get; set; }
        public string 单号 { get; set; }
        public string 客户 { get; set; }
        public string 产品 { get; set; }
        public string 业务员编码 { get; set; }
        public decimal 报价总金额 { get; set; }
        public decimal 卖价总金额 { get; set; }
        public decimal 毛利 { get; set; }
        public decimal 利率 { get; set; }
    }
}

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
    public partial class 窗体_各部门报表 : Form
    {
        // 易捷集团数据库连接字符串
        private const string 易捷集团连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

        public 窗体_各部门报表()
        {
            InitializeComponent();
        }

        private void 按钮_查询_Click(object sender, EventArgs e)
        {
            // 简化SQL，直接从grp_ord_data查询，不使用v_ord_processes视图
            // 使用 ordnum 替代 accnum 计算面积
            var sql = @"
select tp, agntcde, nvl(sum(accamt), 0) as 金额, nvl(sum(area), 0) as 面积, count(*) as 单数
from
(SELECT agntcde, accamt, acreage * ordnum as area,
case crrcde when '1Z' then
   '1Z'
else
    objtyp
end tp
from grp_ord_data where status = 'Y'";

            sql += " and created >= to_date('" + 日期_从.Value.Date.ToString("yyyy-MM-dd") + "', 'yyyy-mm-dd')";
            sql += " and created < to_date('" + 日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd") + "', 'yyyy-mm-dd')";

            sql += ") group by agntcde, tp";

            List<tempData> tempDatas = new List<tempData>();
            // 直接从集团服务器查询，不再循环遍历多个数据库
            try {
                using (var helper = SqlHelperFactory.OpenDatabase(易捷集团连接字符串, SqlType.Oracle)) {
                    var list = helper.Select<tempData>(sql);
                    tempDatas.AddRange(list);
                }
            } catch (Exception ex) {
                MessageBox.Show("集团服务器连接出错：" + ex.Message);
            }
            
            显示结果(tempDatas);

        }

        public void 显示结果(List<tempData> 销售员表)
        {
            列表_查询结果.Items.Clear();
            var 部门表 = 模块_通用函数.易捷部门表();
            var 业务员视图 = 模块_通用函数.易捷业务员表().DefaultView;

            List<showData> showDatas = new List<showData>();
            Dictionary<string, showData> dict = new Dictionary<string, showData>();

            foreach (DataRow row in 部门表.Rows) {
                var 部门编号 = row["TEMCDE"].ToString();
                var 部门名称 = row["TEMNME"].ToString();
                业务员视图.RowFilter = "TEMCDE='" + 部门编号 + "'";

                List<string> ywys = new List<string>();
                foreach (DataRowView rowview in 业务员视图) {
                    if (rowview["EMPCDE"] != null && rowview["EMPCDE"].ToString() != "") {
                        ywys.Add(rowview["EMPCDE"].ToString());
                    }
                    if (rowview["EMPCDE2"]!=null && rowview["EMPCDE2"].ToString()!="") {
                        ywys.Add(rowview["EMPCDE2"].ToString());
                    }
                }

                写列项(部门名称, "CM", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "CL", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "CB", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "CT", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "CC", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "CD", ywys, 销售员表, showDatas, dict);
                写列项(部门名称, "1Z", ywys, 销售员表, showDatas, dict);

            }
            foreach (var item in showDatas) {
                var 列项 = 列表_查询结果.Items.Add(item.部门);
                列项.SubItems.Add(item.类型.ToString());
                列项.SubItems.Add(item.单数.ToString());
                列项.SubItems.Add(item.金额.ToString("0.00"));
                列项.SubItems.Add(item.面积.ToString("0.00"));
                列项.SubItems.Add(item.均价.ToString("0.00"));
                列项.SubItems.Add(item.均量.ToString("0.00"));
            }


        }
        private void 写列项(string 部门名称, string 类别, List<string> ywys, List<tempData> 销售员表, List<showData> showDatas, Dictionary<string, showData> dict)
        {
            var list = 销售员表.Where(q => q.tp == 类别 && ywys.Contains(q.agntcde)).ToList();
            var 类型 = Get类型(类别);

            showData showData;//=new showData();
            var key = 部门名称 + "-" + 类型;
            if (dict.TryGetValue(key, out showData) == false) {
                showData = new showData();
                showData.部门 = 部门名称;
                showData.类型 = 类型;
                dict[key] = showData;
                showDatas.Add(showData);
            }

            foreach (var item in list) {
                showData.单数 += item.单数;
                showData.金额 += item.金额;
                showData.面积 += item.面积;
            }
            if (showData.面积 != 0) showData.均价 = showData.金额 / showData.面积;
            if (showData.单数 != 0) showData.均量 = showData.面积 / showData.单数;
        }



        private string Get类型(string 类别)
        {
            switch (类别) {
                case "CM": return "商务";
                case "CL": return "彩盒";
                case "CB": return "平板";
                case "CT": return "纸箱";
                case "CC": return "数码平板";
                case "CD": return "数码纸箱";
                case "1Z": return "面纸加工";
                default:
                    break;
            }
            return 类别;
        }




        public class tempData
        {
            public string tp { get; set; }
            public string agntcde { get; set; }
            public decimal 金额 { get; set; }
            public decimal 面积 { get; set; }
            public int 单数 { get; set; }

        }
        public class showData
        {
            public string 部门 { get; set; }
            public string 类型 { get; set; }
            public int 单数 { get; set; }
            public decimal 金额 { get; set; }
            public decimal 面积 { get; set; }
            public decimal 均价 { get; set; }
            public decimal 均量 { get; set; }

        }

        private void 按钮_导出_Click(object sender, EventArgs e)
        {
            ExcelControl.ExportExcel.ListViewtoExcel(列表_查询结果);
        }

        private void 窗体_各部门报表_Load(object sender, EventArgs e)
        {

        }
    }
}

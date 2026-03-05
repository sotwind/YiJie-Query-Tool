using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ToolGood.ReadyGo3;

namespace 易捷查询CSharp
{
    public partial class 窗体_销售员图 : Form
    {
        // 易捷集团数据库连接字符串
        private const string 易捷集团连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

        public 窗体_销售员图() {
            InitializeComponent();
        }

        private void 窗体_销售员图_Load(object sender, EventArgs e) {
            模块_通用函数.初始化日期从(日期_从);
            模块_通用函数.初始化日期到(日期_到);
            //try {
                列表_部门.DataSource = 模块_通用函数.易捷部门表();
                列表_部门.DisplayMember = "TEMNME";
                列表_部门.ValueMember = "TEMCDE";
                列表_业务员.DataSource = 模块_通用函数.易捷业务员表();
                列表_业务员.DisplayMember = "EMPNME";
                列表_业务员.ValueMember = "EMPCDE";
                列表_跟单员.DataSource = 模块_通用函数.易捷跟单员表().DefaultView;
                列表_跟单员.DisplayMember = "EMPNME";
                列表_跟单员.ValueMember = "EMPCDE";
            //} catch (Exception ex) {
            //    MessageBox.Show(ex.Message);
            //}
        }
        private void 按钮_查询_Click(object sender, EventArgs e) {
            string sql = null;
            if (单选_显示业务员.Checked) {
                sql = @"select b.objtyp, t.agntcde, nvl(sum(b.accamt),0) as 金额, nvl(sum(t.acreage * t.ordnum),0) as 面积, count(*) as 单数 
                        from ord_bas b 
                        join ord_ct t on b.serial = t.serial 
                        where b.status='Y' and b.isactive='Y'";
            } else {
                sql = @"select b.objtyp, t.asscde as agntcde, nvl(sum(b.accamt),0) as 金额, nvl(sum(t.acreage * t.ordnum),0) as 面积, count(*) as 单数 
                        from ord_bas b 
                        join ord_ct t on b.serial = t.serial 
                        where b.status='Y' and b.isactive='Y'";
            }
            sql += " and b.created >= to_date('" + 日期_从.Value.Date.ToString("yyyy-MM-dd") + "', 'yyyy-mm-dd')";
            sql += " and b.created < to_date('" + 日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd") + "', 'yyyy-mm-dd')";

            var tmpstr = "";
            if (列表_业务员.CheckedItems.Count == 0) {
                if (列表_部门.CheckedItems.Count == 0) {
                } else {
                    foreach (DataRowView rv in 模块_通用函数.易捷业务员表().DefaultView) {
                        if (rv["EMPCDE"].ToString() != "0") {
                            if (rv["EMPCDE"] != null && rv["EMPCDE"].ToString() != "") {
                                if (tmpstr != "") { tmpstr += ","; }
                                tmpstr += "'" + rv["EMPCDE"].ToString() + "'";
                            }
                            if (rv["EMPCDE2"] != null && rv["EMPCDE2"].ToString() != "") {
                                if (tmpstr != "") { tmpstr += ","; }
                                tmpstr += "'" + rv["EMPCDE2"].ToString() + "'";
                            }
                        }
                    }
                    if (tmpstr != "") {
                        sql += " and t.agntcde in (";
                        sql += tmpstr;
                        sql += ")";
                    }
                }
            } else {
                for (int i = 0; i < 列表_业务员.Items.Count; i++) {
                    if (列表_业务员.GetItemChecked(i)) {
                        if (tmpstr != "") { tmpstr += ","; }
                        tmpstr += "'" + ((DataRowView)列表_业务员.Items[i])["EMPCDE"].ToString() + "'";
                        var empCode2 = ((DataRowView)列表_业务员.Items[i])["EMPCDE2"].ToString();
                        if (!string.IsNullOrEmpty(empCode2)) {
                            tmpstr += ",";
                            tmpstr += "'" + empCode2 + "'";
                        }
                    }
                }
                if (tmpstr != "") {
                    sql += " and t.agntcde in (";
                    sql += tmpstr;
                    sql += ")";
                }
            }
            if (列表_跟单员.CheckedItems.Count > 0) {
                tmpstr = "";
                for (int i = 0; i < 列表_跟单员.Items.Count - 1; i++) {
                    if (列表_跟单员.GetItemChecked(i)) {
                        列表_跟单员.SetSelected(i, true);
                        if (tmpstr != "") { tmpstr += ","; }
                        tmpstr += "'" + 列表_跟单员.SelectedValue.ToString() + "'";
                    }
                }
                if (tmpstr != "") {
                    sql += " and t.asscde in (";
                    sql += tmpstr;
                    sql += ")";
                }
            }
            if (单选_显示业务员.Checked) {
                sql += " group by t.agntcde, b.objtyp order by t.agntcde";
            } else {
                sql += " group by t.asscde, b.objtyp order by t.asscde";
            }
            
            List<tempData> tempDatas = new List<tempData>();
            // 遍历所有新系统数据库查询并汇总数据（ord_bas和ord_ct表只存在于新系统）
            foreach (var db in DatabaseInfos.GetDatabaseInfos()) {
                // 只查询新系统数据库
                if (db.ServerType != "新系统")
                    continue;
                try {
                    using (var helper = SqlHelperFactory.OpenDatabase(db.GetConnString(), SqlType.Oracle)) {
                        var list = helper.Select<tempData>(sql);
                        tempDatas.AddRange(list);
                    }
                } catch (Exception ex) {
                    Debug.Print($"查询数据库 {db.FactoryName} 失败: {ex.Message}");
                }
            }

            显示结果(tempDatas);
        }
        public void 显示结果(List<tempData> tempDatas) {
            列表_查询结果.Items.Clear();
            List<ShowData> showDatas = new List<ShowData>();
            Dictionary<string, ShowData> dict = new Dictionary<string, ShowData>();

            foreach (var row in tempDatas) {
                ShowData showData;
                var 姓名 = "没有名字";

                if (单选_显示业务员.Checked) {
                    var tmp = 模块_通用函数.易捷业务员表().Select("EMPCDE='" + row.agntcde + "' or EMPCDE2='" + row.agntcde + "'");
                    if (tmp.Count() > 0) {
                        姓名 = 模块_通用函数.易捷业务员表().Select("EMPCDE='" + row.agntcde + "' or EMPCDE2='" + row.agntcde + "'")[0]["EMPNME"].ToString();
                    }
                } else {
                    var tmp = 模块_通用函数.易捷跟单员表().Select("EMPCDE='" + row.agntcde + "' or EMPCDE2='" + row.agntcde + "'");
                    if (tmp.Count() > 0) {
                        姓名 = 模块_通用函数.易捷跟单员表().Select("EMPCDE='" + row.agntcde + "' or EMPCDE2='" + row.agntcde + "'")[0]["EMPNME"].ToString();
                    }
                }
                if (dict.TryGetValue(姓名, out showData) == false) {
                    showData = new ShowData();
                    showData.姓名 = 姓名;
                    dict[姓名] = showData;
                    showDatas.Add(showData);
                }
                showData.个人单数 += row.单数;
                showData.个人金额 += row.金额;
                showData.个人面积 += row.面积;

                if (row.objtyp == "CM") {
                    showData.商务单数 += row.单数;
                    showData.商务金额 += row.金额;
                    showData.商务面积 += row.面积;
                } else if (row.objtyp == "CL") {
                    showData.彩盒单数 += row.单数;
                    showData.彩盒金额 += row.金额;
                    showData.彩盒面积 += row.面积;
                } else if (row.objtyp == "CB") {
                    showData.平板单数 += row.单数;
                    showData.平板金额 += row.金额;
                    showData.平板面积 += row.面积;
                } else if (row.objtyp == "CT") {
                    showData.纸箱单数 += row.单数;
                    showData.纸箱金额 += row.金额;
                    showData.纸箱面积 += row.面积;
                } else if (row.objtyp == "CC") {
                    showData.数码平板单数 += row.单数;
                    showData.数码平板金额 += row.金额;
                    showData.数码平板面积 += row.面积;
                } else if (row.objtyp == "CD") {
                    showData.数码纸箱单数 += row.单数;
                    showData.数码纸箱金额 += row.金额;
                    showData.数码纸箱面积 += row.面积;
                }
                showData.单数 += row.单数;
                showData.金额 += row.金额;
                showData.面积 += row.面积;
            }

            ListViewItem 列项;
            foreach (var showData in showDatas) {
                列项 = 列表_查询结果.Items.Add(showData.姓名);
                for (int i = 0; i < 21; i++) {
                    列项.SubItems.Add("0");
                }
                列项.SubItems[1].Text = showData.个人单数.ToString();
                列项.SubItems[2].Text = showData.个人金额.ToString("0.00");
                列项.SubItems[3].Text = showData.个人面积.ToString("0.00");

                列项.SubItems[4].Text = showData.商务单数.ToString();
                列项.SubItems[5].Text = showData.商务金额.ToString("0.00");
                列项.SubItems[6].Text = showData.商务面积.ToString("0.00");

                列项.SubItems[7].Text = showData.彩盒单数.ToString();
                列项.SubItems[8].Text = showData.彩盒金额.ToString("0.00");
                列项.SubItems[9].Text = showData.彩盒面积.ToString("0.00");

                列项.SubItems[10].Text = showData.平板单数.ToString();
                列项.SubItems[11].Text = showData.平板金额.ToString("0.00");
                列项.SubItems[12].Text = showData.平板面积.ToString("0.00");

                列项.SubItems[13].Text = showData.纸箱单数.ToString();
                列项.SubItems[14].Text = showData.纸箱金额.ToString("0.00");
                列项.SubItems[15].Text = showData.纸箱面积.ToString("0.00");

                列项.SubItems[16].Text = showData.数码平板单数.ToString();
                列项.SubItems[17].Text = showData.数码平板金额.ToString("0.00");
                列项.SubItems[18].Text = showData.数码平板面积.ToString("0.00");

                列项.SubItems[19].Text = showData.数码纸箱单数.ToString();
                列项.SubItems[20].Text = showData.数码纸箱金额.ToString("0.00");
                列项.SubItems[21].Text = showData.数码纸箱面积.ToString("0.00");
            }

            列项 = 列表_查询结果.Items.Add("------");
            for (int i = 0; i < 21; i++) {
                列项.SubItems.Add("------");
            }
            列项 = 列表_查询结果.Items.Add("汇总");
            列项.SubItems.Add(showDatas.Sum(q => q.单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.商务单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.商务金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.商务面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.彩盒单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.彩盒金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.彩盒面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.平板单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.平板金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.平板面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.纸箱单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.纸箱金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.纸箱面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.数码平板单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.数码平板金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.数码平板面积, 2)).ToString("0.00"));

            列项.SubItems.Add(showDatas.Sum(q => q.数码纸箱单数).ToString());
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.数码纸箱金额, 2)).ToString("0.00"));
            列项.SubItems.Add(showDatas.Sum(q => Math.Round(q.数码纸箱面积, 2)).ToString("0.00"));


        }


        public class tempData
        {
            public string objtyp { get; set; }
            public string agntcde { get; set; }
            public decimal 金额 { get; set; }
            public decimal 面积 { get; set; }
            public int 单数 { get; set; }
        }
        public class ShowData
        {
            public string 姓名 { get; set; }
            public int 个人单数 { get; set; }
            public decimal 个人金额 { get; set; }
            public decimal 个人面积 { get; set; }



            public int 单数 { get; set; }
            public decimal 金额 { get; set; }
            public decimal 面积 { get; set; }
            public int 商务单数 { get; set; }
            public decimal 商务金额 { get; set; }
            public decimal 商务面积 { get; set; }
            public int 彩盒单数 { get; set; }
            public decimal 彩盒金额 { get; set; }
            public decimal 彩盒面积 { get; set; }
            public int 平板单数 { get; set; }
            public decimal 平板金额 { get; set; }
            public decimal 平板面积 { get; set; }
            public int 纸箱单数 { get; set; }
            public decimal 纸箱金额 { get; set; }
            public decimal 纸箱面积 { get; set; }
            public int 数码平板单数 { get; set; }
            public decimal 数码平板金额 { get; set; }
            public decimal 数码平板面积 { get; set; }
            public int 数码纸箱单数 { get; set; }
            public decimal 数码纸箱金额 { get; set; }
            public decimal 数码纸箱面积 { get; set; }
        }




        private void 列表_部门_ItemCheck(object sender, ItemCheckEventArgs e) {
            var count = 列表_部门.CheckedItems.Count;
            var 当前项 = 列表_部门.SelectedIndex;
            var 当前状态 = 列表_部门.GetItemChecked(当前项);
            if (当前状态) {
                count -= 1;
            } else {
                count += 1;
            }
            if (count > 0) {
                var tmpstr = "";
                for (int i = 0; i < 列表_部门.Items.Count; i++) {
                    var 该项状态 = 列表_部门.GetItemChecked(i);
                    if (i == 当前项) 该项状态 = !该项状态;
                    if (该项状态 == true) {
                        if (tmpstr != "") {
                            tmpstr += ",";
                        }
                        tmpstr += "'" + 列表_部门.GetItemText(列表_部门.Items[i]) + "'";
                    }
                }
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "TEMNME in (" + tmpstr + ")";

            } else {
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "";
            }
        }

        private void 列表_业务员_ItemCheck(object sender, ItemCheckEventArgs e) {

        }

        private void 列表_跟单员_ItemCheck(object sender, ItemCheckEventArgs e) {

        }

        private void 按钮_导出_Click(object sender, EventArgs e) {
            ExcelControl.ExportExcel.ListViewtoExcel(列表_查询结果);
        }
    }
}

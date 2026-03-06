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
            // 构建WHERE条件部分（通用）
            var where条件 = " where status='Y'";
            where条件 += " and ptdate >= to_date('" + 日期_从.Value.Date.ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')";
            where条件 += " and ptdate < to_date('" + 日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')";

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
                        where条件 += " and agntcde in (";
                        where条件 += tmpstr;
                        where条件 += ")";
                    }
                }
            } else {
                for (int i = 0; i < 列表_业务员.Items.Count; i++) {
                    if (列表_业务员.GetItemChecked(i)) {
                        if (((DataRowView)列表_业务员.Items[i])["EMPNME"].ToString() == "吴玉龙") {
                            Debug.WriteLine(((DataRowView)列表_业务员.Items[i])["EMPNME"].ToString());
                            Debug.WriteLine(((DataRowView)列表_业务员.Items[i])["EMPCDE"].ToString());
                            Debug.WriteLine(((DataRowView)列表_业务员.Items[i])["TEMCDE"].ToString());
                            Debug.WriteLine(((DataRowView)列表_业务员.Items[i])["TEMNME"].ToString());
                        }
                        //列表_业务员.SetItemChecked(i, true);
                        if (tmpstr != "") { tmpstr += ","; }
                        tmpstr += "'" + ((DataRowView)列表_业务员.Items[i])["EMPCDE"].ToString() + "'";
                        tmpstr += ",";
                        tmpstr += "'" + ((DataRowView)列表_业务员.Items[i])["EMPCDE2"].ToString() + "'";
                    }
                }
                if (tmpstr != "") {
                    where条件 += " and agntcde in (";
                    where条件 += tmpstr;
                    where条件 += ")";
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
                    where条件 += " and asscde in (";
                    where条件 += tmpstr;
                    where条件 += ")";
                }
            }

            List<tempData> tempDatas = new List<tempData>();
            foreach (var item in DatabaseInfos.GetDatabaseInfos()) {
                try {
                    // 所有系统都使用 v_ord 视图（新系统和旧系统都支持）
                    string sql;
                    if (单选_显示业务员.Checked) {
                        sql = "select objtyp, agntcde, nvl(sum(accamt),0) as 金额, nvl(sum(acreage*accnum),0) as 面积, count(*) as 单数 from v_ord " +
                              where条件 +
                              " group by agntcde, objtyp order by agntcde";
                    } else {
                        sql = "select objtyp, asscde, nvl(sum(accamt),0) as 金额, nvl(sum(acreage*accnum),0) as 面积, count(*) as 单数 from v_ord " +
                              where条件 +
                              " group by asscde, objtyp order by asscde";
                    }

                    using (var helper = SqlHelperFactory.OpenDatabase(item.GetConnString(), SqlType.Oracle)) {
                        var list = helper.Select<tempData>(sql);
                        tempDatas.AddRange(list);
                    }
                } catch (Exception ex) {
                    Debug.Print("SQL执行失败：" + ex.Message);
                    MessageBox.Show(item.FactoryName + "连接出错了：" + ex.Message);
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
            public string asscde { get; set; }
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

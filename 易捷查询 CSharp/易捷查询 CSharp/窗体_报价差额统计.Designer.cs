namespace 易捷查询 CSharp
{
    partial class 窗体_报价差额统计
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.btn 查询 = new System.Windows.Forms.Button();
            this.cbo 部门 = new System.Windows.Forms.ComboBox();
            this.lbl 部门 = new System.Windows.Forms.Label();
            this.cbo 业务员 = new System.Windows.Forms.ComboBox();
            this.lbl 业务员 = new System.Windows.Forms.Label();
            this.txt 产品 = new System.Windows.Forms.TextBox();
            this.lbl 产品 = new System.Windows.Forms.Label();
            this.txt 单号 = new System.Windows.Forms.TextBox();
            this.lbl 单号 = new System.Windows.Forms.Label();
            this.cbo 服务器 = new System.Windows.Forms.ComboBox();
            this.lbl 服务器 = new System.Windows.Forms.Label();
            this.cbo 客户 = new System.Windows.Forms.ComboBox();
            this.lbl 客户 = new System.Windows.Forms.Label();
            this.lbl 到 = new System.Windows.Forms.Label();
            this.dtp 到 = new System.Windows.Forms.DateTimePicker();
            this.dtp 从 = new System.Windows.Forms.DateTimePicker();
            this.lbl 日期 = new System.Windows.Forms.Label();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.lv 查询结果 = new System.Windows.Forms.ListView();
            this.columnHeader1 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader2 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader3 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader4 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader5 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader6 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader7 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader8 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader9 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader10 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader11 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader12 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.btn 导出 = new System.Windows.Forms.Button();
            this.lbl 统计 = new System.Windows.Forms.Label();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.btn 查询);
            this.groupBox1.Controls.Add(this.cbo 部门);
            this.groupBox1.Controls.Add(this.lbl 部门);
            this.groupBox1.Controls.Add(this.cbo 业务员);
            this.groupBox1.Controls.Add(this.lbl 业务员);
            this.groupBox1.Controls.Add(this.txt 产品);
            this.groupBox1.Controls.Add(this.lbl 产品);
            this.groupBox1.Controls.Add(this.txt 单号);
            this.groupBox1.Controls.Add(this.lbl 单号);
            this.groupBox1.Controls.Add(this.cbo 服务器);
            this.groupBox1.Controls.Add(this.lbl 服务器);
            this.groupBox1.Controls.Add(this.cbo 客户);
            this.groupBox1.Controls.Add(this.lbl 客户);
            this.groupBox1.Controls.Add(this.lbl 到);
            this.groupBox1.Controls.Add(this.dtp 到);
            this.groupBox1.Controls.Add(this.dtp 从);
            this.groupBox1.Controls.Add(this.lbl 日期);
            this.groupBox1.Dock = System.Windows.Forms.DockStyle.Top;
            this.groupBox1.Location = new System.Drawing.Point(0, 0);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(1284, 106);
            this.groupBox1.TabIndex = 0;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "筛选条件";
            // 
            // btn 查询
            // 
            this.btn 查询.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(122)))), ((int)(((byte)(204)))));
            this.btn 查询.ForeColor = System.Drawing.Color.White;
            this.btn 查询.Location = new System.Drawing.Point(1185, 68);
            this.btn 查询.Name = "btn 查询";
            this.btn 查询.Size = new System.Drawing.Size(90, 30);
            this.btn 查询.TabIndex = 16;
            this.btn 查询.Text = "查询";
            this.btn 查询.UseVisualStyleBackColor = false;
            this.btn 查询.Click += new System.EventHandler(this.btn 查询_Click);
            // 
            // cbo 部门
            // 
            this.cbo 部门.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo 部门.FormattingEnabled = true;
            this.cbo 部门.Location = new System.Drawing.Point(739, 71);
            this.cbo 部门.Name = "cbo 部门";
            this.cbo 部门.Size = new System.Drawing.Size(150, 20);
            this.cbo 部门.TabIndex = 15;
            // 
            // lbl 部门
            // 
            this.lbl 部门.AutoSize = true;
            this.lbl 部门.Location = new System.Drawing.Point(691, 74);
            this.lbl 部门.Name = "lbl 部门";
            this.lbl 部门.Size = new System.Drawing.Size(41, 12);
            this.lbl 部门.TabIndex = 14;
            this.lbl 部门.Text = "部门：";
            // 
            // cbo 业务员
            // 
            this.cbo 业务员.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo 业务员.FormattingEnabled = true;
            this.cbo 业务员.Location = new System.Drawing.Point(535, 71);
            this.cbo 业务员.Name = "cbo 业务员";
            this.cbo 业务员.Size = new System.Drawing.Size(150, 20);
            this.cbo 业务员.TabIndex = 13;
            // 
            // lbl 业务员
            // 
            this.lbl 业务员.AutoSize = true;
            this.lbl 业务员.Location = new System.Drawing.Point(475, 74);
            this.lbl 业务员.Size = new System.Drawing.Size(53, 12);
            this.lbl 业务员.TabIndex = 12;
            this.lbl 业务员.Text = "业务员：";
            // 
            // txt 产品
            // 
            this.txt 产品.Location = new System.Drawing.Point(939, 71);
            this.txt 产品.Name = "txt 产品";
            this.txt 产品.Size = new System.Drawing.Size(150, 21);
            this.txt 产品.TabIndex = 11;
            // 
            // lbl 产品
            // 
            this.lbl 产品.AutoSize = true;
            this.lbl 产品.Location = new System.Drawing.Point(895, 74);
            this.lbl 产品.Name = "lbl 产品";
            this.lbl 产品.Size = new System.Drawing.Size(41, 12);
            this.lbl 产品.TabIndex = 10;
            this.lbl 产品.Text = "产品：";
            // 
            // txt 单号
            // 
            this.txt 单号.Location = new System.Drawing.Point(739, 35);
            this.txt 单号.Name = "txt 单号";
            this.txt 单号.Size = new System.Drawing.Size(150, 21);
            this.txt 单号.TabIndex = 9;
            // 
            // lbl 单号
            // 
            this.lbl 单号.AutoSize = true;
            this.lbl 单号.Location = new System.Drawing.Point(691, 38);
            this.lbl 单号.Name = "lbl 单号";
            this.lbl 单号.Size = new System.Drawing.Size(41, 12);
            this.lbl 单号.TabIndex = 8;
            this.lbl 单号.Text = "单号：";
            // 
            // cbo 服务器
            // 
            this.cbo 服务器.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo 服务器.FormattingEnabled = true;
            this.cbo 服务器.Location = new System.Drawing.Point(65, 35);
            this.cbo 服务器.Name = "cbo 服务器";
            this.cbo 服务器.Size = new System.Drawing.Size(150, 20);
            this.cbo 服务器.TabIndex = 7;
            // 
            // lbl 服务器
            // 
            this.lbl 服务器.AutoSize = true;
            this.lbl 服务器.Location = new System.Drawing.Point(7, 38);
            this.lbl 服务器.Name = "lbl 服务器";
            this.lbl 服务器.Size = new System.Drawing.Size(53, 12);
            this.lbl 服务器.TabIndex = 6;
            this.lbl 服务器.Text = "服务器：";
            // 
            // cbo 客户
            // 
            this.cbo 客户.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo 客户.FormattingEnabled = true;
            this.cbo 客户.Location = new System.Drawing.Point(535, 35);
            this.cbo 客户.Name = "cbo 客户";
            this.cbo 客户.Size = new System.Drawing.Size(150, 20);
            this.cbo 客户.TabIndex = 5;
            // 
            // lbl 客户
            // 
            this.lbl 客户.AutoSize = true;
            this.lbl 客户.Location = new System.Drawing.Point(487, 38);
            this.lbl 客户.Name = "lbl 客户";
            this.lbl 客户.Size = new System.Drawing.Size(41, 12);
            this.lbl 客户.TabIndex = 4;
            this.lbl 客户.Text = "客户：";
            // 
            // lbl 到
            // 
            this.lbl 到.AutoSize = true;
            this.lbl 到.Location = new System.Drawing.Point(375, 38);
            this.lbl 到.Name = "lbl 到";
            this.lbl 到.Size = new System.Drawing.Size(17, 12);
            this.lbl 到.TabIndex = 3;
            this.lbl 到.Text = "到";
            // 
            // dtp 到
            // 
            this.dtp 到.Location = new System.Drawing.Point(398, 35);
            this.dtp 到.Name = "dtp 到";
            this.dtp 到.Size = new System.Drawing.Size(70, 21);
            this.dtp 到.TabIndex = 2;
            // 
            // dtp 从
            // 
            this.dtp 从.Location = new System.Drawing.Point(300, 35);
            this.dtp 从.Name = "dtp 从";
            this.dtp 从.Size = new System.Drawing.Size(70, 21);
            this.dtp 从.TabIndex = 1;
            // 
            // lbl 日期
            // 
            this.lbl 日期.AutoSize = true;
            this.lbl 日期.Location = new System.Drawing.Point(245, 38);
            this.lbl 日期.Name = "lbl 日期";
            this.lbl 日期.Size = new System.Drawing.Size(53, 12);
            this.lbl 日期.TabIndex = 0;
            this.lbl 日期.Text = "日期：";
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.lv 查询结果);
            this.groupBox2.Controls.Add(this.btn 导出);
            this.groupBox2.Controls.Add(this.lbl 统计);
            this.groupBox2.Dock = System.Windows.Forms.DockStyle.Fill;
            this.groupBox2.Location = new System.Drawing.Point(0, 106);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(1284, 505);
            this.groupBox2.TabIndex = 1;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "查询结果";
            // 
            // lv 查询结果
            // 
            this.lv 查询结果.Columns.AddRange(new System.Windows.Forms.ColumnHeader[] {
            this.columnHeader1,
            this.columnHeader2,
            this.columnHeader3,
            this.columnHeader4,
            this.columnHeader5,
            this.columnHeader6,
            this.columnHeader7,
            this.columnHeader8,
            this.columnHeader9,
            this.columnHeader10,
            this.columnHeader11,
            this.columnHeader12});
            this.lv 查询结果.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lv 查询结果.FullRowSelect = true;
            this.lv 查询结果.GridLines = true;
            this.lv 查询结果.Location = new System.Drawing.Point(3, 17);
            this.lv 查询结果.Name = "lv 查询结果";
            this.lv 查询结果.Size = new System.Drawing.Size(1278, 453);
            this.lv 查询结果.TabIndex = 2;
            this.lv 查询结果.UseCompatibleStateImageBehavior = false;
            this.lv 查询结果.View = System.Windows.Forms.View.Details;
            // 
            // columnHeader1
            // 
            this.columnHeader1.Text = "服务器";
            this.columnHeader1.Width = 100;
            // 
            // columnHeader2
            // 
            this.columnHeader2.Text = "单号";
            this.columnHeader2.Width = 120;
            // 
            // columnHeader3
            // 
            this.columnHeader3.Text = "客户";
            this.columnHeader3.Width = 150;
            // 
            // columnHeader4
            // 
            this.columnHeader4.Text = "业务员";
            this.columnHeader4.Width = 100;
            // 
            // columnHeader5
            // 
            this.columnHeader5.Text = "部门";
            this.columnHeader5.Width = 120;
            // 
            // columnHeader6
            // 
            this.columnHeader6.Text = "产品代码";
            this.columnHeader6.Width = 100;
            // 
            // columnHeader7
            // 
            this.columnHeader7.Text = "产品名称";
            this.columnHeader7.Width = 150;
            // 
            // columnHeader8
            // 
            this.columnHeader8.Text = "订单数量";
            this.columnHeader8.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader8.Width = 80;
            // 
            // columnHeader9
            // 
            this.columnHeader9.Text = "报价单价";
            this.columnHeader9.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader9.Width = 80;
            // 
            // columnHeader10
            // 
            this.columnHeader10.Text = "实际单价";
            this.columnHeader10.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader10.Width = 80;
            // 
            // columnHeader11
            // 
            this.columnHeader11.Text = "报价金额";
            this.columnHeader11.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader11.Width = 90;
            // 
            // columnHeader12
            // 
            this.columnHeader12.Text = "卖价金额";
            this.columnHeader12.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader12.Width = 90;
            // 
            // btn 导出
            // 
            this.btn 导出.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btn 导出.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(76)))), ((int)(((byte)(175)))), ((int)(((byte)(80)))));
            this.btn 导出.ForeColor = System.Drawing.Color.White;
            this.btn 导出.Location = new System.Drawing.Point(1089, 476);
            this.btn 导出.Name = "btn 导出";
            this.btn 导出.Size = new System.Drawing.Size(90, 30);
            this.btn 导出.TabIndex = 1;
            this.btn 导出.Text = "导出 Excel";
            this.btn 导出.UseVisualStyleBackColor = false;
            this.btn 导出.Click += new System.EventHandler(this.btn 导出_Click);
            // 
            // lbl 统计
            // 
            this.lbl 统计.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.lbl 统计.AutoSize = true;
            this.lbl 统计.Font = new System.Drawing.Font("宋体", 10F, System.Drawing.FontStyle.Bold);
            this.lbl 统计.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(33)))), ((int)(((byte)(150)))), ((int)(((byte)(243)))));
            this.lbl 统计.Location = new System.Drawing.Point(6, 481);
            this.lbl 统计.Name = "lbl 统计";
            this.lbl 统计.Size = new System.Drawing.Size(0, 14);
            this.lbl 统计.TabIndex = 0;
            // 
            // 窗体_报价差额统计
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1284, 611);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.groupBox1);
            this.Name = "窗体_报价差额统计";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "报价与卖价差额统计";
            this.Load += new System.EventHandler(this.窗体_报价差额统计_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Label lbl 日期;
        private System.Windows.Forms.DateTimePicker dtp 从;
        private System.Windows.Forms.DateTimePicker dtp 到;
        private System.Windows.Forms.Label lbl 到;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.ComboBox cbo 服务器;
        private System.Windows.Forms.Label lbl 服务器;
        private System.Windows.Forms.ComboBox cbo 客户;
        private System.Windows.Forms.Label lbl 客户;
        private System.Windows.Forms.TextBox txt 单号;
        private System.Windows.Forms.Label lbl 单号;
        private System.Windows.Forms.TextBox txt 产品;
        private System.Windows.Forms.Label lbl 产品;
        private System.Windows.Forms.ComboBox cbo 部门;
        private System.Windows.Forms.Label lbl 部门;
        private System.Windows.Forms.ComboBox cbo 业务员;
        private System.Windows.Forms.Label lbl 业务员;
        private System.Windows.Forms.Button btn 查询;
        private System.Windows.Forms.ListView lv 查询结果;
        private System.Windows.Forms.ColumnHeader columnHeader1;
        private System.Windows.Forms.ColumnHeader columnHeader2;
        private System.Windows.Forms.ColumnHeader columnHeader3;
        private System.Windows.Forms.ColumnHeader columnHeader4;
        private System.Windows.Forms.ColumnHeader columnHeader5;
        private System.Windows.Forms.ColumnHeader columnHeader6;
        private System.Windows.Forms.ColumnHeader columnHeader7;
        private System.Windows.Forms.ColumnHeader columnHeader8;
        private System.Windows.Forms.ColumnHeader columnHeader9;
        private System.Windows.Forms.ColumnHeader columnHeader10;
        private System.Windows.Forms.ColumnHeader columnHeader11;
        private System.Windows.Forms.ColumnHeader columnHeader12;
        private System.Windows.Forms.Button btn 导出;
        private System.Windows.Forms.Label lbl 统计;
    }
}

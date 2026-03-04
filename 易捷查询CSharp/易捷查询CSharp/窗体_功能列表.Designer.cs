namespace 易捷查询CSharp
{
    partial class 窗体_功能列表
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows 窗体设计器生成的代码

        private void InitializeComponent()
        {
            this.按钮_报价差额统计 = new System.Windows.Forms.Button();
            this.按钮_各部门报表 = new System.Windows.Forms.Button();
            this.按钮_销售员图 = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // 按钮_报价差额统计
            // 
            this.按钮_报价差额统计.Location = new System.Drawing.Point(12, 70);
            this.按钮_报价差额统计.Name = "按钮_报价差额统计";
            this.按钮_报价差额统计.Size = new System.Drawing.Size(75, 23);
            this.按钮_报价差额统计.TabIndex = 5;
            this.按钮_报价差额统计.Text = "报价差额";
            this.按钮_报价差额统计.UseVisualStyleBackColor = true;
            this.按钮_报价差额统计.Click += new System.EventHandler(this.按钮_报价差额统计_Click);
            // 
            // 按钮_各部门报表
            // 
            this.按钮_各部门报表.Location = new System.Drawing.Point(12, 41);
            this.按钮_各部门报表.Name = "按钮_各部门报表";
            this.按钮_各部门报表.Size = new System.Drawing.Size(75, 23);
            this.按钮_各部门报表.TabIndex = 4;
            this.按钮_各部门报表.Text = "各部门报表";
            this.按钮_各部门报表.UseVisualStyleBackColor = true;
            this.按钮_各部门报表.Click += new System.EventHandler(this.按钮_各部门报表_Click);
            // 
            // 按钮_销售员图
            // 
            this.按钮_销售员图.Location = new System.Drawing.Point(12, 12);
            this.按钮_销售员图.Name = "按钮_销售员图";
            this.按钮_销售员图.Size = new System.Drawing.Size(75, 23);
            this.按钮_销售员图.TabIndex = 3;
            this.按钮_销售员图.Text = "销售员图";
            this.按钮_销售员图.UseVisualStyleBackColor = true;
            this.按钮_销售员图.Click += new System.EventHandler(this.按钮_销售员图_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(110, 66);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(227, 96);
            this.label1.TabIndex = 5;
            this.label1.Text = "20230508 新厂数据库从阿里云换到移动云\r\n20230720 易捷修改数据库口令\r\n20231127 临海IP改为：36.137.213.189\r\n2024" +
    "1101 老厂改服务器\r\n20241224 温森三期改密码\r\n20250930 跳过出错数据\r\n20251220 新厂更换新系统\r\n20260130 新厂旧服务" +
    "器弃用";
            // 
            // 窗体_功能列表
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(349, 200);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.按钮_报价差额统计);
            this.Controls.Add(this.按钮_各部门报表);
            this.Controls.Add(this.按钮_销售员图);
            this.Name = "窗体_功能列表";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "易捷查询 20260304";
            this.Load += new System.EventHandler(this.窗体_功能列表_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        internal System.Windows.Forms.Button 按钮_报价差额统计;
        internal System.Windows.Forms.Button 按钮_各部门报表;
        internal System.Windows.Forms.Button 按钮_销售员图;
        private System.Windows.Forms.Label label1;
    }
}

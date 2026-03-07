namespace 易捷查询CSharp
{
    partial class 窗体_功能列表
    {
        /// <summary>
        /// 必需的设计器变量。
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 清理所有正在使用的资源。
        /// </summary>
        /// <param name="disposing">如果应释放托管资源，为 true；否则为 false。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows 窗体设计器生成的代码

        /// <summary>
        /// 设计器支持所需的方法 - 不要修改
        /// 使用代码编辑器修改此方法的内容。
        /// </summary>
        private void InitializeComponent()
        {
            this.按钮_各部门报表 = new System.Windows.Forms.Button();
            this.按钮_销售员图 = new System.Windows.Forms.Button();
            this.按钮_利润统计 = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.SuspendLayout();
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
            // 按钮_利润统计
            // 
            this.按钮_利润统计.Location = new System.Drawing.Point(12, 70);
            this.按钮_利润统计.Name = "按钮_利润统计";
            this.按钮_利润统计.Size = new System.Drawing.Size(75, 23);
            this.按钮_利润统计.TabIndex = 6;
            this.按钮_利润统计.Text = "利润统计";
            this.按钮_利润统计.UseVisualStyleBackColor = true;
            this.按钮_利润统计.Click += new System.EventHandler(this.按钮_利润统计_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(74, 170);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(263, 12);
            this.label1.TabIndex = 5;
            this.label1.Text = "20260307 增加利润统计功能，优化数据查询逻辑";
            // 
            // 窗体_功能列表
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(349, 200);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.按钮_利润统计);
            this.Controls.Add(this.按钮_各部门报表);
            this.Controls.Add(this.按钮_销售员图);
            this.Name = "窗体_功能列表";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "易捷查询 20260307";
            this.Load += new System.EventHandler(this.窗体_功能列表_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        internal System.Windows.Forms.Button 按钮_各部门报表;
        internal System.Windows.Forms.Button 按钮_销售员图;
        internal System.Windows.Forms.Button 按钮_利润统计;
        private System.Windows.Forms.Label label1;
    }
}


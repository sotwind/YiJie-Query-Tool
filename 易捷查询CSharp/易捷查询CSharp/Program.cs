using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace 易捷查询CSharp
{
    internal static class Program
    {
        /// <summary>
        /// 应用程序的主入口点。
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            模块_通用函数.查询箱型表();
            
            Application.Run(new 窗体_功能列表());
        }
    }
}

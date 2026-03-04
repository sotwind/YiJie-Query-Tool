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
            
            Application.Run(new 窗体_功能列表());
        }
    }
}

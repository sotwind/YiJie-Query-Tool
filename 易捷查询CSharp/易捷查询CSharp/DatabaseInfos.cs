using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Com.Ekyb.CrossFactoryOrder.Common
{
    public static class DatabaseInfos
    {
        static List<DatabaseInfo> _databaseInfos;

        static DatabaseInfos()
        {
            _databaseInfos = new List<DatabaseInfo>();
            //_databaseInfos.Add(new DatabaseInfo("新厂", "老系统", "serp.02.forestpacking.com", 1521, "dbms", "ejsh", "read", "ejsh.read"));
            _databaseInfos.Add(new DatabaseInfo("新厂新系统", "新系统", "36.134.7.141", 1521, "dbms", "ferp", "b0003", "kuke.b0003"));
            _databaseInfos.Add(new DatabaseInfo("老厂新系统", "新系统", "36.138.132.30", 1521, "dbms", "ferp", "read", "ejsh.read"));
            _databaseInfos.Add(new DatabaseInfo("临海", "老系统", "36.137.213.189", 1521, "dbms", "ejsh", "read", "ejsh.read"));
            // _databaseInfos.Add(new DatabaseInfo("温森新系统", "新系统", "db.05.forestpacking.com", 1521, "dbms", "ferp", "only", "b0003.only"));
            _databaseInfos.Add(new DatabaseInfo("温森新系统", "新系统", "db.05.forestpacking.com", 1521, "dbms", "ferp", "read", "ejsh.read"));
        }

        public static List<DatabaseInfo> GetDatabaseInfos()
        {
            return _databaseInfos;
        }
    }

    public class DatabaseInfo
    {
        public DatabaseInfo(string factoryName, string serverType, string serverName, int port, string serviceName, string dbName, string userName, string password)
        {
            FactoryName = factoryName ?? throw new ArgumentNullException(nameof(factoryName));
            ServerType = serverType ?? throw new ArgumentNullException(nameof(serverType));
            ServerName = serverName ?? throw new ArgumentNullException(nameof(serverName));
            Port = port;
            ServiceName = serviceName ?? throw new ArgumentNullException(nameof(serviceName));
            DbName = dbName ?? throw new ArgumentNullException(nameof(dbName));
            UserName = userName ?? throw new ArgumentNullException(nameof(userName));
            Password = password ?? throw new ArgumentNullException(nameof(password));
        }

        public string FactoryName { get; set; }

        public string ServerType { get; set; }
        public string ServerName { get; set; }
        public int Port { get; set; }
        public string ServiceName { get; set; }
        public string DbName { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }

        public string GetConnString()
        {
            return $"Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={ServerName})(PORT={Port}))(CONNECT_DATA=(SERVICE_NAME={ServiceName})));User Id={UserName};Password={Password}";
        }

    }

}

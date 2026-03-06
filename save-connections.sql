-- 保存所有数据库连接
-- 在 SQLcl 中执行: @save-connections.sql

-- 老厂新系统
conn -save laocang -savepwd read/ejsh.read@36.138.132.30:1521/dbms

-- 新厂新系统
conn -save xinchang -savepwd ferp/b0003@36.134.7.141:1521/dbms

-- 温森新系统
conn -save wensen -savepwd read/ejsh.read@db.05.forestpacking.com:1521/dbms

-- 临海老系统
conn -save linhai -savepwd read/ejsh.read@36.137.213.189:1521/dbms

-- 易捷集团
conn -save jituan -savepwd fgrp/kuke.fgrp@36.138.130.91:1521/dbms

-- 显示所有保存的连接
connmgr list

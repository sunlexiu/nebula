package com.slx.nebula.connection;

import com.slx.nebula.enums.DbTypeEnum;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class MySqlProvider implements DatabaseProvider {
	public DbTypeEnum type() {
		return DbTypeEnum.MYSQL;
	}

	public DataSource createDataSource(String host, int port, String database, String username, String password) {
		String db = (database == null || database.isBlank()) ? "" : ("/" + database);
		String url = "jdbc:mysql://" + host + ":" + port + db + "?useSSL=false&serverTimezone=UTC";
		HikariConfig cfg = new HikariConfig();
		cfg.setJdbcUrl(url);
		cfg.setUsername(username);
		cfg.setPassword(password);
		cfg.setMaximumPoolSize(5);
		cfg.setConnectionTimeout(10_000);
		return new HikariDataSource(cfg);
	}

	public Connection createConnection(String host, int port, String database, String username, String password) throws SQLException {
		String db = (database == null || database.isBlank()) ? "" : ("/" + database);
		String url = "jdbc:mysql://" + host + ":" + port + db + "?useSSL=false&serverTimezone=UTC";
		return DriverManager.getConnection(url, username, password);
	}
}
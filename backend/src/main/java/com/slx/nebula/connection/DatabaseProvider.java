package com.slx.nebula.connection;

import com.slx.nebula.enums.DbTypeEnum;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

public interface DatabaseProvider {
	DbTypeEnum type();

	DataSource createDataSource(String host, int port, String database, String username, String password);

	Connection createConnection(String host, int port, String database, String username, String password) throws SQLException;

	default void testConnection(String host, int port, String database, String username, String password) throws SQLException {
		try (Connection c = createConnection(host, port, database, username, password)) {
		}
	}

	default Map<String, Object> fetchFacts(Connection conn) throws SQLException {
		return Map.of();
	}
}
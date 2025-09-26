package com.slx.nebula.connection;

import com.slx.nebula.model.ConnectionConfig;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

public interface DatabaseProvider {
    boolean testConnection(ConnectionConfig config);
    DataSource createDataSource(ConnectionConfig config);
    Connection createConnection(ConnectionConfig config) throws SQLException;
    String type();
}

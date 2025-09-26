package com.slx.nebula.connection;

import com.slx.nebula.model.ConnectionConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.Getter;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Getter
public class Session {
    private final String editorId;
    private final ConnectionConfig config;
    private final DataSource dataSource;

    public Session(String editorId, ConnectionConfig config, DataSource ds) {
        this.editorId = editorId;
        this.config = config;
        this.dataSource = ds;
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public void close() {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            hikariDataSource.close();
        }
    }
}

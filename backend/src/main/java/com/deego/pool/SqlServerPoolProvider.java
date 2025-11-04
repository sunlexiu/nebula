package com.deego.pool;

import com.deego.model.Connection;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class SqlServerPoolProvider extends AbstractJdbcPoolProvider {
    @Override
    public HikariDataSource create(Connection conn, String dbName) {
        String url = "jdbc:sqlserver://" + conn.getHost() + ":" + conn.getPort() + ";databaseName=" + dbName;
        HikariConfig config = baseConfig(conn, "nebula-" + conn.getId() + "@" + dbName);
        config.setJdbcUrl(url);
        config.setUsername(conn.getUsername());
        config.setPassword(conn.getPassword());
        config.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        config.setConnectionTestQuery("SELECT 1");
        return new HikariDataSource(config);
    }
}
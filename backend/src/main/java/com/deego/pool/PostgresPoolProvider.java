package com.deego.pool;

import com.deego.model.Connection;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class PostgresPoolProvider extends AbstractJdbcPoolProvider {
    @Override
    public HikariDataSource create(Connection conn, String dbName) {
        String url = "jdbc:postgresql://" + conn.getHost() + ":" + conn.getPort() + "/" + dbName;
        HikariConfig config = baseConfig(conn, "nebula-" + conn.getId() + "@" + dbName);
        config.setJdbcUrl(url);
        config.setUsername(conn.getUsername());
        config.setPassword(conn.getPassword());
        config.setDriverClassName("org.postgresql.Driver");
        config.setConnectionTestQuery("SELECT 1");
        config.addDataSourceProperty("ApplicationName", "Nebula");
        config.addDataSourceProperty("reWriteBatchedInserts", "true");
        return new HikariDataSource(config);
    }
}
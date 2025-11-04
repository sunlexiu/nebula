package com.deego.pool;

import com.deego.model.Connection;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class OraclePoolProvider extends AbstractJdbcPoolProvider {
    @Override
    public HikariDataSource create(Connection conn, String dbName) {
        String url = "jdbc:oracle:thin:@" + conn.getHost() + ":" + conn.getPort() + "/" + dbName;
        HikariConfig config = baseConfig(conn, "nebula-" + conn.getId() + "@" + dbName);
        config.setJdbcUrl(url);
        config.setUsername(conn.getUsername());
        config.setPassword(conn.getPassword());
        config.setDriverClassName("oracle.jdbc.OracleDriver");
        config.setConnectionTestQuery("SELECT 1 FROM DUAL");
        return new HikariDataSource(config);
    }
}
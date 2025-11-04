package com.deego.pool;

import com.deego.model.Connection;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class MySqlPoolProvider extends AbstractJdbcPoolProvider {
    @Override
    public HikariDataSource create(Connection conn, String dbName) {
        String url = "jdbc:mysql://" + conn.getHost() + ":" + conn.getPort() + "/" + dbName + "?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC";
        HikariConfig config = baseConfig(conn, "nebula-" + conn.getId() + "@" + dbName);
        config.setJdbcUrl(url);
        config.setUsername(conn.getUsername());
        config.setPassword(conn.getPassword());
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setConnectionTestQuery("SELECT 1");
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "256");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");
        config.addDataSourceProperty("rewriteBatchedStatements", "true");
        return new HikariDataSource(config);
    }
}
package com.deego.pool;

import com.deego.model.Connection;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public abstract class AbstractJdbcPoolProvider implements PoolProvider<HikariDataSource> {

    protected HikariConfig baseConfig(Connection conn, String poolName) {
        HikariConfig config = new HikariConfig();
        config.setPoolName(poolName);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(0);
        config.setIdleTimeout(300_000L);
        config.setMaxLifetime(1_800_000L);
        config.setConnectionTimeout(30_000L);
        config.setInitializationFailTimeout(1L);
        return config;
    }

    @Override
    public String cacheKey(Connection conn, String dbName) {
        return conn.getId() + "@" + dbName;
    }

    @Override
    public void close(HikariDataSource handle) {
        if (handle != null && !handle.isClosed()) {
            handle.close();
        }
    }
}
package com.deego.manager;

import com.deego.enums.DatabaseType;
import com.deego.exec.DbExecutor;
import com.deego.exec.JdbcExecutor;
import com.deego.model.Connection;
import com.deego.pool.*;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.ObjectUtils;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConnectionManager {

    private final Map<String, Object> poolCache = new ConcurrentHashMap<>();
    private final Map<String, DbExecutor> execCache = new ConcurrentHashMap<>();

    private final Map<DatabaseType, PoolProvider<?>> providers = Map.of(
            DatabaseType.POSTGRESQL, new PostgresPoolProvider(),
            DatabaseType.MYSQL, new MySqlPoolProvider(),
            DatabaseType.SQLSERVER, new SqlServerPoolProvider(),
            DatabaseType.ORACLE, new OraclePoolProvider()
    );

    public DbExecutor acquireExecutor(Connection conn, String targetDb) {
        DatabaseType type = DatabaseType.fromValue(conn.getDbType());
        String db = ObjectUtils.isEmpty(targetDb) ? conn.getDatabase() : targetDb;
        PoolProvider<?> provider = providers.get(type);
        if (provider == null) {
            throw new IllegalArgumentException("No PoolProvider for dbType=" + type);
        }
        String key = provider.cacheKey(conn, db);

        return execCache.computeIfAbsent(key, k -> {
            Object handle = poolCache.computeIfAbsent(k, kk -> provider.create(conn, db));
            if (type.isRelational() && handle instanceof HikariDataSource ds) {
                JdbcTemplate jdbc = new JdbcTemplate(ds);
                return new JdbcExecutor(jdbc);
            }
            throw new IllegalStateException("Unsupported executor for dbType=" + type);
        });
    }

    public com.zaxxer.hikari.HikariDataSource createEphemeralJdbcDataSource(com.deego.model.Connection conn, String targetDb) {
        com.deego.enums.DatabaseType type = com.deego.enums.DatabaseType.fromValue(conn.getDbType());
        if (!type.isRelational()) {
            throw new com.deego.exception.BizException("Not a relational database: " + type);
        }
        String db = (targetDb == null || targetDb.isBlank()) ? conn.getDatabase() : targetDb;
        com.deego.pool.PoolProvider<?> provider = providers.get(type);
        if (provider == null) {
            throw new com.deego.exception.BizException("No PoolProvider for dbType=" + type);
        }
        Object handle = provider.create(conn, db);   // 不进 cache —— 纯临时
        if (handle instanceof com.zaxxer.hikari.HikariDataSource ds) {
            return ds;
        }
        throw new com.deego.exception.BizException("Unexpected handle type: " + handle.getClass().getName());
    }


    public void closeAllForConnection(String connId) {
        poolCache.keySet().removeIf(k -> {
            if (k.startsWith(connId + "@")) {
                Object h = poolCache.remove(k);
                execCache.remove(k);
                if (h instanceof HikariDataSource ds) {
                    ds.close();
                }
                return true;
            }
            return false;
        });
    }
}
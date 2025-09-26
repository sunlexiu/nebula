package com.slx.nebula.connection;

import com.slx.nebula.model.ConnectionConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Duration;

@Component("POSTGRESQL")
public class PostgresProvider implements DatabaseProvider {

    @Override
    public boolean testConnection(ConnectionConfig config) {
        try (Connection c = createConnection(config)) {
            return c.isValid(2);
        } catch (SQLException e) {
            return false;
        }
    }

    @Override
    public DataSource createDataSource(ConnectionConfig config) {
        HikariConfig hc = new HikariConfig();
        hc.setJdbcUrl(buildUrl(config));
        hc.setUsername(config.getUsername());
        hc.setPassword(config.getPassword());
        hc.setMaximumPoolSize(5);
        hc.setConnectionTimeout(Duration.ofSeconds(10).toMillis());
        return new HikariDataSource(hc);
    }

    @Override
    public Connection createConnection(ConnectionConfig config) throws SQLException {
        return DriverManager.getConnection(buildUrl(config), config.getUsername(), config.getPassword());
    }

    @Override
    public String type() { return "POSTGRESQL"; }

    private String buildUrl(ConnectionConfig cfg) {
        String db = (cfg.getDatabase() == null || cfg.getDatabase().isBlank()) ? "postgres" : cfg.getDatabase();
        return String.format("jdbc:postgresql://%s:%d/%s", cfg.getHost(), cfg.getPort() == null ? 5432 : cfg.getPort(), db);
    }
}

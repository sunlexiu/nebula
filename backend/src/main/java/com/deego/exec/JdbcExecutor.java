package com.deego.exec;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

public class JdbcExecutor implements DbExecutor {
    private final JdbcTemplate jdbc;

    public JdbcExecutor(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public JdbcTemplate jdbc() { return jdbc; }

    @Override
    public List<Map<String, Object>> queryMapForList(String sql) {
        return jdbc.queryForList(sql);
    }

    @Override
    public <T> List<T> queryForList(String templateOrSql, Class<T> clazz, Object... params) {
        return jdbc.queryForList(templateOrSql, clazz, params);
    }

    @Override
    public List<Map<String, Object>> queryMapForList(String sql, Object... params) {
        return jdbc.queryForList(sql, params);
    }

    @Override
    public int execute(String sql) {
        return jdbc.update(sql);
    }
}
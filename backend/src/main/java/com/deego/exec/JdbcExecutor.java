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
    public List<Map<String, Object>> queryForList(String sql) {
        return jdbc.queryForList(sql);
    }

    @Override
    public List<Map<String, Object>> queryForList(String sql, Object... params) {
        return jdbc.queryForList(sql, params);
    }

    @Override
    public int execute(String sql) {
        return jdbc.update(sql);
    }
}
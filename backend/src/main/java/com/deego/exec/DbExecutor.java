package com.deego.exec;

import java.util.List;
import java.util.Map;

public interface DbExecutor {
    List<Map<String, Object>> queryForList(String templateOrSql);
    List<Map<String, Object>> queryForList(String sql, Object... params);
    int execute(String templateOrSql);
}
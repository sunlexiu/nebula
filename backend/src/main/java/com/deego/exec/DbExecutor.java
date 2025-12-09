package com.deego.exec;

import java.util.List;
import java.util.Map;

public interface DbExecutor {
    List<Map<String, Object>> queryMapForList(String templateOrSql);
    <T> List<T> queryForList(String templateOrSql, Class<T> clazz, Object... params);
    List<Map<String, Object>> queryMapForList(String sql, Object... params);
    int execute(String templateOrSql);
}
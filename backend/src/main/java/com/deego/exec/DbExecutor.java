package com.deego.exec;

import java.util.List;
import java.util.Map;

public interface DbExecutor {
    List<Map<String, Object>> queryForList(String templateOrSql);
    int execute(String templateOrSql);
}
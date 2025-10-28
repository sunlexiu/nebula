package com.deego.utils;

import java.util.Map;

public class SqlUtils {
	public static String replacePlaceholders(String sql, Map<String, String> placeholders) {
		for (Map.Entry<String, String> entry : placeholders.entrySet()) {
			sql = sql.replace("{" + entry.getKey() + "}", entry.getValue());
		}
		return sql;
	}
}
package com.deego.enums;

/**
 * SQL 占位符枚举，用于 replacePlaceholders 方法。
 */
public enum PlaceholderType {
	SCHEMA_NAME("schemaName"),
	DB_NAME("dbName"),
	CONN_ID("connId");

	private final String key;

	PlaceholderType(String key) {
		this.key = key;
	}

	public String getKey() {
		return key;
	}

	public String getValue() {
		return "{" + key + "}";  // e.g., {schemaName}
	}
}
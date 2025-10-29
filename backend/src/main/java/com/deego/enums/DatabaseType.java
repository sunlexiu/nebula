package com.deego.enums;

/**
 * 数据库类型枚举，支持 YAML treeConfigs 扩展。
 */
public enum DatabaseType {
	POSTGRESQL("POSTGRESQL"),
	MYSQL("MYSQL"),
	SQLSERVER("SQLSERVER"),
	ORACLE("ORACLE");

	private final String value;

	DatabaseType(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	public static DatabaseType fromValue(String value) {
		for (DatabaseType type : values()) {
			if (type.value.equalsIgnoreCase(value)) {
				return type;
			}
		}
		throw new IllegalArgumentException("Unknown database type: " + value);
	}
}
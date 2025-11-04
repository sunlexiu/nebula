package com.deego.enums;

/**
 * 数据库类型枚举，携带驱动/健康检查等元信息；可扩展到非关系型（Mongo/Redis）。
 */
public enum DatabaseType {
	POSTGRESQL("POSTGRESQL", true, "org.postgresql.Driver", 5432, "SELECT 1"),
	MYSQL("MYSQL", true, "com.mysql.cj.jdbc.Driver", 3306, "SELECT 1"),
	SQLSERVER("SQLSERVER", true, "com.microsoft.sqlserver.jdbc.SQLServerDriver", 1433, "SELECT 1"),
	ORACLE("ORACLE", true, "oracle.jdbc.OracleDriver", 1521, "SELECT 1 FROM DUAL"),
	MONGODB("MONGODB", false, null, 27017, null),
	REDIS("REDIS", false, null, 6379, null);

	private final String value;
	private final boolean relational;
	private final String driverClass;
	private final int defaultPort;
	private final String testQuery;

	DatabaseType(String value, boolean relational, String driverClass, int defaultPort, String testQuery) {
		this.value = value;
		this.relational = relational;
		this.driverClass = driverClass;
		this.defaultPort = defaultPort;
		this.testQuery = testQuery;
	}

	public String getValue() { return value; }
	public boolean isRelational() { return relational; }
	public String getDriverClass() { return driverClass; }
	public int getDefaultPort() { return defaultPort; }
	public String getTestQuery() { return testQuery; }

	public static DatabaseType fromValue(String value) {
		for (DatabaseType type : values()) {
			if (type.value.equalsIgnoreCase(value)) {
				return type;
			}
		}
		throw new IllegalArgumentException("Unknown database type: " + value);
	}
}
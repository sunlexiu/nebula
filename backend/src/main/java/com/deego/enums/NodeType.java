package com.deego.enums;

/**
 * 节点类型枚举，基于 YAML levels/groupBy，支持路径匹配。
 */
public enum NodeType {
	FOLDER("folder"),
	CONNECTION("connection"),
	DATABASE("database"),
	SCHEMA("schema"),
	OBJECTS("objects"),
	TABLE_GROUP("table_group"),
	VIEW_GROUP("view_group"),
	FUNCTION_GROUP("function_group"),
	PUBLICATIONS("publications"),
	ROLES("roles");

	private final String value;

	NodeType(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	/**
	 * 判断 path 是否匹配当前类型（支持空 path 为 CONNECTION）。
	 */
	public boolean matches(String path) {
		return (path == null || path.isEmpty() || path.equals(value));
	}

	/**
	 * 从 path 解析类型（基于 segments[0]）。
	 */
	public static NodeType fromPath(String path) {
		if (path == null || path.isEmpty()) return CONNECTION;
		String[] segments = path.split("/");
		if (segments.length > 0) {
			for (NodeType type : values()) {
				if (type.getValue().equals(segments[0])) {
					return type;
				}
			}
		}
		return CONNECTION;  // 默认
	}
}
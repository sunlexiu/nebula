package com.deego.enums;

/**
 * 树路径类型枚举，基于 YAML levels 定义，避免魔法字符串。
 * 支持精确匹配或空 path。
 */
public enum TreePathType {
	CONNECTION("connection"),
	DATABASE("database"),
	SCHEMA("schema"),
	OBJECTS("objects");

	private final String value;

	TreePathType(String value) {
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
	 * 从 path 解析类型（简化：基于 segments[0]）。
	 */
	public static TreePathType fromPath(String path) {
		if (path == null || path.isEmpty()) return CONNECTION;
		String[] segments = path.split("/");
		if (segments.length > 0) {
			for (TreePathType type : values()) {
				if (type.getValue().equals(segments[0])) {
					return type;
				}
			}
		}
		return CONNECTION;
	}
}
package com.deego.metadata.postgresql;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author sunlexiu
 */
@Component
public class PgDatabaseExecutor {

	public String generateSql(String connId, Map<String, Object> param) {
		String mode = (String) param.get("mode");
		String databaseId = (String) param.get("databaseId");
		String name = (String) param.get("name");
		String owner = (String) param.get("owner");
		String encoding = (String) param.get("encoding");
		String template = (String) param.get("template");
		String collation = (String) param.get("collation");
		String ctype = (String) param.get("ctype");
		String tablespace = (String) param.get("tablespace");
		Boolean allowConnections = (Boolean) param.get("allowConnections");
		Integer connectionLimit = (Integer) param.get("connectionLimit");
		String comment = (String) param.get("comment");
		Boolean isTemplate = (Boolean) param.get("isTemplate");
		String localeProvider = (String) param.get("localeProvider");
		String icuLocale = (String) param.get("icuLocale");
		String icuRules = (String) param.get("icuRules");
		String extensions = (String) param.get("extensions");
		List<Map<String, Object>> rolePrivileges = (List<Map<String, Object>>) param.get("rolePrivileges");

		StringBuilder sqlBuilder = new StringBuilder();

		// 根据模式生成SQL
		if ("create".equals(mode)) {
			sqlBuilder.append("CREATE DATABASE ").append(quoteIdentifier(name));

			// 添加WITH子句选项
			List<String> options = new ArrayList<>();
			if (owner != null && !owner.isEmpty()) {
				options.add("OWNER = " + quoteIdentifier(owner));
			}
			if (template != null && !template.isEmpty()) {
				options.add("TEMPLATE = " + quoteIdentifier(template));
			}
			if (encoding != null && !encoding.isEmpty()) {
				options.add("ENCODING = " + quoteValue(encoding));
			}
			if (collation != null && !collation.isEmpty()) {
				options.add("LC_COLLATE = " + quoteValue(collation));
			}
			if (ctype != null && !ctype.isEmpty()) {
				options.add("LC_CTYPE = " + quoteValue(ctype));
			}
			if (tablespace != null && !tablespace.isEmpty()) {
				options.add("TABLESPACE = " + quoteIdentifier(tablespace));
			}
			if (allowConnections != null) {
				options.add("ALLOW_CONNECTIONS = " + allowConnections);
			}
			if (connectionLimit != null) {
				options.add("CONNECTION LIMIT = " + connectionLimit);
			}
			if (isTemplate != null) {
				options.add("IS_TEMPLATE = " + isTemplate);
			}

			if (!options.isEmpty()) {
				sqlBuilder.append(" WITH ");
				sqlBuilder.append(String.join(" \n    ", options));
			}
			sqlBuilder.append(";\n");

			// 添加注释
			if (comment != null && !comment.isEmpty()) {
				sqlBuilder.append("COMMENT ON DATABASE ").append(quoteIdentifier(name))
						  .append(" IS ").append(quoteValue(comment)).append(";\n");
			}

			// 添加扩展参数
			if (extensions != null && !extensions.isEmpty()) {
				String[] lines = extensions.split("\\r?\\n");
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty()) continue;
					if (line.contains("=")) {
						String[] kv = line.split("=", 2);
						String key = kv[0].trim();
						String value = kv[1].trim();
						sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name))
								  .append(" SET ").append(quoteIdentifier(key))
								  .append(" TO ").append(quoteValue(value)).append(";\n");
					}
				}
			}

			// 添加角色权限
			if (rolePrivileges != null) {
				for (Map<String, Object> priv : rolePrivileges) {
					String role = (String) priv.get("role");
					if (role == null || role.isEmpty()) continue;

					List<String> perms = new ArrayList<>();
					if (Boolean.TRUE.equals(priv.get("connect"))) perms.add("CONNECT");
					if (Boolean.TRUE.equals(priv.get("temp"))) perms.add("TEMP");
					if (Boolean.TRUE.equals(priv.get("create"))) perms.add("CREATE");

					if (!perms.isEmpty()) {
						sqlBuilder.append("GRANT ").append(String.join(", ", perms))
								  .append(" ON DATABASE ").append(quoteIdentifier(name))
								  .append(" TO ").append(quoteIdentifier(role));

						if (Boolean.TRUE.equals(priv.get("grantOption"))) {
							sqlBuilder.append(" WITH GRANT OPTION");
						}
						sqlBuilder.append(";\n");
					}
				}
			}
		}
		else if ("edit".equals(mode)) {
			sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name));

			List<String> alterOptions = new ArrayList<>();
			if (owner != null && !owner.isEmpty()) {
				alterOptions.add("OWNER TO " + quoteIdentifier(owner));
			}
			if (tablespace != null && !tablespace.isEmpty()) {
				alterOptions.add("SET TABLESPACE " + quoteIdentifier(tablespace));
			}

			if (!alterOptions.isEmpty()) {
				sqlBuilder.append(" \n    ");
				sqlBuilder.append(String.join("\n    ", alterOptions));
			}
			sqlBuilder.append(";\n");

			// 单独处理布尔属性
			if (allowConnections != null) {
				sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name))
						  .append(" ALLOW_CONNECTIONS ").append(allowConnections).append(";\n");
			}
			if (connectionLimit != null) {
				sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name))
						  .append(" CONNECTION LIMIT ").append(connectionLimit).append(";\n");
			}
			if (isTemplate != null) {
				sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name))
						  .append(" IS_TEMPLATE ").append(isTemplate).append(";\n");
			}

			// 更新注释
			if (comment != null) {
				if (comment.isEmpty()) {
					sqlBuilder.append("COMMENT ON DATABASE ").append(quoteIdentifier(name))
							  .append(" IS NULL;\n");
				} else {
					sqlBuilder.append("COMMENT ON DATABASE ").append(quoteIdentifier(name))
							  .append(" IS ").append(quoteValue(comment)).append(";\n");
				}
			}

			// 更新扩展参数
			if (extensions != null && !extensions.isEmpty()) {
				String[] lines = extensions.split("\\r?\\n");
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty()) continue;
					if (line.contains("=")) {
						String[] kv = line.split("=", 2);
						String key = kv[0].trim();
						String value = kv[1].trim();
						sqlBuilder.append("ALTER DATABASE ").append(quoteIdentifier(name))
								  .append(" SET ").append(quoteIdentifier(key))
								  .append(" TO ").append(quoteValue(value)).append(";\n");
					}
				}
			}

			// 更新角色权限
			if (rolePrivileges != null) {
				for (Map<String, Object> priv : rolePrivileges) {
					String role = (String) priv.get("role");
					if (role == null || role.isEmpty()) continue;

					// 先撤销所有权限
					sqlBuilder.append("REVOKE ALL ON DATABASE ").append(quoteIdentifier(name))
							  .append(" FROM ").append(quoteIdentifier(role)).append(";\n");

					// 再授予新权限
					List<String> perms = new ArrayList<>();
					if (Boolean.TRUE.equals(priv.get("connect"))) perms.add("CONNECT");
					if (Boolean.TRUE.equals(priv.get("temp"))) perms.add("TEMP");
					if (Boolean.TRUE.equals(priv.get("create"))) perms.add("CREATE");

					if (!perms.isEmpty()) {
						sqlBuilder.append("GRANT ").append(String.join(", ", perms))
								  .append(" ON DATABASE ").append(quoteIdentifier(name))
								  .append(" TO ").append(quoteIdentifier(role));

						if (Boolean.TRUE.equals(priv.get("grantOption"))) {
							sqlBuilder.append(" WITH GRANT OPTION");
						}
						sqlBuilder.append(";\n");
					}
				}
			}
		}

		return sqlBuilder.toString();
	}

	// 辅助方法：安全引用标识符
	private String quoteIdentifier(String identifier) {
		if (identifier == null) return "";
		return "\"" + identifier.replace("\"", "\"\"") + "\"";
	}

	// 辅助方法：安全引用值
	private String quoteValue(String value) {
		if (value == null) return "NULL";
		return "'" + value.replace("'", "''") + "'";
	}
}

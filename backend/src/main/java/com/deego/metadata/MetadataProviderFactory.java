package com.deego.metadata;

import com.deego.enums.DatabaseType;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * MetadataProvider 工厂
 * 和你现有的 PoolProvider 完全对称
 */
@Component
public class MetadataProviderFactory {

	private final Map<DatabaseType, MetadataProvider> providers = new HashMap<>();

	// 这里会由 Spring 自动注入所有实现类（后面我们加上 @Component）
	private final Map<String, MetadataProvider> beanMap;

	public MetadataProviderFactory(Map<String, MetadataProvider> beanMap) {
		this.beanMap = beanMap;
	}

	@PostConstruct
	public void init() {
		beanMap.forEach((beanName, provider) -> {
			// 通过实现类简单名推断数据库类型（也可以加 @Qualifier 更严谨）
			if (beanName.contains("PostgreSql")) {
				providers.put(DatabaseType.POSTGRESQL, provider);
			} else if (beanName.contains("MySql")) {
				providers.put(DatabaseType.MYSQL, provider);
			} else if (beanName.contains("SqlServer")) {
				providers.put(DatabaseType.SQLSERVER, provider);
			} else if (beanName.contains("Oracle")) {
				providers.put(DatabaseType.ORACLE, provider);
			}
		});
	}

	public MetadataProvider getProvider(String dbTypeValue) {
		DatabaseType type = DatabaseType.fromValue(dbTypeValue);
		MetadataProvider provider = providers.get(type);
		if (provider == null) {
			throw new UnsupportedOperationException("Unsupported database type for metadata: " + dbTypeValue);
		}
		return provider;
	}
}
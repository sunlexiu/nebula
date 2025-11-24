package com.deego.metadata;

import com.deego.enums.DatabaseType;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * MetadataProvider 工厂
 * 和你现有的 PoolProvider 完全对称
 */
@Component
public class MetadataProviderFactory {

	@Getter
	private final Map<DatabaseType, MetadataProvider> providers = new EnumMap<>(DatabaseType.class);

	public MetadataProviderFactory(List<MetadataProvider> providerList) {
		if (Objects.nonNull(providerList)) {
			providerList.forEach(v -> providers.put(v.dbType(), v));
		}
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
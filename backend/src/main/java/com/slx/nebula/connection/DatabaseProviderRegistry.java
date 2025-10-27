package com.slx.nebula.connection;

import com.slx.nebula.enums.DbTypeEnum;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class DatabaseProviderRegistry {
	private final Map<DbTypeEnum, DatabaseProvider> map = new HashMap<>();

	public DatabaseProviderRegistry() {
		register(new PostgresProvider());
		register(new MySqlProvider());
	}

	public void register(DatabaseProvider provider) {
		map.put(provider.type(), provider);
	}

	public DatabaseProvider of(DbTypeEnum type) {
		DatabaseProvider p = map.get(type);
		if (p == null)
			throw new IllegalArgumentException("Unsupported db type: " + type);
		return p;
	}
}
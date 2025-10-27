package com.slx.nebula.tree.config;

import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads DB tree YAML templates from classpath and user override directory. Compatible with SnakeYAML 2.x (uses LoaderOptions + Constructor(Class,
 * LoaderOptions)).
 */
@Component
public class TreeConfigLoader {

	private final Map<String, DbTreeTemplate> cache = new HashMap<>();

	public TreeConfigLoader() {
		// load built-ins
		loadFromClasspath("dbtree/postgresql.yaml");
		loadFromClasspath("dbtree/mysql.yaml");
		// then user overrides
		loadOverrides();
	}

	private Yaml yamlFor(Class<?> type) {
		LoaderOptions options = new LoaderOptions();
		// You can tune options here if needed, e.g. setMaxAliasesForCollections, etc.
		Constructor ctor = new Constructor(type, options);
		return new Yaml(ctor);
	}

	private void loadOverrides() {
		File dir = new File(System.getProperty("user.home"), ".nebula/tree");
		if (!dir.exists() || !dir.isDirectory()) {
			return;
		}
		File[] files = dir.listFiles((d, name) -> name.endsWith(".yaml") || name.endsWith(".yml"));
		if (files == null) {
			return;
		}
		for (File f : files) {
			try (FileInputStream fis = new FileInputStream(f)) {
				Yaml yaml = yamlFor(DbTreeTemplate.class);
				DbTreeTemplate t = yaml.load(fis);
				if (t != null && t.dbType != null) {
					cache.put(t.dbType.toUpperCase(), t);
				}
			} catch (Exception ignore) {
			}
		}
	}

	private void loadFromClasspath(String path) {
		try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
			if (is == null) {
				return;
			}
			Yaml yaml = yamlFor(DbTreeTemplate.class);
			DbTreeTemplate t = yaml.load(is);
			if (t != null && t.dbType != null) {
				cache.put(t.dbType.toUpperCase(), t);
			}
		} catch (Exception ignore) {
		}
	}

	public DbTreeTemplate get(String dbType) {
		return cache.get(dbType.toUpperCase());
	}
}

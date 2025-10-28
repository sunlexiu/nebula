package com.deego.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

@Component
public class TreeConfigLoader {
	@Value("${deego.tree-config}")
	private Resource configResource;

	@Getter
	private TreeConfig treeConfig;

	@PostConstruct
	public void loadConfig() {
		Yaml yaml = new Yaml();
		try (InputStream inputStream = configResource.getInputStream()) {
			Map<String, Object> raw = yaml.load(inputStream);
			treeConfig = new TreeConfig();
			treeConfig.setTreeConfigs((Map<String, DbConfig>) raw.get("treeConfigs"));
			System.out.println("Tree config loaded: " + treeConfig.getTreeConfigs().keySet());
		} catch (IOException e) {
			throw new RuntimeException("Failed to load tree-config.yml", e);
		}
	}

	public DbConfig getDbConfig(String dbType) {
		return treeConfig.getTreeConfigs().get(dbType);
	}
}
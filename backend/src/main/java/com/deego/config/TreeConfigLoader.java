package com.deego.config;

import com.deego.exception.BizException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * YAML 配置加载器，使用 Jackson YamlMapper 自动映射到 POJO。
 */
@Component
@Slf4j
public class TreeConfigLoader {

	@Value("${deego.tree-config}")
	private Resource configResource;

	@Getter
	private TreeConfig treeConfig;

	@PostConstruct
	public void loadConfig() {
		YAMLMapper yamlMapper = new YAMLMapper(new YAMLFactory());
		try {
			// 直接反序列化为 TreeConfig POJO
			treeConfig = yamlMapper.readValue(configResource.getInputStream(), TreeConfig.class);
			log.info("Tree config loaded: {}", treeConfig.getTreeConfigs().keySet());
		} catch (JsonMappingException e) {
			throw new BizException(e);
		} catch (IOException e) {
			log.error("Failed to load tree-config.yml", e);
			throw new BizException(e);
		}
	}

	public DbConfig getDbConfig(String dbType) {
		return treeConfig.getTreeConfigs().get(dbType);
	}
}
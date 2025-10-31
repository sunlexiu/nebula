package com.deego.config;

import com.deego.exception.BizException;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Slf4j
@Component
public class TreeConfigLoader {

    @Value("classpath:config/tree-config.yml")
    private Resource configResource;

    @Getter
    private TreeConfig treeConfig;

    @PostConstruct
    public void init() {
        try {
            YAMLMapper mapper = new YAMLMapper(new YAMLFactory());
            this.treeConfig = mapper.readValue(configResource.getInputStream(), TreeConfig.class);
            log.info("Loaded tree config keys: {}", treeConfig.getTreeConfigs().keySet());
        } catch (IOException e) {
            throw new BizException("Failed to load tree-config.yml", e);
        }
    }

    public DbConfig getDbConfig(String dbType) {
        if (treeConfig == null || treeConfig.getTreeConfigs() == null) return null;
        return treeConfig.getTreeConfigs().get(dbType);
    }
}

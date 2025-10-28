package com.deego.config;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class TreeConfig {
	private Map<String, DbConfig> treeConfigs;
}
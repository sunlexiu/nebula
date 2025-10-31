package com.deego.config;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class NodeConfig extends BaseNodeConfig {
	private String parent;
	private boolean virtual;
	private Map<String, String> children;
	private String sqlQuery;
}
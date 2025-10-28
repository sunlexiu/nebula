package com.deego.config;

import lombok.Data;

@Data
public class GroupByConfig {
	private String type;
	private String label;
	private String icon;
	private String sqlQuery;
	private Actions actions;
	private ChildConfig childConfig;
}
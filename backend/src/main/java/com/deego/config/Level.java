package com.deego.config;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class Level {
	private String type;
	private String label;
	private String icon;
	private String sqlQuery;
	private Actions actions;
	private String nextLevel;
	private Map<String, GroupByConfig> groupBy;
}
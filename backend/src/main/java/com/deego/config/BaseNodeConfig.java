package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class BaseNodeConfig {
	private String type;
	private String label;
	private String icon;
	private Integer position;
	private Actions actions;
	private String nextLevel;
}
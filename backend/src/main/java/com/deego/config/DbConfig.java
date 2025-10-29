package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;  // 改为 Map

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DbConfig {
	@JsonProperty("icon")
	private String icon;

	@JsonProperty("levels")
	private List<Level> levels;

	@JsonProperty("extraLevels")
	private Map<String, ExtraLevel> extraLevels;
}
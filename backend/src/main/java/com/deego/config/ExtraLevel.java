package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExtraLevel {
	@JsonProperty("type")
	private String type;

	@JsonProperty("label")
	private String label;

	@JsonProperty("icon")
	private String icon;

	@JsonProperty("sqlQuery")
	private String sqlQuery;

	@JsonProperty("actions")
	private Actions actions;

	@JsonProperty("position")
	private String position;
}
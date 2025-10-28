package com.deego.config;

import lombok.Data;

@Data
public class ExtraLevel {
	private String type;
	private String label;
	private String icon;
	private String sqlQuery;
	private Actions actions;
	private String position;
}
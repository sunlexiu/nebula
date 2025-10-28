package com.deego.config;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DbConfig {
	private String icon;
	private List<Level> levels;
	private List<ExtraLevel> extraLevels;
}
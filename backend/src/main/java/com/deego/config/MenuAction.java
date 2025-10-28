package com.deego.config;

import lombok.Data;

@Data
public class MenuAction {
	private String label;
	private String icon;
	private String handler;
	private String type; // separator
	private String variant; // danger
}
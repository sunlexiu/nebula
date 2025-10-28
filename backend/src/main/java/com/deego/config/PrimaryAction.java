package com.deego.config;

import lombok.Data;

@Data
public class PrimaryAction {
	private String label;
	private String icon;
	private String handler;
}
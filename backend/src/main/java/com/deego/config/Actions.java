package com.deego.config;

import lombok.Data;
import java.util.List;

@Data
public class Actions {
	private PrimaryAction primary;
	private List<MenuAction> menu;
}
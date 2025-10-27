package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfigData {
	@JsonAlias({"folders", "items", "roots"})
	public List<ConfigItem> roots = new ArrayList<>();
}
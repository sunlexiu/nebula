package com.slx.nebula.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
public class ConfigData {
    private List<ConfigItem> roots = new ArrayList<>();
}
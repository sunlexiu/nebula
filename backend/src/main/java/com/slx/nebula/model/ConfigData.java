package com.slx.nebula.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
public class ConfigData {
    private List<Folder> folders = new ArrayList<>();
    private List<ConnectionConfig> connections = new ArrayList<>();
}

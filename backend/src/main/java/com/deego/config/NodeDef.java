package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.LinkedHashMap;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NodeDef {
    @JsonProperty("parent")     private String parent;
    @JsonProperty("virtual")    private boolean virtual;
    @JsonProperty("type")       private String type;
    @JsonProperty("label")      private String label;
    @JsonProperty("icon")       private String icon;
    @JsonProperty("position")   private Integer position;
    @JsonProperty("children")   private LinkedHashMap<String, String> children;
    @JsonProperty("nextLevel")  private String nextLevel;
    @JsonProperty("sqlQuery")   private String sqlQuery;
    @JsonProperty("actions")    private Actions actions;
}

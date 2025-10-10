package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonTypeName;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 树节点：文件夹，可以包含 children（Folder 或 ConnectionConfig）
 */
@JsonTypeName("FOLDER")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Folder extends ConfigItem {

    private List<ConfigItem> children = new ArrayList<>();

    @Override
    public String getType() {
        return "folder";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Folder)) return false;
        Folder folder = (Folder) o;
        return Objects.equals(id, folder.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }
}


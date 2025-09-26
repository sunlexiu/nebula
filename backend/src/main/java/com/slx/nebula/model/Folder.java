package com.slx.nebula.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Folder {
    private String id;
    private String name;
    private String parentId;


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Folder folder)) {
            return false;
        }
        return Objects.equals(id, folder.id);
    }
    @Override
    public int hashCode() { return Objects.hash(id); }
}

package com.slx.nebula.model;

import lombok.Getter;
import lombok.Setter;

/**
 * @author sunlexiu
 */
@Setter
@Getter
public class MoveNodeReq {
    public String sourceId;
    public String targetParentId;
}
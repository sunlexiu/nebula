package com.slx.nebula.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @author sunlexiu
 */
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Wrapper<T> {
    private T data;
}

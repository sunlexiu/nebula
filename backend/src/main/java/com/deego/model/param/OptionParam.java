package com.deego.model.param;

import com.deego.model.pgsql.PgOptionTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

/**
 * @author sunlexiu
 */

@Getter
@Setter
public class OptionParam {
	private Set<PgOptionTypeEnum> types;
	private String param1;
}
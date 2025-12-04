package com.deego.model.pgsql;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * @author sunlexiu
 */
@Setter
@Getter
public class PgOption implements Option {

	private List<String> encodings;

	private List<String> templates;

	private List<String> tablespaces;

	private List<String> roles;
}

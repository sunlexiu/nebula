package com.deego.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 业务异常
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BizException extends RuntimeException {
	private final String code;

	public BizException(String message) {
		super(message);
		this.code = "BIZ_ERROR";
	}

	public BizException(String code, String message) {
		super(message);
		this.code = code;
	}

	public BizException(Throwable cause) {
		super(cause);
		this.code = "BIZ_ERROR";
	}

	public BizException(String code, String message, Throwable cause) {
		super(message, cause);
		this.code = code;
	}

}
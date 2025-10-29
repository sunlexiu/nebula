package com.deego.common;

/**
 * 错误码枚举
 */
public enum ErrorCode {
	SUCCESS("200", "成功"),
	SYSTEM_ERROR("500", "系统错误"),
	PARAM_ERROR("400", "参数错误"),
	NOT_FOUND("404", "资源不存在");

	private final String code;
	private final String message;

	ErrorCode(String code, String message) {
		this.code = code;
		this.message = message;
	}

	public String getCode() {
		return code;
	}

	public String getMessage() {
		return message;
	}
}
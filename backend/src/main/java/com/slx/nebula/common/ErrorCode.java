package com.slx.nebula.common;

import lombok.Getter;

@Getter
public enum ErrorCode {
	SUCCESS(0, "success"),
	SYSTEM_ERROR(500, "system error"),
	PARAM_ERROR(400, "param error"),
	BUSINESS_ERROR(1001, "business error");
	private final int code;
	private final String message;

	ErrorCode(int code, String message) {
		this.code = code;
		this.message = message;
	}
}
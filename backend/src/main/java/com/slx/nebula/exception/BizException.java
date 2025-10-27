package com.slx.nebula.exception;

import com.slx.nebula.common.ErrorCode;
import lombok.Getter;

/**
 * 自定义业务异常
 */
@Getter
public class BizException extends RuntimeException {

	private final int code;

	public BizException(String message) {
		super(message);
		this.code = ErrorCode.BUSINESS_ERROR.getCode();
	}

	public BizException(ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.code = errorCode.getCode();
	}

	public BizException(ErrorCode errorCode, String detailMessage) {
		super(detailMessage);
		this.code = errorCode.getCode();
	}

	public BizException(Throwable throwable) {
		super(throwable);
		this.code = ErrorCode.BUSINESS_ERROR.getCode();
	}
}

package com.slx.nebula.exception;

import com.slx.nebula.common.ApiResponse;
import com.slx.nebula.common.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
	@ExceptionHandler(BizException.class)
	public ApiResponse<?> biz(BizException e) {
		return ApiResponse.fail(e.getCode(), e.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ApiResponse<?> valid(MethodArgumentNotValidException e) {
		return ApiResponse.fail(ErrorCode.PARAM_ERROR.getCode(), e.getMessage());
	}

	@ExceptionHandler(Exception.class)
	public ApiResponse<?> any(Exception e) {
		log.error("系统异常", e);
		return ApiResponse.fail(ErrorCode.SYSTEM_ERROR.getCode(), e.getMessage());
	}
}
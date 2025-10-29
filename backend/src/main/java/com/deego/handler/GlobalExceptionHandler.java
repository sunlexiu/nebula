package com.deego.handler;

import com.deego.common.ApiResponse;
import com.deego.exception.BizException;
import com.deego.common.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.sql.SQLException;

/**
 * 全局异常处理器
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(BizException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ResponseEntity<ApiResponse<?>> handleBizException(BizException e) {
		ApiResponse<?> response = ApiResponse.error(e.getCode(), e.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}

	@ExceptionHandler(SQLException.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ResponseEntity<ApiResponse<?>> handleSQLException(SQLException e) {
		ApiResponse<?> response = ApiResponse.error(ErrorCode.SYSTEM_ERROR.getCode(), "数据库操作失败: " + e.getMessage());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
	}

	@ExceptionHandler(RuntimeException.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ResponseEntity<ApiResponse<?>> handleRuntimeException(RuntimeException e) {
		log.error("RuntimeException: ", e);
		ApiResponse<?> response = ApiResponse.error(ErrorCode.SYSTEM_ERROR.getCode(), e.getMessage());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ResponseEntity<ApiResponse<?>> handleGenericException(Exception e) {
		log.error("Exception: ", e);
		ApiResponse<?> response = ApiResponse.error(ErrorCode.SYSTEM_ERROR.getCode(), "系统内部错误");
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
	}
}
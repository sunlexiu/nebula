package com.slx.nebula.exception;

import com.slx.nebula.common.ApiResponse;
import com.slx.nebula.common.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


/**
 * 全局异常统一处理
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 处理自定义业务异常
     */
    @ExceptionHandler(BizException.class)
    public ApiResponse<?> handleBizException(BizException e, HttpServletResponse response) {
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value()); // HTTP 500
        return ApiResponse.error(e.getCode(), e.getMessage());
    }

    /**
     * 处理参数校验异常（例如 @Valid 失败）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> handleValidationException(MethodArgumentNotValidException e, HttpServletResponse response) {
        response.setStatus(HttpStatus.BAD_REQUEST.value()); // HTTP 400
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ApiResponse.error(ErrorCode.PARAM_ERROR.getCode(), message);
    }

    /**
     * 兜底的系统异常
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e, HttpServletResponse response) {
        log.error("系统异常", e);
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value()); // HTTP 500
        return ApiResponse.error(ErrorCode.SYSTEM_ERROR.getCode(), e.getMessage());
    }
}

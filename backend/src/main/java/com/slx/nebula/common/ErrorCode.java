package com.slx.nebula.common;

import lombok.Getter;

/**
 * 全局错误码定义
 */
@Getter
public enum ErrorCode {
    SUCCESS(0, "success"),

    // 通用错误
    SYSTEM_ERROR(1000, "系统异常"),
    PARAM_ERROR(1001, "参数错误"),
    UNAUTHORIZED(1002, "未授权访问"),
    FORBIDDEN(1003, "无权限操作"),
    NOT_FOUND(1004, "资源不存在"),

    // 业务错误
    BUSINESS_ERROR(2000, "业务异常");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}

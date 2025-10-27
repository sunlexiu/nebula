package com.slx.nebula.common;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ApiResponse<T> {
	private int code;
	private String message;
	private T data;

	public ApiResponse() {
	}

	public ApiResponse(int code, String message, T data) {
		this.code = code;
		this.message = message;
		this.data = data;
	}

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(0, "success", data);
	}

	public static <T> ApiResponse<T> fail(int code, String message) {
		return new ApiResponse<>(code, message, null);
	}

	public int getCode() {
		return code;
	}

	public void setCode(int c) {
		this.code = c;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String m) {
		this.message = m;
	}

	public T getData() {
		return data;
	}

	public void setData(T d) {
		this.data = d;
	}
}
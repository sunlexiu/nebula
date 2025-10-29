package com.deego.common;

import lombok.Data;

import java.time.Instant;

/**
 * 统一 API 响应包装。
 */
@Data
public class ApiResponse<T> {
	/* getters / setters */
	private boolean success;
	private String code;
	private String message;
	private String path;
	private String timestamp;
	private T data;

	public static <T> ApiResponse<T> ok(T data) {
		return ok(data, "OK");
	}

	public static <T> ApiResponse<T> ok(T data, String message) {
		ApiResponse<T> r = new ApiResponse<>();
		r.success = true;
		r.code = "OK";
		r.message = message;
		r.timestamp = Instant.now().toString();
		r.data = data;
		return r;
	}

	public static <T> ApiResponse<T> error(String code, String message) {
		ApiResponse<T> r = new ApiResponse<>();
		r.success = false;
		r.code = code;
		r.message = message;
		r.timestamp = Instant.now().toString();
		return r;
	}

	public static <T> Builder<T> builder() {
		return new Builder<>();
	}

	public static class Builder<T> {
		private final ApiResponse<T> r = new ApiResponse<>();

		public Builder<T> success(boolean v) {
			r.success = v;
			return this;
		}

		public Builder<T> code(String v) {
			r.code = v;
			return this;
		}

		public Builder<T> message(String v) {
			r.message = v;
			return this;
		}

		public Builder<T> path(String v) {
			r.path = v;
			return this;
		}

		public Builder<T> timestamp(String v) {
			r.timestamp = v;
			return this;
		}

		public Builder<T> data(T v) {
			r.data = v;
			return this;
		}

		public ApiResponse<T> build() {
			return r;
		}
	}

}

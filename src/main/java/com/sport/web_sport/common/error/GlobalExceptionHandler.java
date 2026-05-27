package com.sport.web_sport.common.error;

import com.sport.web_sport.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
    private static final String ADMIN_REQUIRED_MESSAGE = "관리자 권한이 필요합니다.";

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        if (LOGIN_REQUIRED_MESSAGE.equals(e.getMessage())) {
            return jsonError(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
        if (ADMIN_REQUIRED_MESSAGE.equals(e.getMessage())) {
            return jsonError(HttpStatus.FORBIDDEN, e.getMessage());
        }
        return jsonError(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("유효성 검증에 실패했습니다.");
        return jsonError(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return jsonError(HttpStatus.BAD_REQUEST, "잘못된 파라미터: " + e.getName());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException e) {
        return jsonError(HttpStatus.BAD_REQUEST, "필수 파라미터 누락: " + e.getParameterName());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException e) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String msg = e.getReason() != null ? e.getReason() : e.getMessage();
        return jsonError(status, msg);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception e) {
        String msg = e.getMessage() == null ? "Internal error" : e.getMessage();
        return jsonError(HttpStatus.INTERNAL_SERVER_ERROR, msg);
    }

    private static ResponseEntity<ApiResponse<Void>> jsonError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }
}

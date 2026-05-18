package com.sport.web_sport.common.error;

import com.sport.web_sport.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
    private static final String ADMIN_REQUIRED_MESSAGE = "관리자 권한이 필요합니다.";

    @ExceptionHandler(BusinessException.class)
    public Object handleBusiness(BusinessException e, HttpServletRequest request, Model model) {
        if (LOGIN_REQUIRED_MESSAGE.equals(e.getMessage())) {
            return isApi(request)
                    ? jsonError(HttpStatus.UNAUTHORIZED, e.getMessage())
                    : "redirect:/login";
        }
        if (ADMIN_REQUIRED_MESSAGE.equals(e.getMessage())) {
            return isApi(request)
                    ? jsonError(HttpStatus.FORBIDDEN, e.getMessage())
                    : "redirect:/login";
        }
        return errorResponse(request, model, HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Object handleValidation(MethodArgumentNotValidException e,
                                   HttpServletRequest request,
                                   Model model) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("유효성 검증에 실패했습니다.");
        return errorResponse(request, model, HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public Object handleTypeMismatch(MethodArgumentTypeMismatchException e,
                                     HttpServletRequest request,
                                     Model model) {
        return errorResponse(request, model, HttpStatus.BAD_REQUEST,
                "잘못된 파라미터: " + e.getName());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Object handleMissingParam(MissingServletRequestParameterException e,
                                     HttpServletRequest request,
                                     Model model) {
        return errorResponse(request, model, HttpStatus.BAD_REQUEST,
                "필수 파라미터 누락: " + e.getParameterName());
    }

    @ExceptionHandler(Exception.class)
    public Object handleAll(Exception e, HttpServletRequest request, Model model) {
        String msg = e.getMessage() == null ? "Internal error" : e.getMessage();
        return errorResponse(request, model, HttpStatus.INTERNAL_SERVER_ERROR, msg);
    }

    private Object errorResponse(HttpServletRequest request, Model model,
                                 HttpStatus status, String message) {
        if (isApi(request)) {
            return jsonError(status, message);
        }
        model.addAttribute("error", message);
        model.addAttribute("status", status.value());
        return "error/error";
    }

    private static ResponseEntity<ApiResponse<Void>> jsonError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }

    private static boolean isApi(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri != null && uri.startsWith("/api/");
    }
}

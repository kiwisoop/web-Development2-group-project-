package com.sport.web_sport.common.error;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}

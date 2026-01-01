package com.lunfit.authservice.exception;

public class VerificationRequiredException extends RuntimeException {
    public VerificationRequiredException(String message) {
        super(message);
    }
}

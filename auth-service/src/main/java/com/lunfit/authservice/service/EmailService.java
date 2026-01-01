package com.lunfit.authservice.service;

import com.lunfit.authservice.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.from}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendVerificationEmail(User user, String token) {
        log.info("sendEmailAsync");
        try {
            String verificationUrl = baseUrl + "/api/v1/auth/verify?token=" + token;

            Context context = new Context();
            context.setVariable("verificationUrl", verificationUrl);

            String htmlContent = templateEngine.process("verification-email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Verify Your Email - LunFit");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email sent to: {}", user.getEmail());

            return CompletableFuture.completedFuture(null);
        } catch (MailException | MessagingException e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
}

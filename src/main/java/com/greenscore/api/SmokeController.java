package com.greenscore.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Initial empty controller to verify Spring Boot setup.
 */
@RestController
@RequestMapping("/api/health")
public class SmokeController {

    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "UP", "app", "Green Building Certification Scorer");
    }
}

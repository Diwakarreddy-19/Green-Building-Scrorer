package com.greenscore.standard;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Registry and Strategy Factory for green building certification standards.
 */
@Component
public class StandardRegistry {

    private final Map<String, CertificationStandard> standards = new LinkedHashMap<>();

    public StandardRegistry() {
        register(new GrihaStandard());
        register(new IgbcStandard());
    }

    public void register(CertificationStandard standard) {
        if (standard != null) {
            standards.put(standard.getId().toUpperCase(), standard);
        }
    }

    public Optional<CertificationStandard> findStandard(String standardId) {
        if (standardId == null || standardId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(standards.get(standardId.trim().toUpperCase()));
    }

    public CertificationStandard getRequiredStandard(String standardId) {
        return findStandard(standardId).orElseThrow(() ->
                new IllegalArgumentException("Unknown certification standard: '" + standardId +
                        "'. Supported standards: " + getAvailableStandardIds()));
    }

    public Collection<CertificationStandard> getAllStandards() {
        return Collections.unmodifiableCollection(standards.values());
    }

    public Collection<String> getAvailableStandardIds() {
        return Collections.unmodifiableSet(standards.keySet());
    }
}

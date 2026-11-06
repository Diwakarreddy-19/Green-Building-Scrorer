package com.greenscore.model;

/**
 * Supported building typologies for certification scoring.
 * Benchmark Energy Performance Index (EPI in kWh/m2/yr) is tailored per typology.
 */
public enum BuildingType {
    OFFICE("Commercial Office", 140.0, "Standard commercial office workspaces and IT parks"),
    RESIDENTIAL("Residential Complex", 50.0, "Multi-dwelling residential housing and apartments"),
    COMMERCIAL("Retail & Shopping Mall", 200.0, "Retail spaces, shopping centers, and hypermarkets"),
    INSTITUTIONAL("Educational & Institutional", 90.0, "Schools, colleges, universities, and research institutes"),
    HEALTHCARE("Hospital & Healthcare", 250.0, "Hospitals, medical centers, and care facilities");

    private final String displayName;
    private final double benchmarkEpiKwhPerM2;
    private final String description;

    BuildingType(String displayName, double benchmarkEpiKwhPerM2, String description) {
        this.displayName = displayName;
        this.benchmarkEpiKwhPerM2 = benchmarkEpiKwhPerM2;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getBenchmarkEpiKwhPerM2() {
        return benchmarkEpiKwhPerM2;
    }

    public String getDescription() {
        return description;
    }
}

package com.greenscore.model;

/**
 * Core sustainability categories evaluated by green building rating systems.
 */
public enum Category {
    ENERGY("Energy Efficiency", "Renewable energy, efficient systems, and reduced demand"),
    WATER("Water Conservation", "Rainwater harvesting, low-flow plumbing, and wastewater recycling"),
    MATERIALS("Sustainable Materials", "Recycled content, regional materials, and low-emitting finishes"),
    WASTE("Waste Management", "Construction waste diversion, organic composting, and safe disposal");

    private final String displayName;
    private final String description;

    Category(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}

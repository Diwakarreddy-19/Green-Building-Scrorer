package com.greenscore.standard;

import com.greenscore.engine.BooleanCriterion;
import com.greenscore.engine.Criterion;
import com.greenscore.engine.PercentageCriterion;
import com.greenscore.engine.Tier;
import com.greenscore.engine.TieredCriterion;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP Strategy Implementation:
 * IGBC (Indian Green Building Council) Standard.
 * Emphasizes water conservation, sustainable building materials, and occupant well-being.
 *
 * Weight Distribution (Total 100):
 * - Energy: 26
 * - Water: 28 (higher emphasis on water stewardship)
 * - Materials: 28 (higher emphasis on circular and low-carbon materials)
 * - Waste: 18
 */
public class IgbcStandard implements CertificationStandard {

    public static final String ID = "IGBC";
    public static final String DISPLAY_NAME = "IGBC (Indian Green Building Council)";
    public static final String DESCRIPTION = "Pioneering Indian rating system emphasizing water neutrality, circular building materials, and environmental stewardship.";

    // Illustrative rating bands (constants labeled illustrative, not official)
    public static final List<RatingBand> RATING_BANDS = List.of(
            new RatingBand("PLATINUM", "Platinum (IGBC)", 90.0, 100.0, "World Class Green Building Leadership (Illustrative, not official)"),
            new RatingBand("GOLD", "Gold (IGBC)", 80.0, 89.9, "National Benchmark Environmental Excellence (Illustrative, not official)"),
            new RatingBand("SILVER", "Silver (IGBC)", 70.0, 79.9, "Outstanding Green Building Performance (Illustrative, not official)"),
            new RatingBand("CERTIFIED", "Certified (IGBC)", 60.0, 69.9, "Best Practice Green Certification (Illustrative, not official)"),
            new RatingBand("UNCERTIFIED", "Uncertified", 0.0, 59.9, "Below 60-point certification threshold - Improvement Required (Illustrative, not official)")
    );

    private static final Map<Category, Double> WEIGHTS;

    static {
        Map<Category, Double> w = new LinkedHashMap<>();
        w.put(Category.ENERGY, 26.0);
        w.put(Category.WATER, 28.0);
        w.put(Category.MATERIALS, 28.0);
        w.put(Category.WASTE, 18.0);
        WEIGHTS = Collections.unmodifiableMap(w);
    }

    @Override
    public String getId() {
        return ID;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    @Override
    public String getDescription() {
        return DESCRIPTION;
    }

    @Override
    public Map<Category, Double> getCategoryWeights() {
        return WEIGHTS;
    }

    @Override
    public List<RatingBand> getRatingBands() {
        return RATING_BANDS;
    }

    @Override
    public RatingBand resolveRatingBand(double totalScore) {
        for (RatingBand band : RATING_BANDS) {
            if (band.contains(totalScore)) {
                return band;
            }
        }
        return totalScore >= 60.0 ? RATING_BANDS.get(0) : RATING_BANDS.get(RATING_BANDS.size() - 1);
    }

    @Override
    public List<Criterion> getCriteria(BuildingType buildingType) {
        BuildingType type = buildingType != null ? buildingType : BuildingType.OFFICE;
        List<Criterion> list = new ArrayList<>();

        // 1. ENERGY (Total 26)
        List<Tier> epiTiers = List.of(
                new Tier("EXCEED_30", "≥ 30% reduction vs benchmark EPI", 30.0, 9.0, "Exceptional building envelope and high COP HVAC systems"),
                new Tier("EXCEED_20", "20% - 29.9% reduction vs benchmark EPI", 20.0, 6.0, "High efficiency building envelope"),
                new Tier("EXCEED_10", "10% - 19.9% reduction vs benchmark EPI", 10.0, 3.0, "Moderate energy optimization"),
                new Tier("BASELINE", "< 10% reduction (Standard baseline)", 0.0, 0.0, "Standard baseline compliance only")
        );
        String epiHint = String.format("%s benchmark is %.0f kWh/m²/year. Select anticipated or measured EPI reduction.",
                type.getDisplayName(), type.getBenchmarkEpiKwhPerM2());

        list.add(new TieredCriterion(
                "energy_epi",
                "Energy Performance Index (EPI) vs Benchmark",
                Category.ENERGY,
                9.0,
                epiTiers,
                "Improve building envelope insulation, install low-e glazing, and optimize chiller plant efficiency.",
                epiHint
        ));

        list.add(new PercentageCriterion(
                "energy_renewable",
                "Renewable Energy Share (% of total building demand)",
                Category.ENERGY,
                7.0,
                0.0,
                30.0,
                "Install on-site solar photovoltaic panels or wheel green power to offset at least 30% of energy consumption.",
                "Target: ≥ 30% of total electrical demand offset via solar PV or wind."
        ));

        list.add(new PercentageCriterion(
                "energy_lighting",
                "Efficient Lighting (% of total fixture lumens using LED/high-efficacy)",
                Category.ENERGY,
                5.0,
                0.0,
                100.0,
                "Upgrade interior and exterior luminaires to high-efficacy LEDs with occupancy sensing and daylight harvesting.",
                "Percentage of total indoor & outdoor lighting using LED/smart controls."
        ));

        list.add(new BooleanCriterion(
                "energy_passive_hvac",
                "Passive Architectural Design & High-Efficiency HVAC",
                Category.ENERGY,
                5.0,
                "Incorporate solar shading, high thermal mass, and high-efficiency HVAC equipment exceeding ASHRAE 90.1.",
                "Building incorporates optimal solar orientation, shading, and high-efficiency HVAC zoning."
        ));

        // 2. WATER (Total 28 - High IGBC emphasis)
        list.add(new BooleanCriterion(
                "water_rainwater",
                "Rainwater Harvesting System Present",
                Category.WATER,
                9.0,
                "Design rainwater storage ponds or underground filtration tanks to capture 100% of peak rainfall runoff.",
                "Rooftop and surface runoff capture system with storage or groundwater recharge pits."
        ));

        list.add(new PercentageCriterion(
                "water_low_flow",
                "Low-Flow Plumbing Fixtures (% of installed fittings)",
                Category.WATER,
                8.0,
                0.0,
                100.0,
                "Install ultra-low-flow plumbing fixtures, sensor-operated taps, and waterless urinals.",
                "Percentage of toilets, urinals, and faucets meeting low-flow benchmarks."
        ));

        list.add(new PercentageCriterion(
                "water_recycling",
                "Wastewater Treatment & Recycling (% reused on-site)",
                Category.WATER,
                7.0,
                0.0,
                100.0,
                "Upgrade on-site STP with MBR technology to achieve tertiary treated water reused for HVAC and landscaping.",
                "Percentage of generated wastewater treated to tertiary standards and reused."
        ));

        list.add(new BooleanCriterion(
                "water_landscaping",
                "Water-Efficient or Native Drought-Tolerant Landscaping",
                Category.WATER,
                4.0,
                "Eliminate high-water lawn turf; install xeriscaping with native drought-tolerant species and drip irrigation.",
                "At least 60% of vegetation is native/adaptive, irrigated with drip or smart moisture sensors."
        ));

        // 3. MATERIALS (Total 28 - High IGBC emphasis)
        list.add(new PercentageCriterion(
                "mat_recycled",
                "Recycled-Content Materials (% of total material cost)",
                Category.MATERIALS,
                8.0,
                0.0,
                30.0,
                "Increase use of structural steel with high recycled content, recycled gypsum boards, and recycled glass tiles.",
                "Target: ≥ 30% of building materials by value contain pre/post-consumer recycled content."
        ));

        list.add(new PercentageCriterion(
                "mat_regional",
                "Locally Sourced Materials within 500 km (% of total cost)",
                Category.MATERIALS,
                8.0,
                0.0,
                70.0,
                "Prioritize regional vendors within 500 km for masonry blocks, structural steel, glass, and aggregates.",
                "Target: ≥ 70% of structural and finishing materials sourced within 500 km."
        ));

        list.add(new BooleanCriterion(
                "mat_low_voc",
                "Low-VOC Paints, Adhesives, and Finishes",
                Category.MATERIALS,
                5.0,
                "Specify certified non-toxic coatings, zero-VOC adhesives, sealants, and GreenPro-certified carpets.",
                "100% of interior architectural coatings and adhesives meet Green Seal / low-VOC standards."
        ));

        list.add(new PercentageCriterion(
                "mat_blended_cement",
                "Fly-Ash / Blended Cement or Certified Sustainable Timber Use (%)",
                Category.MATERIALS,
                7.0,
                0.0,
                50.0,
                "Use PPC/PSC concrete mixes with higher pozzolan replacement and FSC-certified timber for formwork and interiors.",
                "Percentage of structural concrete using blended cement or FSC-certified wood."
        ));

        // 4. WASTE (Total 18)
        list.add(new PercentageCriterion(
                "waste_diversion",
                "Construction Waste Diverted from Landfills (% by weight/volume)",
                Category.WASTE,
                6.0,
                0.0,
                75.0,
                "Establish waste sorting yards on-site to crush concrete waste for sub-base and channel metal to recyclers.",
                "Target: ≥ 75% of construction and demolition debris diverted to reuse/recycling."
        ));

        list.add(new BooleanCriterion(
                "waste_organic",
                "Organic Waste Composting / Bio-Digestion on Site",
                Category.WASTE,
                5.0,
                "Install automated organic waste composter to treat food and landscape waste into rich soil amendment.",
                "On-site organic waste converter capable of treating 100% of organic waste generated."
        ));

        list.add(new BooleanCriterion(
                "waste_segregation",
                "Waste Segregation at Source (Multi-Bin System)",
                Category.WASTE,
                4.0,
                "Provide color-coded source segregation stations on all floors with signage in regional languages.",
                "Dedicated multi-stream segregation bins provided at every floor and central collection bay."
        ));

        list.add(new BooleanCriterion(
                "waste_hazardous",
                "E-Waste and Hazardous Waste Safe Handling Plan",
                Category.WASTE,
                3.0,
                "Deploy dedicated locked storage for battery, lamp, and electronic waste with certified disposal logs.",
                "Safe storage room and institutional agreement with authorized e-waste and chemical waste recyclers."
        ));

        return Collections.unmodifiableList(list);
    }
}

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
 * GRIHA (Green Rating for Integrated Habitat Assessment) Standard.
 * National rating system of India, emphasizing energy efficiency and holistic sustainability.
 *
 * Weight Distribution (Total 100):
 * - Energy: 30
 * - Water: 25
 * - Materials: 25
 * - Waste: 20
 */
public class GrihaStandard implements CertificationStandard {

    public static final String ID = "GRIHA";
    public static final String DISPLAY_NAME = "GRIHA (Green Rating for Integrated Habitat Assessment)";
    public static final String DESCRIPTION = "India's national rating system for green buildings, prioritizing energy efficiency and lifecycle environmental impact.";

    // Illustrative rating bands (constants labeled illustrative, not official)
    public static final List<RatingBand> RATING_BANDS = List.of(
            new RatingBand("5_STAR", "5 Star (GRIHA)", 91.0, 100.0, "Exemplary Sustainable Performance (Illustrative, not official)"),
            new RatingBand("4_STAR", "4 Star (GRIHA)", 81.0, 90.9, "High Resource Efficiency & Green Design (Illustrative, not official)"),
            new RatingBand("3_STAR", "3 Star (GRIHA)", 71.0, 80.9, "Good Environmental Performance (Illustrative, not official)"),
            new RatingBand("1_2_STAR", "1-2 Star (GRIHA)", 60.0, 70.9, "Basic Green Building Certification (Illustrative, not official)"),
            new RatingBand("UNCERTIFIED", "Uncertified", 0.0, 59.9, "Below 60-point certification threshold - Improvement Required (Illustrative, not official)")
    );

    private static final Map<Category, Double> WEIGHTS;

    static {
        Map<Category, Double> w = new LinkedHashMap<>();
        w.put(Category.ENERGY, 30.0);
        w.put(Category.WATER, 25.0);
        w.put(Category.MATERIALS, 25.0);
        w.put(Category.WASTE, 20.0);
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

        // 1. ENERGY (Total 30)
        List<Tier> epiTiers = List.of(
                new Tier("EXCEED_30", "≥ 30% reduction vs benchmark EPI", 30.0, 10.0, "Outstanding thermal envelope and HVAC efficiency"),
                new Tier("EXCEED_20", "20% - 29.9% reduction vs benchmark EPI", 20.0, 7.0, "High energy performance envelope"),
                new Tier("EXCEED_10", "10% - 19.9% reduction vs benchmark EPI", 10.0, 4.0, "Moderate energy optimization above code"),
                new Tier("BASELINE", "< 10% reduction (Standard baseline)", 0.0, 0.0, "Standard baseline compliance only")
        );
        String epiHint = String.format("%s benchmark is %.0f kWh/m²/year. Select anticipated or measured EPI reduction.",
                type.getDisplayName(), type.getBenchmarkEpiKwhPerM2());

        list.add(new TieredCriterion(
                "energy_epi",
                "Energy Performance Index (EPI) vs Benchmark",
                Category.ENERGY,
                10.0,
                epiTiers,
                "Upgrade window glazing, optimize HVAC chiller COP, or install heat recovery units to reduce EPI by at least 30%.",
                epiHint
        ));

        list.add(new PercentageCriterion(
                "energy_renewable",
                "Renewable Energy Share (% of total building demand)",
                Category.ENERGY,
                8.0,
                0.0,
                30.0,
                "Expand rooftop solar PV or off-site wheeling capacity to offset at least 30% of connected electrical load.",
                "Target: ≥ 30% of total electrical demand offset via solar PV or wind."
        ));

        list.add(new PercentageCriterion(
                "energy_lighting",
                "Efficient Lighting (% of total fixture lumens using LED/high-efficacy)",
                Category.ENERGY,
                6.0,
                0.0,
                100.0,
                "Transition remaining lighting fixtures to high-efficiency LEDs and install daylight sensors.",
                "Percentage of total indoor & outdoor lighting using LED/smart controls."
        ));

        list.add(new BooleanCriterion(
                "energy_passive_hvac",
                "Passive Architectural Design & High-Efficiency HVAC",
                Category.ENERGY,
                6.0,
                "Incorporate solar shading, natural cross-ventilation, and VAV/VRF systems with VFD controls.",
                "Building incorporates optimal solar orientation, shading, and high-efficiency HVAC zoning."
        ));

        // 2. WATER (Total 25)
        list.add(new BooleanCriterion(
                "water_rainwater",
                "Rainwater Harvesting System Present",
                Category.WATER,
                8.0,
                "Install rooftop and landscape rainwater harvesting tanks sized for peak monsoon rainfall runoff.",
                "Rooftop and surface runoff capture system with storage or groundwater recharge pits."
        ));

        list.add(new PercentageCriterion(
                "water_low_flow",
                "Low-Flow Plumbing Fixtures (% of installed fittings)",
                Category.WATER,
                7.0,
                0.0,
                100.0,
                "Replace standard taps and showers with aerated low-flow fixtures (≤ 4 LPM for basins, ≤ 6 LPM for showers).",
                "Percentage of toilets, urinals, and faucets meeting low-flow benchmarks."
        ));

        list.add(new PercentageCriterion(
                "water_recycling",
                "Wastewater Treatment & Recycling (% reused on-site)",
                Category.WATER,
                6.0,
                0.0,
                100.0,
                "Install a packaged Sewage Treatment Plant (STP) to treat black/greywater for flushing and cooling tower make-up.",
                "Percentage of generated wastewater treated to tertiary standards and reused."
        ));

        list.add(new BooleanCriterion(
                "water_landscaping",
                "Water-Efficient or Native Drought-Tolerant Landscaping",
                Category.WATER,
                4.0,
                "Convert lawns to indigenous, drought-tolerant flora and install drip or micro-sprinkler irrigation.",
                "At least 60% of vegetation is native/adaptive, irrigated with drip or smart moisture sensors."
        ));

        // 3. MATERIALS (Total 25)
        list.add(new PercentageCriterion(
                "mat_recycled",
                "Recycled-Content Materials (% of total material cost)",
                Category.MATERIALS,
                7.0,
                0.0,
                30.0,
                "Specify recycled steel reinforcement, AAC blocks with fly ash, and reclaimed aggregate.",
                "Target: ≥ 30% of building materials by value contain pre/post-consumer recycled content."
        ));

        list.add(new PercentageCriterion(
                "mat_regional",
                "Locally Sourced Materials within 500 km (% of total cost)",
                Category.MATERIALS,
                7.0,
                0.0,
                70.0,
                "Procure structural cement, aggregate, sand, and brickwork from manufacturers within 500 km radius.",
                "Target: ≥ 70% of structural and finishing materials sourced within 500 km."
        ));

        list.add(new BooleanCriterion(
                "mat_low_voc",
                "Low-VOC Paints, Adhesives, and Finishes",
                Category.MATERIALS,
                5.0,
                "Specify certified low-VOC paints (VOC < 50 g/L), adhesives, and non-toxic interior finishes.",
                "100% of interior architectural coatings and adhesives meet Green Seal / low-VOC standards."
        ));

        list.add(new PercentageCriterion(
                "mat_blended_cement",
                "Fly-Ash / Blended Cement or Certified Sustainable Timber Use (%)",
                Category.MATERIALS,
                6.0,
                0.0,
                50.0,
                "Utilize PPC / PSC cement with ≥ 25% fly-ash or slag content, and FSC-certified timber products.",
                "Percentage of structural concrete using blended cement or FSC-certified wood."
        ));

        // 4. WASTE (Total 20)
        list.add(new PercentageCriterion(
                "waste_diversion",
                "Construction Waste Diverted from Landfills (% by weight/volume)",
                Category.MATERIALS == null ? null : Category.WASTE,
                7.0,
                0.0,
                75.0,
                "Implement on-site demolition waste crushing and partner with authorized recyclers to divert ≥ 75% waste.",
                "Target: ≥ 75% of construction and demolition debris diverted to reuse/recycling."
        ));

        list.add(new BooleanCriterion(
                "waste_organic",
                "Organic Waste Composting / Bio-Digestion on Site",
                Category.WASTE,
                5.0,
                "Install an on-site organic waste composter (OWC) or vermicomposting unit for wet cafeteria/landscape waste.",
                "On-site organic waste converter capable of treating 100% of organic waste generated."
        ));

        list.add(new BooleanCriterion(
                "waste_segregation",
                "Waste Segregation at Source (Multi-Bin System)",
                Category.WASTE,
                4.0,
                "Implement a 3-bin source segregation system (dry, wet, hazardous/sanitary) on all floors and central storage.",
                "Dedicated multi-stream segregation bins provided at every floor and central collection bay."
        ));

        list.add(new BooleanCriterion(
                "waste_hazardous",
                "E-Waste and Hazardous Waste Safe Handling Plan",
                Category.WASTE,
                4.0,
                "Formalize a secure storage protocol and tie up with CPCB/SPCB authorized recyclers for electronic and hazardous waste.",
                "Safe storage room and institutional agreement with authorized e-waste and chemical waste recyclers."
        ));

        return Collections.unmodifiableList(list);
    }
}

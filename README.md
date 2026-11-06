# Green Building Certification Scorer (Problem Statement 89)

An object-oriented rule and criteria engine that evaluates a building against sustainability parameters across four core categories—**Energy Efficiency**, **Water Conservation**, **Sustainable Materials**, and **Waste Management**—and produces a 0–100 certification-readiness score using weighted scoring aligned with **GRIHA** (India's national rating system) and **IGBC** (Indian Green Building Council).

This tool helps architects, sustainability consultants, and builders self-assess and optimize building designs prior to formal green building audit and certification submission.

---

## 1. Tech Stack & Design Constraints

- **Language & Runtime:** Java 17+ (JDK 17 to JDK 26 compatible)
- **Framework:** Spring Boot 3.3.5
- **Dependencies:** Strictly limited to `spring-boot-starter-web` and `spring-boot-starter-test` (no third-party utility libraries or ORM overhead).
- **Data Persistence:** In-memory, stateless evaluation engine.
- **Frontend:** Pure HTML5, modern CSS3, and vanilla ES6 JavaScript in `src/main/resources/static/` (zero npm, zero node modules, zero build tools, zero external CDN dependencies; operates 100% offline).
- **Embedded Server:** Apache Tomcat on port `8080`.

---

## 2. Quick Start & Execution Instructions

### Prerequisites
- JDK 17 or higher
- Apache Maven 3.8+

### Running the Application
From the project root (`green-building-scorer`):

```bash
# 1. Run all unit and integration tests
mvn clean test

# 2. Start the Spring Boot application
mvn spring-boot:run
```

Once started, navigate to:
**`http://localhost:8080`**

---

## 3. Package & Project Structure

```text
green-building-scorer/
├── pom.xml                                     # Maven build definition with Spring Boot 3.3.5
├── README.md                                   # Comprehensive architecture and run documentation
├── src/
│   ├── main/
│   │   ├── java/com/greenscore/
│   │   │   ├── Application.java                # Spring Boot bootstrap entrypoint
│   │   │   ├── model/                          # Domain entities and immutable records
│   │   │   │   ├── BuildingType.java           # Typology enum (OFFICE, RESIDENTIAL, etc.) with EPI benchmarks
│   │   │   │   ├── Category.java               # Sustainability category enum (ENERGY, WATER, MATERIALS, WASTE)
│   │   │   │   ├── BuildingInput.java          # Encapsulated client submission data with defensive conversions
│   │   │   │   ├── RuleResult.java             # Immutable record representing a single criterion's evaluation
│   │   │   │   ├── CategoryScore.java          # Immutable record for aggregated weighted category score
│   │   │   │   ├── ImprovementSuggestion.java  # Prioritized actionable tip with points available
│   │   │   │   └── ScoreReport.java            # Comprehensive evaluation report record
│   │   │   ├── engine/                         # Core rule and scoring engine
│   │   │   │   ├── Rule.java                   # Abstraction: Rule evaluation interface
│   │   │   │   ├── Criterion.java              # Abstract base class implementing Rule
│   │   │   │   ├── CriterionType.java          # Enum for input types (BOOLEAN, PERCENTAGE, TIERED)
│   │   │   │   ├── BooleanCriterion.java       # Concrete criterion for binary compliance (full or zero)
│   │   │   │   ├── PercentageCriterion.java    # Concrete criterion with linear interpolation between min & target
│   │   │   │   ├── TieredCriterion.java        # Concrete criterion with discrete value bands
│   │   │   │   ├── Tier.java                   # Record representing a discrete scoring tier band
│   │   │   │   └── ScoringEngine.java          # Core orchestrator executing polymorphic evaluation
│   │   │   ├── standard/                       # Strategy pattern for certification rating standards
│   │   │   │   ├── CertificationStandard.java  # Strategy interface for standard weights, criteria, and rating bands
│   │   │   │   ├── RatingBand.java             # Record for illustrative certification tier bands
│   │   │   │   ├── GrihaStandard.java          # GRIHA standard implementation (weights: 30, 25, 25, 20)
│   │   │   │   ├── IgbcStandard.java           # IGBC standard implementation (weights: 26, 28, 28, 18)
│   │   │   │   └── StandardRegistry.java       # Registry and factory for standard strategies
│   │   │   └── api/                            # REST layer and exception handling
│   │   │       ├── EvaluationController.java   # Controller exposing /standards, /criteria, and /evaluate
│   │   │       ├── SmokeController.java        # Health check endpoint (/api/health)
│   │   │       ├── GlobalExceptionHandler.java # Unified 400 bad request handling with {error, details}
│   │   │       └── dto/                        # Transfer objects for API requests and responses
│   │   │           ├── CriterionMetadataDto.java
│   │   │           ├── ErrorResponseDto.java
│   │   │           ├── EvaluationRequestDto.java
│   │   │           └── StandardSummaryDto.java
│   │   └── resources/
│   │       ├── application.properties          # Server port (8080) and configuration
│   │       └── static/                         # Pure frontend assets
│   │           ├── index.html                  # Multi-step wizard and results markup
│   │           ├── style.css                   # Responsive theme, custom controls, and print stylesheet
│   │           └── app.js                      # Vanilla JavaScript controller with SVG gauge & dynamic forms
│   └── test/
│       └── java/com/greenscore/
│           ├── ApplicationTests.java           # Context bootstrap test
│           ├── engine/
│           │   ├── BooleanCriterionTest.java   # Zero, full, missing, and string conversions
│           │   ├── PercentageCriterionTest.java# Linear interpolation, zero, partial, target, and clamping
│           │   ├── TieredCriterionTest.java    # Band selection, numeric threshold matching, and fallbacks
│           │   └── ScoringEngineTest.java      # 0 pts, 100 pts, 59.9 vs 60.0 boundary, and suggestion ranking
│           ├── standard/
│           │   └── StandardWeightsTest.java    # Category weights sum to 100.0, criteria sums match weights
│           └── api/
│               └── EvaluationControllerTest.java# MockMvc integration tests for 200 and 400 validation cases
```

---

## 4. Object-Oriented Programming (OOP) Implementation

The architecture demonstrates core OOP principles:

### A. Abstraction
- **`com.greenscore.engine.Rule`**: Minimal, high-level interface declaring the evaluation contract:
  ```java
  public interface Rule {
      RuleResult evaluate(BuildingInput in);
  }
  ```
- **`com.greenscore.engine.Criterion`**: Abstract base class capturing common criterion attributes (`id`, `name`, `category`, `maxPoints`, `suggestionText`, `inputHint`, `type`) while leaving evaluation logic abstract.

### B. Inheritance and Polymorphism
- Concrete subclasses specialize evaluation behavior:
  - **`BooleanCriterion`**: Binary evaluation awarding full `maxPoints` if true, `0.0` if false.
  - **`PercentageCriterion`**: Continuous linear interpolation:
    $$\text{earnedPoints} = \text{maxPoints} \times \frac{\text{value} - \text{minValue}}{\text{targetValue} - \text{minValue}}$$
    Strictly clamped between `0.0` and `maxPoints`.
  - **`TieredCriterion`**: Evaluates discrete performance tiers (e.g. Energy Performance Index reduction vs baseline benchmark), matching either by tier identifier or highest satisfied numeric threshold.
- **Polymorphism in `ScoringEngine`**:
  `ScoringEngine` operates strictly on `List<Criterion>`. It iterates over the collection and invokes `criterion.evaluate(input)` polymorphically without needing `instanceof` or concrete type checks:
  ```java
  for (Criterion criterion : criteria) {
      RuleResult result = criterion.evaluate(input); // Polymorphic dispatch
      ruleResults.add(result);
  }
  ```

### C. Encapsulation & Immutability
- All domain classes use private fields with controlled accessors.
- Output metrics and results are encapsulated in immutable Java records (`RuleResult`, `CategoryScore`, `ImprovementSuggestion`, `ScoreReport`).
- Defensively copies collections in constructors and returns unmodifiable views.

### D. Strategy Pattern
- **`com.greenscore.standard.CertificationStandard`**: Defines interchangeable certification strategies.
- **`GrihaStandard`** and **`IgbcStandard`** implement this interface, each encapsulating its unique category weights, criteria configuration, and illustrative rating bands.
- `ScoringEngine` accepts any `CertificationStandard` at runtime, enabling seamless addition of future rating frameworks (e.g., LEED, BEE, BREEAM) with zero modifications to the core engine.

---

## 5. Scoring Logic & Rating Formulation

### Step-by-Step Calculation
1. **Criterion Evaluation:**
   Each criterion evaluates the building input and produces `earnedPoints` in the range $[0, \text{maxPoints}]$.
2. **Category Aggregation:**
   For each category $c \in \{\text{ENERGY}, \text{WATER}, \text{MATERIALS}, \text{WASTE}\}$:
   $$\text{Earned}_c = \sum_{i \in c} \text{earnedPoints}_i, \quad \text{Max}_c = \sum_{i \in c} \text{maxPoints}_i$$
   $$\text{WeightedScore}_c = \left(\frac{\text{Earned}_c}{\text{Max}_c}\right) \times \text{CategoryWeight}_c$$
3. **Total Certification Score:**
   $$\text{TotalScore} = \min\left(100.0, \max\left(0.0, \operatorname{round}_{1\text{dp}}\left(\sum_c \text{WeightedScore}_c\right)\right)\right)$$
4. **Certification Readiness Threshold:**
   $$\text{Readiness} = \begin{cases} \text{"Certification Ready"}, & \text{if } \text{TotalScore} \ge 60.0 \\ \text{"Improvement Required"}, & \text{if } \text{TotalScore} < 60.0 \end{cases}$$
   *(59.9 points is strictly "Improvement Required"; 60.0 points is "Certification Ready".)*
5. **Prioritized Action Plan:**
   For every criterion with $\text{pointsAvailable} > 0$, an improvement suggestion is generated. Suggestions are sorted in descending order of points available ($\text{pointsAvailable} = \text{maxPoints} - \text{earnedPoints}$).

### Category Weight Comparison

| Sustainability Category | GRIHA Weight | IGBC Weight | Focus Difference |
| :--- | :---: | :---: | :--- |
| **Energy Efficiency** | 30.0 | 26.0 | GRIHA places highest national focus on grid energy reduction |
| **Water Conservation** | 25.0 | 28.0 | IGBC places enhanced emphasis on water neutrality |
| **Sustainable Materials**| 25.0 | 28.0 | IGBC places higher weight on circular & recycled materials |
| **Waste Management** | 20.0 | 18.0 | Comprehensive construction and operational waste handling |
| **Total Weight** | **100.0** | **100.0** | Both standards sum to exactly 100 points |

### Illustrative Rating Bands (*Illustrative, not official*)

- **GRIHA:**
  - `91.0 – 100.0`: 5 Star (GRIHA)
  - `81.0 – 90.9`: 4 Star (GRIHA)
  - `71.0 – 80.9`: 3 Star (GRIHA)
  - `60.0 – 70.9`: 1-2 Star (GRIHA)
  - `0.0 – 59.9`: Uncertified (Improvement Required)
- **IGBC:**
  - `90.0 – 100.0`: Platinum (IGBC)
  - `80.0 – 89.9`: Gold (IGBC)
  - `70.0 – 79.9`: Silver (IGBC)
  - `60.0 – 69.9`: Certified (IGBC)
  - `0.0 – 59.9`: Uncertified (Improvement Required)

---

## 6. REST API Reference

### 1. `GET /api/standards`
Returns available certification standards, category weights, and descriptions.
- **Response:** `200 OK`
```json
[
  {
    "id": "GRIHA",
    "displayName": "GRIHA (Green Rating for Integrated Habitat Assessment)",
    "description": "India's national rating system for green buildings...",
    "categoryWeights": {
      "ENERGY": 30.0,
      "WATER": 25.0,
      "MATERIALS": 25.0,
      "WASTE": 20.0
    },
    "disclaimer": "Illustrative, not official certification."
  }
]
```

### 2. `GET /api/criteria?standard={GRIHA|IGBC}&buildingType={OFFICE|RESIDENTIAL|...}`
Returns criteria metadata including types, max points, units, and options to generate dynamic UI forms.
- **Response:** `200 OK` (Array of 16 criteria)

### 3. `POST /api/evaluate`
Evaluates a building submission and produces a complete evaluation report.
- **Request Body:**
```json
{
  "buildingName": "EcoTower Horizon Campus",
  "buildingType": "OFFICE",
  "standard": "GRIHA",
  "values": {
    "energy_epi": "EXCEED_30",
    "energy_renewable": 25.0,
    "energy_lighting": 95.0,
    "energy_passive_hvac": true,
    "water_rainwater": true,
    "water_low_flow": 85.0,
    "water_recycling": 80.0,
    "water_landscaping": true,
    "mat_recycled": 24.0,
    "mat_regional": 65.0,
    "mat_low_voc": true,
    "mat_blended_cement": 40.0,
    "waste_diversion": 70.0,
    "waste_organic": true,
    "waste_segregation": true,
    "waste_hazardous": true
  }
}
```
- **Response:** `200 OK` (`ScoreReport` with `totalScore`, `readinessStatus`, `isReady`, `ratingBand`, `categoryScores`, `ruleResults`, and sorted `suggestions`).
- **Validation Rules:**
  - Blank building name $\rightarrow$ `HTTP 400`
  - Unknown standard or building typology $\rightarrow$ `HTTP 400`
  - Negative numbers or percentages $> 100$ $\rightarrow$ `HTTP 400`
  - Missing criteria values $\rightarrow$ gracefully defaults to 0 / false (`HTTP 200`)
  - Error JSON schema: `{"error": "...", "details": ["..."]}`

---

## 7. Automated Testing Suite

The project includes 33 comprehensive tests across 7 test classes:

| Test Class | Focus & Verifications |
| :--- | :--- |
| `BooleanCriterionTest` | Full points when true, 0 when false, fallback for missing/null, string booleans ("yes", "1"). |
| `PercentageCriterionTest` | Zero input (0%), linear interpolation for partials, target achievement, clamping at boundaries. |
| `TieredCriterionTest` | Discrete tier ID matching, continuous numeric threshold matching, and baseline fallback. |
| `StandardWeightsTest` | Proves GRIHA and IGBC category weights sum to 100.0; criteria max points match category weights for all building types. |
| `ScoringEngineTest` | All-zero input produces 0.0 ("Improvement Required"); all-perfect produces 100.0 ("Certification Ready"); exact boundary test proves 59.9 is not ready and 60.0 is ready; suggestions are sorted descending by points available. |
| `EvaluationControllerTest`| MockMvc integration test validating HTTP 200 success, HTTP 400 validation failures (blank name, unknown standard, negative number, percentage > 100), and malformed JSON safety. |
| `ApplicationTests` | Spring Boot application context bootstrap test. |

Run all tests:
```bash
mvn clean test
```
Result: **33 Tests Run, 0 Failures, 0 Errors, 0 Skipped**.

---

## 8. Frontend Highlights & Category Improvement Features

- **Multi-Step Wizard:** Step 1 (Project Info) $\rightarrow$ Step 2 (Energy) $\rightarrow$ Step 3 (Water) $\rightarrow$ Step 4 (Materials) $\rightarrow$ Step 5 (Waste) $\rightarrow$ Step 6 (Readiness Results).
- **Live Category Trackers:** Real-time feedback banners at the top of Energy, Water, Materials, and Waste wizard steps showing live category points earned, deficit gap to perfection, and immediate highest-impact tips as users adjust controls.
- **Category Improvement Deep-Dive Grid:** 4 dedicated category analysis cards for **Energy**, **Water**, **Materials**, and **Waste**:
  - Displays submitted user data chips (e.g. `Renewable: 25%`, `Rainwater: Yes`, `Recycled: 24%`).
  - Dual progress bar showing earned points vs remaining improvement potential.
  - Prioritized actionable improvement bullets tailored to that category.
- **Category Action Plan Filter Tabs:** Interactive pills (`All`, `⚡ Energy`, `💧 Water`, `🧱 Materials`, `♻️ Waste`) with dynamic counter badges allowing users to filter recommendations.
- **Criteria Table Deficit Column:** Direct indicator of the points gap lost per criterion.
- **Dynamic Field Generation:** Input fields are rendered based on the active standard and typology metadata from `/api/criteria`.
- **Inline SVG Gauge:** Vector circular score gauge with dynamic color transitions (Green for Ready, Amber for Improvement Required).
- **One-Click Demo ("Load Sample Data"):** Immediately populates realistic office building parameters scoring in the 5-Star / Platinum tier.
- **Print / Save PDF:** Dedicated `@media print` stylesheet formats the report cleanly on A4 paper, hiding wizard controls and displaying the certification summary.


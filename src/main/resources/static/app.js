/**
 * GreenScore Application Controller
 * Vanilla ES6 JavaScript - Zero external frameworks or libraries.
 */

(function () {
    'use strict';

    // Application State
    const state = {
        currentStep: 1,
        totalSteps: 5, // Wizard steps 1 to 5, step 6 is results
        standards: [],
        selectedStandard: 'GRIHA',
        selectedBuildingType: 'OFFICE',
        criteria: [],
        formData: {
            buildingName: '',
            buildingType: 'OFFICE',
            standard: 'GRIHA',
            values: {}
        },
        evaluationReport: null,
        activeCategoryFilter: 'ALL'
    };

    // Category Metadata Helper
    const categoryMeta = {
        'ENERGY': { icon: '⚡', title: 'Energy Efficiency', className: 'cat-energy' },
        'WATER': { icon: '💧', title: 'Water Conservation', className: 'cat-water' },
        'MATERIALS': { icon: '🧱', title: 'Sustainable Materials', className: 'cat-materials' },
        'WASTE': { icon: '♻️', title: 'Waste Management', className: 'cat-waste' }
    };

    // DOM Elements
    const elements = {
        buildingNameInput: document.getElementById('buildingNameInput'),
        buildingTypeSelect: document.getElementById('buildingTypeSelect'),
        standardRadios: document.querySelectorAll('input[name="standardChoice"]'),
        standardInfoCallout: document.getElementById('standardInfoCallout'),
        energyWeightBadge: document.getElementById('energyWeightBadge'),
        waterWeightBadge: document.getElementById('waterWeightBadge'),
        materialsWeightBadge: document.getElementById('materialsWeightBadge'),
        wasteWeightBadge: document.getElementById('wasteWeightBadge'),
        stepErrorBanner: document.getElementById('stepErrorBanner'),
        stepperProgressBar: document.getElementById('stepperProgressBar'),
        prevStepBtn: document.getElementById('prevStepBtn'),
        nextStepBtn: document.getElementById('nextStepBtn'),
        currentStepNumber: document.getElementById('currentStepNumber'),
        wizardFooter: document.getElementById('wizardFooter'),
        loadSampleBtn: document.getElementById('loadSampleBtn'),
        resetBtn: document.getElementById('resetBtn'),
        printReportBtn: document.getElementById('printReportBtn'),
        evaluateAnotherBtn: document.getElementById('evaluateAnotherBtn'),
        // Containers
        energyContainer: document.getElementById('energyCriteriaContainer'),
        waterContainer: document.getElementById('waterCriteriaContainer'),
        materialsContainer: document.getElementById('materialsCriteriaContainer'),
        wasteContainer: document.getElementById('wasteCriteriaContainer'),
        // Live Trackers
        energyLiveStats: document.getElementById('energyLiveStats'),
        energyLiveTip: document.getElementById('energyLiveTip'),
        waterLiveStats: document.getElementById('waterLiveStats'),
        waterLiveTip: document.getElementById('waterLiveTip'),
        materialsLiveStats: document.getElementById('materialsLiveStats'),
        materialsLiveTip: document.getElementById('materialsLiveTip'),
        wasteLiveStats: document.getElementById('wasteLiveStats'),
        wasteLiveTip: document.getElementById('wasteLiveTip'),
        // Results
        readinessBanner: document.getElementById('readinessBanner'),
        readinessTitle: document.getElementById('readinessTitle'),
        readinessDesc: document.getElementById('readinessDesc'),
        readinessIconBox: document.getElementById('readinessIconBox'),
        ratingBandTag: document.getElementById('ratingBandTag'),
        gaugeContainer: document.getElementById('gaugeContainer'),
        gaugePointsDisplay: document.getElementById('gaugePointsDisplay'),
        summaryProjectName: document.getElementById('summaryProjectName'),
        summaryBuildingType: document.getElementById('summaryBuildingType'),
        summaryStandardName: document.getElementById('summaryStandardName'),
        summaryRatingLevel: document.getElementById('summaryRatingLevel'),
        summaryTimestamp: document.getElementById('summaryTimestamp'),
        standardDisclaimerText: document.getElementById('standardDisclaimerText'),
        categoryBarsContainer: document.getElementById('categoryBarsContainer'),
        categoryImprovementGrid: document.getElementById('categoryImprovementGrid'),
        categoryFilterTabs: document.getElementById('categoryFilterTabs'),
        suggestionsList: document.getElementById('suggestionsList'),
        criteriaTableBody: document.getElementById('criteriaTableBody'),
        // Counts
        countAll: document.getElementById('countAll'),
        countEnergy: document.getElementById('countEnergy'),
        countWater: document.getElementById('countWater'),
        countMaterials: document.getElementById('countMaterials'),
        countWaste: document.getElementById('countWaste')
    };

    // Category container mapping
    const categoryContainers = {
        'ENERGY': elements.energyContainer,
        'WATER': elements.waterContainer,
        'MATERIALS': elements.materialsContainer,
        'WASTE': elements.wasteContainer
    };

    /**
     * Initialize Application
     */
    async function init() {
        bindEvents();
        await loadStandards();
        await loadCriteria();
    }

    /**
     * Bind DOM Event Listeners
     */
    function bindEvents() {
        // Next / Back buttons
        elements.nextStepBtn.addEventListener('click', onNextStep);
        elements.prevStepBtn.addEventListener('click', onPrevStep);

        // Header Actions
        elements.loadSampleBtn.addEventListener('click', loadSampleData);
        elements.resetBtn.addEventListener('click', resetForm);
        elements.printReportBtn.addEventListener('click', () => window.print());
        elements.evaluateAnotherBtn.addEventListener('click', () => goToStep(1));

        // Building Type change
        elements.buildingTypeSelect.addEventListener('change', async (e) => {
            state.selectedBuildingType = e.target.value;
            state.formData.buildingType = e.target.value;
            await loadCriteria();
        });

        // Standard Radio selection
        elements.standardRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    state.selectedStandard = e.target.value;
                    state.formData.standard = e.target.value;
                    updateStandardInfo();
                    await loadCriteria();
                }
            });
        });

        // Stepper Navigation click
        document.querySelectorAll('.step-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetStep = parseInt(item.getAttribute('data-step'), 10);
                if (targetStep < state.currentStep || (state.evaluationReport && targetStep === 6)) {
                    goToStep(targetStep);
                }
            });
        });

        // Category Filter Tabs
        if (elements.categoryFilterTabs) {
            elements.categoryFilterTabs.querySelectorAll('.cat-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    elements.categoryFilterTabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    state.activeCategoryFilter = tab.getAttribute('data-cat');
                    renderFilteredSuggestions();
                });
            });
        }
    }

    /**
     * Fetch standards from /api/standards
     */
    async function loadStandards() {
        try {
            const res = await fetch('/api/standards');
            if (!res.ok) throw new Error('Failed to load certification standards');
            state.standards = await res.json();
            updateStandardInfo();
        } catch (err) {
            showError('Unable to connect to standards API: ' + err.message);
        }
    }

    /**
     * Update Category Weight Badges and standard info callout
     */
    function updateStandardInfo() {
        const std = state.standards.find(s => s.id === state.selectedStandard);
        if (!std) return;

        const weights = std.categoryWeights;
        elements.energyWeightBadge.textContent = `Weight: ${weights.ENERGY || 30} Points`;
        elements.waterWeightBadge.textContent = `Weight: ${weights.WATER || 25} Points`;
        elements.materialsWeightBadge.textContent = `Weight: ${weights.MATERIALS || 25} Points`;
        elements.wasteWeightBadge.textContent = `Weight: ${weights.WASTE || 20} Points`;

        elements.standardInfoCallout.innerHTML = `
            <div class="callout-title">${std.displayName}</div>
            <p class="callout-body">${std.description} <em>(${std.disclaimer})</em></p>
        `;
    }

    /**
     * Fetch criteria metadata from /api/criteria
     */
    async function loadCriteria() {
        try {
            const url = `/api/criteria?standard=${encodeURIComponent(state.selectedStandard)}&buildingType=${encodeURIComponent(state.selectedBuildingType)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch criteria configuration');
            state.criteria = await res.json();
            renderAllCriteria();
            updateAllLiveTrackers();
        } catch (err) {
            showError('Error loading criteria: ' + err.message);
        }
    }

    /**
     * Render criteria input cards dynamically into category step containers
     */
    function renderAllCriteria() {
        // Clear all containers
        Object.values(categoryContainers).forEach(c => { if (c) c.innerHTML = ''; });

        state.criteria.forEach(c => {
            const container = categoryContainers[c.category];
            if (!container) return;

            const card = document.createElement('div');
            card.className = 'criterion-card';
            card.id = `card_${c.id}`;

            const currentValue = state.formData.values[c.id] !== undefined
                ? state.formData.values[c.id]
                : c.defaultValue;

            card.innerHTML = `
                <div class="criterion-header">
                    <div>
                        <div class="criterion-name">${escapeHtml(c.name)}</div>
                        <div class="criterion-hint">${escapeHtml(c.inputHint)}</div>
                    </div>
                    <span class="criterion-badge">${c.maxPoints} pts max</span>
                </div>
                <div class="criterion-control-body" id="ctrl_${c.id}">
                    ${renderControlHtml(c, currentValue)}
                </div>
            `;

            container.appendChild(card);
            bindControlEvents(c, card);
        });
    }

    /**
     * Generate HTML for criterion input controls
     */
    function renderControlHtml(criterion, value) {
        if (criterion.type === 'BOOLEAN') {
            const checked = (value === true || value === 'true');
            return `
                <div class="toggle-switch-wrapper">
                    <label class="switch">
                        <input type="checkbox" id="input_${criterion.id}" ${checked ? 'checked' : ''}>
                        <span class="slider-round"></span>
                    </label>
                    <span class="toggle-label" id="label_${criterion.id}">${checked ? 'Implemented / Compliant' : 'Not Implemented'}</span>
                </div>
            `;
        }

        if (criterion.type === 'PERCENTAGE') {
            const numVal = (typeof value === 'number') ? value : parseFloat(value) || 0;
            return `
                <div class="percentage-control-group">
                    <input type="range" class="range-slider" id="slider_${criterion.id}" 
                           min="0" max="100" step="1" value="${numVal}">
                    <div class="number-input-box">
                        <input type="number" id="num_${criterion.id}" min="0" max="100" step="1" value="${numVal}">
                        <span>%</span>
                    </div>
                </div>
            `;
        }

        if (criterion.type === 'TIERED') {
            const selectedTier = (typeof value === 'string' && value) ? value : 'BASELINE';
            let optionsHtml = '';
            criterion.tierOptions.forEach(opt => {
                const isSelected = (opt.id === selectedTier) ? 'selected' : '';
                optionsHtml += `<option value="${opt.id}" ${isSelected}>${escapeHtml(opt.label)} (${opt.points} pts)</option>`;
            });

            return `
                <select id="select_${criterion.id}" class="form-select">
                    ${optionsHtml}
                </select>
            `;
        }

        return '';
    }

    /**
     * Attach synchronized event listeners for dynamic controls
     */
    function bindControlEvents(criterion, cardElement) {
        if (criterion.type === 'BOOLEAN') {
            const checkbox = cardElement.querySelector(`#input_${criterion.id}`);
            const label = cardElement.querySelector(`#label_${criterion.id}`);
            checkbox.addEventListener('change', () => {
                state.formData.values[criterion.id] = checkbox.checked;
                label.textContent = checkbox.checked ? 'Implemented / Compliant' : 'Not Implemented';
                updateCategoryLiveTracker(criterion.category);
            });
        }

        if (criterion.type === 'PERCENTAGE') {
            const slider = cardElement.querySelector(`#slider_${criterion.id}`);
            const number = cardElement.querySelector(`#num_${criterion.id}`);

            const syncValues = (val) => {
                let v = parseFloat(val);
                if (isNaN(v)) v = 0;
                v = Math.max(0, Math.min(100, v));
                slider.value = v;
                number.value = v;
                state.formData.values[criterion.id] = v;
                updateCategoryLiveTracker(criterion.category);
            };

            slider.addEventListener('input', (e) => syncValues(e.target.value));
            number.addEventListener('input', (e) => syncValues(e.target.value));
        }

        if (criterion.type === 'TIERED') {
            const select = cardElement.querySelector(`#select_${criterion.id}`);
            select.addEventListener('change', (e) => {
                state.formData.values[criterion.id] = e.target.value;
                updateCategoryLiveTracker(criterion.category);
            });
        }
    }

    /**
     * Update Live Category Tracker Banners in Wizard Steps
     */
    function updateAllLiveTrackers() {
        ['ENERGY', 'WATER', 'MATERIALS', 'WASTE'].forEach(cat => updateCategoryLiveTracker(cat));
    }

    function updateCategoryLiveTracker(category) {
        const catCriteria = state.criteria.filter(c => c.category === category);
        if (!catCriteria || catCriteria.length === 0) return;

        let totalMax = 0;
        let totalEarned = 0;
        let highestDeficit = 0;
        let highestDeficitCriterion = null;

        catCriteria.forEach(c => {
            const maxPts = c.maxPoints;
            totalMax += maxPts;
            const val = state.formData.values[c.id];
            let earned = 0;

            if (c.type === 'BOOLEAN') {
                earned = (val === true || val === 'true') ? maxPts : 0;
            } else if (c.type === 'PERCENTAGE') {
                const num = (typeof val === 'number') ? val : (parseFloat(val) || 0);
                earned = Math.min(maxPts, (Math.max(0, num) / 100.0) * maxPts);
            } else if (c.type === 'TIERED') {
                const tierId = val || 'BASELINE';
                const matched = c.tierOptions.find(o => o.id === tierId);
                earned = matched ? (matched.points || 0) : 0;
            }

            totalEarned += earned;
            const deficit = maxPts - earned;
            if (deficit > highestDeficit) {
                highestDeficit = deficit;
                highestDeficitCriterion = c;
            }
        });

        const improvementGap = Math.max(0, totalMax - totalEarned);
        const pct = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;

        let statsEl, tipEl;
        if (category === 'ENERGY') {
            statsEl = elements.energyLiveStats;
            tipEl = elements.energyLiveTip;
        } else if (category === 'WATER') {
            statsEl = elements.waterLiveStats;
            tipEl = elements.waterLiveTip;
        } else if (category === 'MATERIALS') {
            statsEl = elements.materialsLiveStats;
            tipEl = elements.materialsLiveTip;
        } else if (category === 'WASTE') {
            statsEl = elements.wasteLiveStats;
            tipEl = elements.wasteLiveTip;
        }

        if (statsEl) {
            statsEl.textContent = `Current: ${totalEarned.toFixed(1)} / ${totalMax.toFixed(1)} pts (${pct.toFixed(0)}%) • Improvement Potential: +${improvementGap.toFixed(1)} pts`;
        }

        if (tipEl) {
            if (improvementGap <= 0.05) {
                tipEl.textContent = '🎉 Category 100% compliant! Full points achieved.';
                tipEl.style.backgroundColor = '#ecfdf5';
                tipEl.style.color = '#065f46';
                tipEl.style.borderColor = '#86efac';
            } else if (highestDeficitCriterion) {
                tipEl.textContent = `💡 Highest gain: Optimize ${highestDeficitCriterion.name} (+${highestDeficit.toFixed(1)} pts)`;
                tipEl.style.backgroundColor = '#ffffff';
                tipEl.style.color = '#065f46';
                tipEl.style.borderColor = '#6ee7b7';
            }
        }
    }

    /**
     * Multi-step Navigation Next Handler
     */
    async function onNextStep() {
        clearError();

        // Validate current step
        if (!validateStep(state.currentStep)) {
            return;
        }

        if (state.currentStep < state.totalSteps) {
            goToStep(state.currentStep + 1);
        } else if (state.currentStep === state.totalSteps) {
            // Submit to /api/evaluate
            await submitEvaluation();
        }
    }

    /**
     * Multi-step Navigation Back Handler
     */
    function onPrevStep() {
        clearError();
        if (state.currentStep > 1) {
            goToStep(state.currentStep - 1);
        }
    }

    /**
     * Transition between steps
     */
    function goToStep(step) {
        state.currentStep = step;

        // Hide all steps, show current
        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            if (stepEl) {
                stepEl.classList.toggle('active', i === step);
            }
        }

        // Update stepper nav circles
        document.querySelectorAll('.step-item').forEach(item => {
            const itemStep = parseInt(item.getAttribute('data-step'), 10);
            item.classList.toggle('active', itemStep === step);
            item.classList.toggle('completed', itemStep < step);
        });

        // Update progress bar
        const progressPct = ((step) / 6) * 100;
        elements.stepperProgressBar.style.width = `${progressPct}%`;

        // Update footer controls
        elements.prevStepBtn.disabled = (step === 1 || step === 6);
        elements.currentStepNumber.textContent = step;

        if (step === state.totalSteps) {
            elements.nextStepBtn.innerHTML = `
                Evaluate Building
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
            `;
        } else if (step === 6) {
            elements.wizardFooter.style.display = 'none';
        } else {
            elements.wizardFooter.style.display = 'flex';
            elements.nextStepBtn.innerHTML = `
                Next
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            `;
        }

        // Scroll into view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Validate current step inputs
     */
    function validateStep(step) {
        if (step === 1) {
            const name = elements.buildingNameInput.value.trim();
            if (!name) {
                showError('Please enter a valid Project / Building Name before proceeding.');
                elements.buildingNameInput.focus();
                return false;
            }
            state.formData.buildingName = name;
            state.formData.buildingType = elements.buildingTypeSelect.value;
            const checkedRadio = document.querySelector('input[name="standardChoice"]:checked');
            state.formData.standard = checkedRadio ? checkedRadio.value : 'GRIHA';
        }
        return true;
    }

    /**
     * Submit evaluation request to POST /api/evaluate
     */
    async function submitEvaluation() {
        try {
            elements.nextStepBtn.disabled = true;
            elements.nextStepBtn.textContent = 'Evaluating...';

            const payload = {
                buildingName: state.formData.buildingName,
                buildingType: state.formData.buildingType,
                standard: state.formData.standard,
                values: state.formData.values
            };

            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData.details ? errData.details.join(', ') : (errData.error || 'Evaluation failed');
                throw new Error(msg);
            }

            state.evaluationReport = await res.json();
            renderResults(state.evaluationReport);
            goToStep(6);
        } catch (err) {
            showError('Evaluation Error: ' + err.message);
        } finally {
            elements.nextStepBtn.disabled = false;
        }
    }

    /**
     * Render Results Dashboard
     */
    function renderResults(report) {
        // 1. Readiness Banner
        const isReady = report.isReady;
        elements.readinessBanner.className = `readiness-banner ${isReady ? 'ready' : 'improvement'}`;
        elements.readinessTitle.textContent = isReady ? 'Certification Ready' : 'Improvement Required';
        elements.readinessDesc.textContent = isReady
            ? `Total score of ${report.totalScore.toFixed(1)} satisfies the minimum 60.0 threshold.`
            : `Total score of ${report.totalScore.toFixed(1)} is below the 60.0 threshold. Review recommendations below.`;

        elements.readinessIconBox.innerHTML = isReady
            ? `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

        elements.ratingBandTag.textContent = report.ratingBand;

        // 2. Score Gauge (Inline SVG)
        renderSvgGauge(report.totalScore, isReady);
        elements.gaugePointsDisplay.textContent = report.totalScore.toFixed(1);

        // 3. Metadata summary
        elements.summaryProjectName.textContent = report.buildingName;
        elements.summaryBuildingType.textContent = report.buildingTypeDisplayName;
        elements.summaryStandardName.textContent = report.standardDisplayName;
        elements.summaryRatingLevel.textContent = `${report.ratingBand} (${report.ratingBandDescription})`;
        elements.summaryTimestamp.textContent = new Date().toLocaleString();
        elements.standardDisclaimerText.textContent = `* ${report.ratingBandDescription}`;

        // 4. Category Performance Bars
        elements.categoryBarsContainer.innerHTML = '';
        report.categoryScores.forEach(cs => {
            const barCard = document.createElement('div');
            barCard.className = 'category-bar-card';
            barCard.innerHTML = `
                <div class="cat-bar-header">
                    <span class="cat-bar-title">${escapeHtml(cs.categoryName)}</span>
                    <span class="cat-bar-score">${cs.weightedScore.toFixed(1)} / ${cs.weight.toFixed(1)} pts</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${Math.min(100, Math.max(0, cs.percentage))}%"></div>
                </div>
                <div class="cat-bar-footer">
                    <span>Raw: ${cs.earnedPoints.toFixed(1)} / ${cs.maxPoints.toFixed(1)}</span>
                    <span>${cs.percentage.toFixed(1)}% Compliance</span>
                </div>
            `;
            elements.categoryBarsContainer.appendChild(barCard);
        });

        // 5. Category Improvement Insights & Deficit Analysis (Energy, Water, Materials, Waste)
        renderCategoryImprovementGrid(report);

        // 6. Actionable Recommendations & Tabs
        updateSuggestionTabCounts(report);
        renderFilteredSuggestions();

        // 7. Detailed Criteria Breakdown Table
        elements.criteriaTableBody.innerHTML = '';
        report.ruleResults.forEach(r => {
            const tr = document.createElement('tr');
            let statusBadge = '';
            if (r.achieved) {
                statusBadge = '<span class="status-badge achieved">Achieved</span>';
            } else if (r.earnedPoints > 0) {
                statusBadge = '<span class="status-badge partial">Partial</span>';
            } else {
                statusBadge = '<span class="status-badge zero">Zero</span>';
            }

            let displayVal = r.inputValue;
            if (typeof displayVal === 'boolean') {
                displayVal = displayVal ? 'Yes' : 'No';
            } else if (typeof displayVal === 'number') {
                displayVal = `${displayVal}%`;
            } else if (displayVal === 'EXCEED_30') {
                displayVal = '≥ 30% reduction';
            } else if (displayVal === 'EXCEED_20') {
                displayVal = '20% - 29.9% reduction';
            } else if (displayVal === 'EXCEED_10') {
                displayVal = '10% - 19.9% reduction';
            } else if (displayVal === 'BASELINE') {
                displayVal = '< 10% (Baseline)';
            }

            const deficit = r.pointsAvailable;
            const deficitDisplay = deficit > 0 ? `+${deficit.toFixed(1)} pts` : '—';

            tr.innerHTML = `
                <td><strong>${escapeHtml(r.criterionName)}</strong></td>
                <td>${escapeHtml(r.category)}</td>
                <td>${r.maxPoints.toFixed(1)}</td>
                <td><code>${escapeHtml(String(displayVal))}</code></td>
                <td><strong>${r.earnedPoints.toFixed(1)}</strong></td>
                <td style="color: ${deficit > 0 ? '#b45309' : '#15803d'}; font-weight: 600;">${deficitDisplay}</td>
                <td>${r.compliancePercentage.toFixed(1)}%</td>
                <td>${statusBadge}</td>
            `;
            elements.criteriaTableBody.appendChild(tr);
        });
    }

    /**
     * Render Detailed Category Improvement Cards (Energy, Water, Materials, Waste)
     */
    function renderCategoryImprovementGrid(report) {
        elements.categoryImprovementGrid.innerHTML = '';

        const categories = ['ENERGY', 'WATER', 'MATERIALS', 'WASTE'];

        categories.forEach(catKey => {
            const cs = report.categoryScores.find(c => c.category === catKey);
            if (!cs) return;

            const meta = categoryMeta[catKey];
            const catRules = report.ruleResults.filter(r => r.category === catKey);
            const catSuggestions = report.suggestions.filter(s => s.category === catKey);
            const scoreGap = Math.max(0, cs.weight - cs.weightedScore);
            const isOptimized = scoreGap <= 0.05;

            // Generate user input chips
            let chipsHtml = '';
            catRules.forEach(r => {
                let valStr = String(r.inputValue);
                if (typeof r.inputValue === 'boolean') {
                    valStr = r.inputValue ? 'Yes' : 'No';
                } else if (typeof r.inputValue === 'number') {
                    valStr = `${r.inputValue}%`;
                } else if (r.inputValue === 'EXCEED_30') {
                    valStr = '≥ 30%';
                } else if (r.inputValue === 'EXCEED_20') {
                    valStr = '20 - 29%';
                } else if (r.inputValue === 'EXCEED_10') {
                    valStr = '10 - 19%';
                } else if (r.inputValue === 'BASELINE') {
                    valStr = '< 10%';
                }
                const chipColor = r.achieved ? '#dcfce7' : (r.earnedPoints > 0 ? '#fef3c7' : '#f1f5f9');
                chipsHtml += `<span class="user-data-chip" style="background-color: ${chipColor};">
                    <strong>${escapeHtml(r.criterionId)}:</strong> ${escapeHtml(valStr)}
                </span>`;
            });

            // Generate category improvement action items
            let actionsHtml = '';
            if (isOptimized) {
                actionsHtml = `<div class="cat-action-item" style="color: #15803d;">
                    <span class="cat-action-bullet">✓</span>
                    <span>All criteria in this category have achieved full marks under the active standard.</span>
                </div>`;
            } else {
                catSuggestions.slice(0, 3).forEach(s => {
                    actionsHtml += `
                        <div class="cat-action-item">
                            <span class="cat-action-bullet">▲</span>
                            <span><strong>+${s.pointsAvailable.toFixed(1)} pts:</strong> ${escapeHtml(s.actionTip)}</span>
                        </div>
                    `;
                });
            }

            const card = document.createElement('div');
            card.className = `category-improve-card ${meta.className}`;
            card.innerHTML = `
                <div class="cat-card-header">
                    <div class="cat-card-title-group">
                        <span class="cat-card-icon">${meta.icon}</span>
                        <span class="cat-card-name">${escapeHtml(meta.title)}</span>
                    </div>
                    <span class="cat-card-badge ${isOptimized ? 'optimized' : 'high-gain'}">
                        ${isOptimized ? 'Fully Optimized' : `+${scoreGap.toFixed(1)} pts potential`}
                    </span>
                </div>

                <div class="cat-dual-bar-container">
                    <div class="cat-dual-labels">
                        <span>Current Score: <strong>${cs.weightedScore.toFixed(1)} / ${cs.weight.toFixed(1)} pts</strong></span>
                        <span>${cs.percentage.toFixed(0)}% Achieved</span>
                    </div>
                    <div class="cat-dual-track">
                        <div class="cat-dual-earned" style="width: ${Math.min(100, cs.percentage)}%;"></div>
                        <div class="cat-dual-potential" style="width: ${Math.max(0, 100 - cs.percentage)}%;"></div>
                    </div>
                </div>

                <div class="user-inputs-summary-box">
                    <div class="user-inputs-title">User Submitted Data:</div>
                    <div class="user-chip-wrap">${chipsHtml}</div>
                </div>

                <div class="cat-actions-box">
                    <div class="user-inputs-title">Priority Improvements:</div>
                    ${actionsHtml}
                </div>
            `;

            elements.categoryImprovementGrid.appendChild(card);
        });
    }

    /**
     * Update Category Filter Tab Counts
     */
    function updateSuggestionTabCounts(report) {
        if (!report) return;
        const suggestions = report.suggestions || [];
        elements.countAll.textContent = suggestions.length;
        elements.countEnergy.textContent = suggestions.filter(s => s.category === 'ENERGY').length;
        elements.countWater.textContent = suggestions.filter(s => s.category === 'WATER').length;
        elements.countMaterials.textContent = suggestions.filter(s => s.category === 'MATERIALS').length;
        elements.countWaste.textContent = suggestions.filter(s => s.category === 'WASTE').length;
    }

    /**
     * Render Filtered Actionable Suggestions based on active category tab
     */
    function renderFilteredSuggestions() {
        if (!state.evaluationReport) return;
        const allSuggestions = state.evaluationReport.suggestions || [];
        const filter = state.activeCategoryFilter || 'ALL';

        const filtered = (filter === 'ALL')
            ? allSuggestions
            : allSuggestions.filter(s => s.category === filter);

        elements.suggestionsList.innerHTML = '';

        if (filtered.length === 0) {
            elements.suggestionsList.innerHTML = `
                <div class="suggestion-card" style="border-left-color: var(--success);">
                    <div class="suggestion-content">
                        <div class="suggestion-criterion-name">
                            ${filter === 'ALL' ? 'Flawless Performance' : `${categoryMeta[filter]?.title || filter} Fully Optimized`}
                        </div>
                        <div class="suggestion-tip">All evaluated criteria in this category have achieved full marks under the active rating system.</div>
                    </div>
                </div>
            `;
            return;
        }

        filtered.forEach(s => {
            const meta = categoryMeta[s.category] || { icon: '★' };
            const sCard = document.createElement('div');
            sCard.className = 'suggestion-card';
            sCard.innerHTML = `
                <div class="suggestion-icon">
                    <span style="font-size: 1rem;">${meta.icon}</span>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-header-row">
                        <span class="suggestion-criterion-name">
                            [${escapeHtml(s.categoryName)}] ${escapeHtml(s.criterionName)}
                        </span>
                        <span class="suggestion-potential-badge">+${s.pointsAvailable.toFixed(1)} pts available</span>
                    </div>
                    <div class="suggestion-tip">${escapeHtml(s.actionTip)}</div>
                </div>
            `;
            elements.suggestionsList.appendChild(sCard);
        });
    }

    /**
     * Render Circular SVG Gauge
     */
    function renderSvgGauge(score, isReady) {
        const radius = 72;
        const circumference = 2 * Math.PI * radius;
        const clampedScore = Math.max(0, Math.min(100, score));
        const offset = circumference - (clampedScore / 100) * circumference;
        const strokeColor = isReady ? '#10b981' : '#f59e0b';

        elements.gaugeContainer.innerHTML = `
            <svg class="gauge-svg" width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="14" />
                <circle cx="90" cy="90" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="14"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease;" />
            </svg>
            <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 2.2rem; font-weight: 800; color: #0f172a; line-height: 1;">${clampedScore.toFixed(1)}</span>
                <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">SCORE</span>
            </div>
        `;
    }

    /**
     * Load Sample Data (Fully compliant office building)
     */
    async function loadSampleData() {
        clearError();
        elements.buildingNameInput.value = 'Apex Green Horizon Campus';
        elements.buildingTypeSelect.value = 'OFFICE';
        state.selectedBuildingType = 'OFFICE';
        state.formData.buildingName = 'Apex Green Horizon Campus';
        state.formData.buildingType = 'OFFICE';

        // Select GRIHA
        const grihaRadio = document.querySelector('input[name="standardChoice"][value="GRIHA"]');
        if (grihaRadio) grihaRadio.checked = true;
        state.selectedStandard = 'GRIHA';
        state.formData.standard = 'GRIHA';
        updateStandardInfo();

        // Sample values that achieve ~92.6 points (Certification Ready, 5-Star)
        state.formData.values = {
            'energy_epi': 'EXCEED_30',      // 10 pts
            'energy_renewable': 25.0,        // ~6.7 pts
            'energy_lighting': 95.0,         // ~5.7 pts
            'energy_passive_hvac': true,     // 6 pts
            'water_rainwater': true,         // 8 pts
            'water_low_flow': 85.0,          // ~5.9 pts
            'water_recycling': 80.0,         // ~4.8 pts
            'water_landscaping': true,       // 4 pts
            'mat_recycled': 24.0,            // ~5.6 pts
            'mat_regional': 65.0,            // ~6.5 pts
            'mat_low_voc': true,             // 5 pts
            'mat_blended_cement': 40.0,      // ~4.8 pts
            'waste_diversion': 70.0,         // ~6.5 pts
            'waste_organic': true,           // 5 pts
            'waste_segregation': true,       // 4 pts
            'waste_hazardous': true          // 4 pts
        };

        await loadCriteria();
        updateAllLiveTrackers();
        goToStep(1);
    }

    /**
     * Reset Form
     */
    async function resetForm() {
        clearError();
        elements.buildingNameInput.value = '';
        elements.buildingTypeSelect.value = 'OFFICE';
        state.selectedBuildingType = 'OFFICE';
        state.selectedStandard = 'GRIHA';
        const grihaRadio = document.querySelector('input[name="standardChoice"][value="GRIHA"]');
        if (grihaRadio) grihaRadio.checked = true;

        state.formData = {
            buildingName: '',
            buildingType: 'OFFICE',
            standard: 'GRIHA',
            values: {}
        };
        state.evaluationReport = null;
        state.activeCategoryFilter = 'ALL';

        updateStandardInfo();
        await loadCriteria();
        updateAllLiveTrackers();
        goToStep(1);
    }

    /**
     * Display Validation Error
     */
    function showError(msg) {
        elements.stepErrorBanner.textContent = msg;
        elements.stepErrorBanner.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearError() {
        elements.stepErrorBanner.textContent = '';
        elements.stepErrorBanner.style.display = 'none';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Bootstrap app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

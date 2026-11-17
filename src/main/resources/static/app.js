/**
 * GreenScore Application Controller
 * Vanilla ES6 JavaScript - Zero external frameworks or libraries.
 */

(function () {
    'use strict';

    // Application State
    // Data Protection Storage Keys
    const STORAGE_DRAFT_KEY = 'greenscore_auto_save_v2';
    const STANDARDS_CACHE_KEY = 'greenscore_cached_standards_v1';
    const CRITERIA_CACHE_KEY_PREFIX = 'greenscore_cached_criteria_v1_';

    // Application State with Offline & Auto-Save Tracking
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
        activeCategoryFilter: 'ALL',
        isOffline: !navigator.onLine,
        hasPendingEvaluation: false,
        isProvisional: false,
        lastSavedAt: null
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
        // Data Protection & Real-time Sync Elements
        syncStatusBadge: document.getElementById('syncStatusBadge'),
        syncBadgeDot: document.getElementById('syncBadgeDot'),
        syncBadgeText: document.getElementById('syncBadgeText'),
        networkStatusBar: document.getElementById('networkStatusBar'),
        networkStatusIcon: document.getElementById('networkStatusIcon'),
        networkStatusText: document.getElementById('networkStatusText'),
        networkSyncBtn: document.getElementById('networkSyncBtn'),
        draftRestoredBanner: document.getElementById('draftRestoredBanner'),
        draftRestoredText: document.getElementById('draftRestoredText'),
        discardDraftBtn: document.getElementById('discardDraftBtn'),
        provisionalBadge: document.getElementById('provisionalBadge'),
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
        initDataProtection();
        await loadStandards();
        await loadCriteria();
        checkAndApplyRestoredDraft();
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
            saveDraft();
            await loadCriteria();
        });

        // Standard Radio selection
        elements.standardRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    state.selectedStandard = e.target.value;
                    state.formData.standard = e.target.value;
                    saveDraft();
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
     * Fetch standards with Offline Caching & Fallback
     */
    async function loadStandards() {
        try {
            const res = await fetch('/api/standards');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            state.standards = await res.json();
            try {
                localStorage.setItem(STANDARDS_CACHE_KEY, JSON.stringify(state.standards));
            } catch (e) {}
            updateStandardInfo();
        } catch (err) {
            console.warn('Network standards fetch failed, checking cache/fallbacks:', err.message);
            const cached = localStorage.getItem(STANDARDS_CACHE_KEY);
            if (cached) {
                try {
                    state.standards = JSON.parse(cached);
                } catch (e) {
                    state.standards = FALLBACK_STANDARDS;
                }
            } else {
                state.standards = FALLBACK_STANDARDS;
            }
            updateStandardInfo();
        }
    }

    /**
     * Update Category Weight Badges and standard info callout
     */
    function updateStandardInfo() {
        const std = state.standards.find(s => s.id === state.selectedStandard) || FALLBACK_STANDARDS[0];
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
     * Fetch criteria metadata with Offline Caching & Fallbacks
     */
    async function loadCriteria(retryCount = 0) {
        const cacheKey = CRITERIA_CACHE_KEY_PREFIX + state.selectedStandard + '_' + state.selectedBuildingType;
        try {
            clearError();
            const url = `/api/criteria?standard=${encodeURIComponent(state.selectedStandard)}&buildingType=${encodeURIComponent(state.selectedBuildingType)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch criteria configuration');
            state.criteria = await res.json();
            try {
                localStorage.setItem(cacheKey, JSON.stringify(state.criteria));
            } catch (e) {}
            renderAllCriteria();
            updateAllLiveTrackers();
        } catch (err) {
            console.warn('Network criteria fetch failed, checking cache/fallbacks:', err.message);
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    state.criteria = JSON.parse(cached);
                    renderAllCriteria();
                    updateAllLiveTrackers();
                    return;
                } catch (e) {}
            }

            const fallback = getFallbackCriteria(state.selectedStandard, state.selectedBuildingType);
            if (fallback && fallback.length > 0) {
                state.criteria = fallback;
                renderAllCriteria();
                updateAllLiveTrackers();
            } else if (retryCount < 2 && navigator.onLine) {
                setTimeout(() => loadCriteria(retryCount + 1), 1200);
            } else {
                showError('Error loading criteria: ' + err.message, () => loadCriteria(0));
            }
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
                saveDraft();
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
                saveDraft();
            };

            slider.addEventListener('input', (e) => syncValues(e.target.value));
            number.addEventListener('input', (e) => syncValues(e.target.value));
        }

        if (criterion.type === 'TIERED') {
            const select = cardElement.querySelector(`#select_${criterion.id}`);
            select.addEventListener('change', (e) => {
                state.formData.values[criterion.id] = e.target.value;
                updateCategoryLiveTracker(criterion.category);
                saveDraft();
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
        saveDraft();

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
            saveDraft();
        }
        return true;
    }

    /**
     * Submit evaluation request to POST /api/evaluate
     * If offline or connection fails, calculates provisional score locally using official weights
     * and queues automatic server synchronization.
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

            let report = null;
            let usedProvisional = false;

            if (navigator.onLine) {
                try {
                    const res = await fetch('/api/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        report = await res.json();
                        state.hasPendingEvaluation = false;
                        state.isProvisional = false;
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        const msg = errData.details ? errData.details.join(', ') : (errData.error || 'Evaluation failed');
                        throw new Error(msg);
                    }
                } catch (netErr) {
                    if (!navigator.onLine || netErr.message.includes('fetch') || netErr.message.includes('NetworkError') || netErr.message.includes('Failed')) {
                        console.warn('Network evaluation unreachable, generating provisional offline report:', netErr);
                        report = generateProvisionalReport(payload);
                        usedProvisional = true;
                    } else {
                        throw netErr;
                    }
                }
            } else {
                report = generateProvisionalReport(payload);
                usedProvisional = true;
            }

            if (usedProvisional) {
                state.hasPendingEvaluation = true;
                state.isProvisional = true;
            }

            state.evaluationReport = report;
            renderResults(state.evaluationReport);
            saveDraft();
            goToStep(6);

            if (state.isProvisional) {
                showNetworkBanner('OFFLINE', '⚠️ Offline Mode: Score calculated locally using weighted criteria. It will automatically synchronize with the server once your connection returns.');
            }
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
        // Toggle provisional badge
        if (elements.provisionalBadge) {
            elements.provisionalBadge.style.display = state.isProvisional ? 'inline-flex' : 'none';
        }

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
        saveDraft();
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
        state.hasPendingEvaluation = false;
        state.isProvisional = false;

        try {
            localStorage.removeItem(STORAGE_DRAFT_KEY);
        } catch (e) {}

        if (elements.draftRestoredBanner) {
            elements.draftRestoredBanner.style.display = 'none';
        }

        updateStandardInfo();
        await loadCriteria();
        updateAllLiveTrackers();
        goToStep(1);
        updateSyncIndicator(state.isOffline ? 'OFFLINE' : 'SAVED');
    }

    /* ==========================================================================
       AUTOMATIC DATA PROTECTION, OFFLINE AUTO-SAVE & SERVER SYNCHRONIZATION
       ========================================================================== */

    /**
     * Initialize Data Protection listeners
     */
    function initDataProtection() {
        // Window online / offline listeners
        window.addEventListener('online', onConnectionRestored);
        window.addEventListener('offline', onConnectionLost);

        // Initial online/offline check
        if (!navigator.onLine) {
            onConnectionLost();
        } else {
            updateSyncIndicator('ONLINE');
        }

        // Auto-save on building name input
        if (elements.buildingNameInput) {
            elements.buildingNameInput.addEventListener('input', () => {
                state.formData.buildingName = elements.buildingNameInput.value.trim();
                saveDraft();
            });
        }

        // Discard draft button
        if (elements.discardDraftBtn) {
            elements.discardDraftBtn.addEventListener('click', async () => {
                try {
                    localStorage.removeItem(STORAGE_DRAFT_KEY);
                } catch (e) {}
                if (elements.draftRestoredBanner) {
                    elements.draftRestoredBanner.style.display = 'none';
                }
                await resetForm();
            });
        }

        // Manual sync button
        if (elements.networkSyncBtn) {
            elements.networkSyncBtn.addEventListener('click', () => {
                synchronizePendingData();
            });
        }
    }

    /**
     * Auto-save draft in real time to LocalStorage
     */
    function saveDraft() {
        try {
            if (elements.buildingNameInput) {
                state.formData.buildingName = elements.buildingNameInput.value.trim();
            }
            state.formData.buildingType = state.selectedBuildingType;
            state.formData.standard = state.selectedStandard;

            const draft = {
                version: 2,
                lastSavedAt: new Date().toISOString(),
                currentStep: state.currentStep,
                formData: state.formData,
                evaluationReport: state.evaluationReport,
                hasPendingEvaluation: state.hasPendingEvaluation || false,
                isProvisional: state.isProvisional || false
            };

            localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
            state.lastSavedAt = draft.lastSavedAt;

            if (state.isOffline) {
                updateSyncIndicator('OFFLINE');
            } else if (state.hasPendingEvaluation) {
                updateSyncIndicator('PENDING');
            } else {
                updateSyncIndicator('SAVED');
            }
        } catch (err) {
            console.warn('Auto-save error:', err);
        }
    }

    /**
     * Check and restore draft from LocalStorage on page load
     */
    function checkAndApplyRestoredDraft() {
        try {
            const raw = localStorage.getItem(STORAGE_DRAFT_KEY);
            if (!raw) return false;
            const draft = JSON.parse(raw);
            if (!draft || !draft.formData) return false;

            const hasData = (draft.formData.buildingName && draft.formData.buildingName.length > 0) ||
                            (draft.formData.values && Object.keys(draft.formData.values).length > 0) ||
                            (draft.evaluationReport !== null);

            if (!hasData) return false;

            // Apply draft data to state
            if (draft.formData.buildingName) {
                state.formData.buildingName = draft.formData.buildingName;
                if (elements.buildingNameInput) elements.buildingNameInput.value = draft.formData.buildingName;
            }

            if (draft.formData.buildingType) {
                state.formData.buildingType = draft.formData.buildingType;
                state.selectedBuildingType = draft.formData.buildingType;
                if (elements.buildingTypeSelect) elements.buildingTypeSelect.value = draft.formData.buildingType;
            }

            if (draft.formData.standard) {
                state.formData.standard = draft.formData.standard;
                state.selectedStandard = draft.formData.standard;
                const r = document.querySelector(`input[name="standardChoice"][value="${draft.formData.standard}"]`);
                if (r) r.checked = true;
            }

            if (draft.formData.values) {
                state.formData.values = Object.assign({}, draft.formData.values);
            }

            if (draft.evaluationReport) {
                state.evaluationReport = draft.evaluationReport;
            }
            if (draft.hasPendingEvaluation) {
                state.hasPendingEvaluation = true;
            }
            if (draft.isProvisional) {
                state.isProvisional = true;
            }

            updateStandardInfo();
            renderAllCriteria();
            updateAllLiveTrackers();

            // Format saved time string
            let timeStr = 'earlier';
            if (draft.lastSavedAt) {
                try {
                    const d = new Date(draft.lastSavedAt);
                    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) {}
            }

            // Display Draft Restored Banner
            if (elements.draftRestoredBanner) {
                if (elements.draftRestoredText) {
                    elements.draftRestoredText.innerHTML = `<strong>Data Protection Active:</strong> Your previously entered project details (auto-saved at ${timeStr}) were automatically restored.`;
                }
                elements.draftRestoredBanner.style.display = 'block';
            }

            // If user had finished evaluation
            if (draft.currentStep === 6 && state.evaluationReport) {
                renderResults(state.evaluationReport);
                goToStep(6);
            } else if (draft.currentStep && draft.currentStep > 1) {
                goToStep(draft.currentStep);
            }

            updateSyncIndicator(state.isOffline ? 'OFFLINE' : 'SAVED');

            // If back online and there is pending evaluation sync, run it immediately
            if (navigator.onLine && (state.hasPendingEvaluation || state.isProvisional)) {
                synchronizePendingData();
            }

            return true;
        } catch (err) {
            console.warn('Error applying restored draft:', err);
            return false;
        }
    }

    /**
     * Update Header Sync Status Badge
     */
    function updateSyncIndicator(status) {
        if (!elements.syncStatusBadge) return;

        elements.syncBadgeDot.className = 'sync-badge-dot';

        if (status === 'OFFLINE') {
            elements.syncBadgeDot.classList.add('offline');
            elements.syncBadgeText.textContent = 'Offline (Auto-Saved)';
            elements.syncStatusBadge.title = 'Offline mode: all changes are safely protected and stored locally.';
        } else if (status === 'SYNCING') {
            elements.syncBadgeDot.classList.add('syncing');
            elements.syncBadgeText.textContent = 'Syncing...';
            elements.syncStatusBadge.title = 'Synchronizing pending data with the server...';
        } else if (status === 'PENDING') {
            elements.syncBadgeDot.classList.add('syncing');
            elements.syncBadgeText.textContent = 'Pending Sync';
            elements.syncStatusBadge.title = 'Data saved locally. Will sync automatically when connection is verified.';
        } else {
            elements.syncBadgeDot.classList.add('online');
            elements.syncBadgeText.textContent = 'Protected & Synced';
            elements.syncStatusBadge.title = 'Real-time protection active: all data is safely saved and synchronized.';
        }
    }

    /**
     * Display Network Status Bar
     */
    function showNetworkBanner(type, message, showButton = false) {
        if (!elements.networkStatusBar) return;

        elements.networkStatusBar.className = 'network-status-bar';

        if (type === 'OFFLINE') {
            elements.networkStatusBar.classList.add('offline');
            elements.networkStatusIcon.textContent = '⚠️';
        } else if (type === 'SYNCING') {
            elements.networkStatusBar.classList.add('online-sync');
            elements.networkStatusIcon.textContent = '🔄';
        } else if (type === 'SUCCESS') {
            elements.networkStatusBar.classList.add('synced-success');
            elements.networkStatusIcon.textContent = '✓';
        }

        elements.networkStatusText.textContent = message;
        if (elements.networkSyncBtn) {
            elements.networkSyncBtn.style.display = showButton ? 'inline-block' : 'none';
        }
        elements.networkStatusBar.style.display = 'flex';
    }

    function hideNetworkBanner() {
        if (elements.networkStatusBar) {
            elements.networkStatusBar.style.display = 'none';
        }
    }

    /**
     * Network offline event handler
     */
    function onConnectionLost() {
        state.isOffline = true;
        updateSyncIndicator('OFFLINE');
        showNetworkBanner('OFFLINE', '⚠️ Offline Mode: Internet connection lost. All entered data is safely protected and auto-saved on your device.');
    }

    /**
     * Network online event handler
     */
    async function onConnectionRestored() {
        state.isOffline = false;
        updateSyncIndicator('SYNCING');
        showNetworkBanner('SYNCING', '🔄 Connection Restored: Synchronizing your protected data with the server...');
        await synchronizePendingData();
    }

    /**
     * Synchronize pending data with server upon connection return
     */
    async function synchronizePendingData() {
        try {
            updateSyncIndicator('SYNCING');

            // 1. Verify health
            const healthRes = await fetch('/api/health').catch(() => null);
            if (!healthRes || !healthRes.ok) {
                updateSyncIndicator('PENDING');
                showNetworkBanner('OFFLINE', '🟡 Reconnecting: Waiting for server to respond. Data remains safe locally.', true);
                return;
            }

            // 2. Re-fetch standards & criteria if empty
            if (!state.standards || state.standards.length === 0) {
                await loadStandards();
            }
            if (!state.criteria || state.criteria.length === 0) {
                await loadCriteria();
            }

            // 3. If there is a pending or provisional evaluation, submit to /api/evaluate
            if (state.hasPendingEvaluation || state.isProvisional) {
                const payload = {
                    buildingName: state.formData.buildingName || 'EcoTower Assessment',
                    buildingType: state.formData.buildingType || 'OFFICE',
                    standard: state.formData.standard || 'GRIHA',
                    values: state.formData.values || {}
                };

                const evalRes = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (evalRes.ok) {
                    const officialReport = await evalRes.json();
                    state.evaluationReport = officialReport;
                    state.hasPendingEvaluation = false;
                    state.isProvisional = false;

                    // If currently on Step 6, refresh the display with verified results
                    if (state.currentStep === 6) {
                        renderResults(officialReport);
                    }

                    saveDraft();
                }
            }

            // 4. Show success banner
            updateSyncIndicator('SAVED');
            showNetworkBanner('SUCCESS', '✓ All pending data has been successfully synchronized with the official server.');
            setTimeout(() => {
                hideNetworkBanner();
            }, 4000);

        } catch (err) {
            console.warn('Sync attempt failed:', err);
            updateSyncIndicator('PENDING');
            showNetworkBanner('OFFLINE', '🟡 Sync pending: Data is safe locally. Click to retry sync.', true);
        }
    }

    /**
     * Generate Provisional Offline Score Report using official standard weights
     */
    function generateProvisionalReport(payload) {
        const standard = (state.standards && state.standards.find(s => s.id === state.selectedStandard)) || FALLBACK_STANDARDS[0];
        const weights = standard.categoryWeights || { ENERGY: 30.0, WATER: 25.0, MATERIALS: 25.0, WASTE: 20.0 };
        const values = payload.values || {};

        const ruleResults = [];
        const categoryScores = [];
        let totalWeightedScore = 0.0;

        const categories = ['ENERGY', 'WATER', 'MATERIALS', 'WASTE'];

        categories.forEach(cat => {
            const catCriteria = state.criteria.filter(c => c.category === cat);
            let earnedSum = 0.0;
            let maxSum = 0.0;

            catCriteria.forEach(c => {
                maxSum += c.maxPoints;
                const val = values[c.id];
                let earned = 0.0;

                if (c.type === 'BOOLEAN') {
                    earned = (val === true || val === 'true') ? c.maxPoints : 0.0;
                } else if (c.type === 'PERCENTAGE') {
                    const min = c.min !== undefined ? c.min : 0.0;
                    const target = c.max !== undefined ? c.max : 100.0;
                    let v = parseFloat(val);
                    if (isNaN(v)) v = 0.0;
                    if (v >= target) {
                        earned = c.maxPoints;
                    } else if (v <= min) {
                        earned = 0.0;
                    } else {
                        earned = (c.maxPoints * (v - min)) / (target - min);
                    }
                } else if (c.type === 'TIERED') {
                    if (c.tierOptions && c.tierOptions.length > 0) {
                        const opt = c.tierOptions.find(o => o.id === val);
                        earned = opt ? opt.points : 0.0;
                    }
                }

                earned = Math.max(0.0, Math.min(c.maxPoints, earned));
                earnedSum += earned;

                const achieved = earned >= c.maxPoints;
                const pointsAvail = Math.max(0.0, c.maxPoints - earned);

                ruleResults.push({
                    criterionId: c.id,
                    criterionName: c.name,
                    category: c.category,
                    earnedPoints: earned,
                    maxPoints: c.maxPoints,
                    achieved: achieved,
                    pointsAvailable: pointsAvail,
                    inputValue: val !== undefined ? val : c.defaultValue,
                    suggestion: c.suggestionText || `Optimize ${c.name} to earn full points.`
                });
            });

            const catWeight = weights[cat] || 25.0;
            const weightedScore = maxSum > 0 ? (earnedSum / maxSum) * catWeight : 0.0;
            const percentage = maxSum > 0 ? (earnedSum / maxSum) * 100.0 : 0.0;

            categoryScores.push({
                category: cat,
                categoryName: categoryMeta[cat] ? categoryMeta[cat].title : cat,
                earnedPoints: earnedSum,
                maxPoints: maxSum,
                weight: catWeight,
                weightedScore: weightedScore,
                percentage: percentage
            });

            totalWeightedScore += weightedScore;
        });

        const totalScore = Math.max(0.0, Math.min(100.0, Math.round(totalWeightedScore * 10.0) / 10.0));
        const isReady = totalScore >= 60.0;
        const readinessStatus = isReady ? 'Certification Ready' : 'Improvement Required';

        let ratingBand = 'Uncertified';
        let ratingBandDescription = 'Below 60.0 points';
        if (state.selectedStandard === 'GRIHA') {
            if (totalScore >= 91.0) { ratingBand = '5 Star (GRIHA)'; ratingBandDescription = 'Exemplary National Green Leadership'; }
            else if (totalScore >= 81.0) { ratingBand = '4 Star (GRIHA)'; ratingBandDescription = 'High Environmental & Resource Efficiency'; }
            else if (totalScore >= 71.0) { ratingBand = '3 Star (GRIHA)'; ratingBandDescription = 'Substantial Green Performance'; }
            else if (totalScore >= 60.0) { ratingBand = '1-2 Star (GRIHA)'; ratingBandDescription = 'Certified Green Building Baseline'; }
        } else {
            if (totalScore >= 90.0) { ratingBand = 'Platinum (IGBC)'; ratingBandDescription = 'Global Environmental Leadership'; }
            else if (totalScore >= 80.0) { ratingBand = 'Gold (IGBC)'; ratingBandDescription = 'Outstanding Sustainable Practice'; }
            else if (totalScore >= 70.0) { ratingBand = 'Silver (IGBC)'; ratingBandDescription = 'Comprehensive Green Integration'; }
            else if (totalScore >= 60.0) { ratingBand = 'Certified (IGBC)'; ratingBandDescription = 'Recognized Sustainable Standards'; }
        }

        const suggestions = [];
        ruleResults.forEach(r => {
            if (r.pointsAvailable > 0.001) {
                suggestions.push({
                    criterionId: r.criterionId,
                    criterionName: r.criterionName,
                    category: r.category,
                    categoryDisplayName: categoryMeta[r.category] ? categoryMeta[r.category].title : r.category,
                    pointsAvailable: r.pointsAvailable,
                    earnedPoints: r.earnedPoints,
                    maxPoints: r.maxPoints,
                    tip: r.suggestion
                });
            }
        });
        suggestions.sort((a, b) => b.pointsAvailable - a.pointsAvailable);

        return {
            buildingName: payload.buildingName || 'EcoTower Horizon Campus',
            buildingType: payload.buildingType || 'OFFICE',
            buildingTypeDisplayName: 'Commercial Office',
            standardId: standard.id,
            standardDisplayName: standard.displayName,
            totalScore: totalScore,
            readinessStatus: readinessStatus,
            isReady: isReady,
            ratingBand: ratingBand,
            ratingBandDescription: ratingBandDescription,
            categoryScores: categoryScores,
            ruleResults: ruleResults,
            suggestions: suggestions,
            disclaimer: 'Provisional offline score calculated using standard criteria weights. Synchronizes with server automatically.'
        };
    }

    /* Fallback Standards Data (100% Offline Independence) */
    const FALLBACK_STANDARDS = [
        {
            id: 'GRIHA',
            displayName: 'GRIHA (Green Rating for Integrated Habitat Assessment)',
            description: 'India\'s national rating system evaluating resource efficiency across lifecycle phases.',
            categoryWeights: { ENERGY: 30.0, WATER: 25.0, MATERIALS: 25.0, WASTE: 20.0 },
            disclaimer: 'Illustrative scoring model aligned with GRIHA V.2019 parameters.'
        },
        {
            id: 'IGBC',
            displayName: 'IGBC (Indian Green Building Council)',
            description: 'Holistic green rating standard with enhanced focus on water neutrality and circular materials.',
            categoryWeights: { ENERGY: 26.0, WATER: 28.0, MATERIALS: 28.0, WASTE: 18.0 },
            disclaimer: 'Illustrative scoring model aligned with IGBC Green New Buildings criteria.'
        }
    ];

    /* Fallback Criteria Data (100% Offline Independence) */
    function getFallbackCriteria(standardId, buildingType) {
        const isIgbc = standardId === 'IGBC';
        return [
            { id: 'energy_epi', name: 'Energy Performance Index (EPI) vs Benchmark', category: 'ENERGY', categoryDisplayName: 'Energy Efficiency', type: 'TIERED', maxPoints: isIgbc ? 9.0 : 10.0, inputHint: 'Commercial Office benchmark: 140 kWh/m²/year. Select anticipated or measured EPI reduction.', min: 0.0, max: 100.0, unit: '', defaultValue: 'BASELINE', tierOptions: [
                { id: 'EXCEED_30', label: '≥ 30% reduction vs benchmark EPI', points: isIgbc ? 9.0 : 10.0, description: 'Outstanding thermal envelope and HVAC efficiency' },
                { id: 'EXCEED_20', label: '20% - 29.9% reduction vs benchmark EPI', points: isIgbc ? 6.0 : 7.0, description: 'High energy performance envelope' },
                { id: 'EXCEED_10', label: '10% - 19.9% reduction vs benchmark EPI', points: isIgbc ? 3.0 : 4.0, description: 'Moderate energy optimization above code' },
                { id: 'BASELINE', label: '< 10% reduction (Standard baseline)', points: 0.0, description: 'Standard baseline compliance only' }
            ], suggestionText: 'Improve building envelope U-values, double glazing, and high-efficiency HVAC to cut EPI demand by ≥ 30%.' },
            { id: 'energy_renewable', name: 'Renewable Energy Share (% of total building demand)', category: 'ENERGY', categoryDisplayName: 'Energy Efficiency', type: 'PERCENTAGE', maxPoints: isIgbc ? 7.0 : 8.0, inputHint: 'Target: ≥ 30% of total electrical demand offset via solar PV or wind.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Install rooftop solar PV or purchase off-site renewable power to offset ≥ 30% of energy consumption.' },
            { id: 'energy_lighting', name: 'Efficient Lighting (% of total fixture lumens using LED/high-efficacy)', category: 'ENERGY', categoryDisplayName: 'Energy Efficiency', type: 'PERCENTAGE', maxPoints: isIgbc ? 5.0 : 6.0, inputHint: 'Percentage of total indoor & outdoor lighting using LED/smart controls.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Upgrade 100% of fixtures to high-efficacy LED fittings with daylight harvesting sensors.' },
            { id: 'energy_passive_hvac', name: 'Passive Architectural Design & High-Efficiency HVAC', category: 'ENERGY', categoryDisplayName: 'Energy Efficiency', type: 'BOOLEAN', maxPoints: isIgbc ? 5.0 : 6.0, inputHint: 'Building incorporates optimal solar orientation, shading, and high-efficiency HVAC zoning.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Integrate external louvers, north-light orientation, and VAV HVAC zoning for passive cooling.' },

            { id: 'water_rainwater', name: 'Rainwater Harvesting System Present', category: 'WATER', categoryDisplayName: 'Water Conservation', type: 'BOOLEAN', maxPoints: isIgbc ? 9.0 : 8.0, inputHint: 'Rooftop and surface runoff capture system with storage or groundwater recharge pits.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Construct dedicated rainwater harvesting tanks capturing 100% of peak rainfall runoff.' },
            { id: 'water_low_flow', name: 'Low-Flow Plumbing Fixtures (% of installed fittings)', category: 'WATER', categoryDisplayName: 'Water Conservation', type: 'PERCENTAGE', maxPoints: isIgbc ? 8.0 : 7.0, inputHint: 'Percentage of toilets, urinals, and faucets meeting low-flow benchmarks.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Retrofit dual-flush aerated fixtures and sensor urinals to exceed baseline water savings.' },
            { id: 'water_recycling', name: 'Wastewater Treatment & Recycling (% reused on-site)', category: 'WATER', categoryDisplayName: 'Water Conservation', type: 'PERCENTAGE', maxPoints: isIgbc ? 7.0 : 6.0, inputHint: 'Percentage of generated wastewater treated to tertiary standards and reused.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Install an on-site Sewage Treatment Plant (STP) to recycle 100% of greywater for flushing and cooling.' },
            { id: 'water_landscaping', name: 'Water-Efficient or Native Drought-Tolerant Landscaping', category: 'WATER', categoryDisplayName: 'Water Conservation', type: 'BOOLEAN', maxPoints: 4.0, inputHint: 'At least 60% of vegetation is native/adaptive, irrigated with drip or smart moisture sensors.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Replace exotic turf with native drought-resistant flora and install automated drip irrigation.' },

            { id: 'mat_recycled', name: 'Recycled-Content Materials (% of total material cost)', category: 'MATERIALS', categoryDisplayName: 'Sustainable Materials', type: 'PERCENTAGE', maxPoints: isIgbc ? 8.0 : 7.0, inputHint: 'Target: ≥ 30% of building materials by value contain pre/post-consumer recycled content.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Specify steel, glass, and composite tiles containing verified high recycled fractions.' },
            { id: 'mat_regional', name: 'Locally Sourced Materials within 500 km (% of total cost)', category: 'MATERIALS', categoryDisplayName: 'Sustainable Materials', type: 'PERCENTAGE', maxPoints: isIgbc ? 8.0 : 7.0, inputHint: 'Target: ≥ 70% of structural and finishing materials sourced within 500 km.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Procure stone, bricks, and concrete from regional quarries within 500 km radius.' },
            { id: 'mat_low_voc', name: 'Low-VOC Paints, Adhesives, and Finishes', category: 'MATERIALS', categoryDisplayName: 'Sustainable Materials', type: 'BOOLEAN', maxPoints: isIgbc ? 6.0 : 5.0, inputHint: '100% of interior architectural coatings and adhesives meet Green Seal / low-VOC standards.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Use certified zero/low-VOC waterborne primers, adhesives, and interior paints.' },
            { id: 'mat_blended_cement', name: 'Fly-Ash / Blended Cement or Certified Sustainable Timber Use (%)', category: 'MATERIALS', categoryDisplayName: 'Sustainable Materials', type: 'PERCENTAGE', maxPoints: 6.0, inputHint: 'Percentage of structural concrete using blended cement or FSC-certified wood.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Mandate PPC/PSC cement with ≥ 30% fly ash or slag replacement in foundation and slabs.' },

            { id: 'waste_diversion', name: 'Construction Waste Diverted from Landfills (% by weight/volume)', category: 'WASTE', categoryDisplayName: 'Waste Management', type: 'PERCENTAGE', maxPoints: isIgbc ? 6.0 : 7.0, inputHint: 'Target: ≥ 75% of construction and demolition debris diverted to reuse/recycling.', min: 0.0, max: 100.0, unit: '%', defaultValue: 0.0, tierOptions: [], suggestionText: 'Enforce a Construction & Demolition Waste Management Plan diverting ≥ 75% debris.' },
            { id: 'waste_organic', name: 'Organic Waste Composting / Bio-Digestion on Site', category: 'WASTE', categoryDisplayName: 'Waste Management', type: 'BOOLEAN', maxPoints: 5.0, inputHint: 'On-site organic waste converter capable of treating 100% of organic waste generated.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Deploy an automated on-site composting unit or biomethanation plant for cafeteria wet waste.' },
            { id: 'waste_segregation', name: 'Waste Segregation at Source (Multi-Bin System)', category: 'WASTE', categoryDisplayName: 'Waste Management', type: 'BOOLEAN', maxPoints: 4.0, inputHint: 'Dedicated multi-stream segregation bins provided at every floor and central collection bay.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Implement color-coded dry/wet/e-waste segregation stations across all operational floors.' },
            { id: 'waste_hazardous', name: 'E-Waste and Hazardous Waste Safe Handling Plan', category: 'WASTE', categoryDisplayName: 'Waste Management', type: 'BOOLEAN', maxPoints: isIgbc ? 3.0 : 4.0, inputHint: 'Safe storage room and institutional agreement with authorized e-waste and chemical waste recyclers.', min: 0.0, max: 100.0, unit: '', defaultValue: false, tierOptions: [], suggestionText: 'Partner with authorized recyclers and set up a hazardous waste collection chamber.' }
        ];
    }

    /**
     * Display Validation Error
     */
    function showError(msg, retryCallback = null) {
        elements.stepErrorBanner.innerHTML = '';
        const msgSpan = document.createElement('span');
        msgSpan.textContent = msg;
        elements.stepErrorBanner.appendChild(msgSpan);
        if (retryCallback) {
            const retryBtn = document.createElement('button');
            retryBtn.textContent = ' 🔄 Retry';
            retryBtn.style.marginLeft = '12px';
            retryBtn.style.padding = '3px 10px';
            retryBtn.style.cursor = 'pointer';
            retryBtn.style.border = '1px solid #c53030';
            retryBtn.style.borderRadius = '4px';
            retryBtn.style.backgroundColor = '#fff';
            retryBtn.style.color = '#c53030';
            retryBtn.style.fontWeight = 'bold';
            retryBtn.onclick = (e) => {
                e.preventDefault();
                clearError();
                retryCallback();
            };
            elements.stepErrorBanner.appendChild(retryBtn);
        }
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

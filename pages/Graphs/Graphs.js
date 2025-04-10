document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        showCyberAlert("SYSTEM BREACH: Authentication Required", "error");
        window.location.href = "/login";
        return;
    }

    // Get CSS variables for neon colors
    const root = document.documentElement;
    const neonGreen = getComputedStyle(root).getPropertyValue('--neon-green').trim();
    const neonPurple = getComputedStyle(root).getPropertyValue('--neon-purple').trim();

    // Chart instances cache and config store
    let charts = {};
    let chartConfigs = {};

    // Fetch vehicles with cyberpunk error handling
    try {
        const res = await fetch("http://localhost:5000/api/vehicles/my-vehicles", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const vehicles = await res.json();
        populateVehicleSelect(vehicles);
    } catch (error) {
        showCyberAlert(`NETWORK ERROR: ${error.message}`, "error");
    }

    function populateVehicleSelect(vehicles) {
        const vehicleSelect = document.getElementById("vehicleSelect");
        vehicleSelect.innerHTML = '<option value="">-- SELECT VEHICLE --</option>';
        
        vehicles.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle._id;
            option.innerHTML = `
                ${vehicle.vehicleName || "UNNAMED VEHICLE"} 
                <span class="neon-purple">// ${vehicle.vehicleModel}</span>
            `;
            vehicleSelect.appendChild(option);
        });
    }

    async function loadGraphs() {
        const vehicleId = document.getElementById("vehicleSelect").value;
        if (!vehicleId) {
            showCyberAlert("SYSTEM QUERY: Select vehicle profile", "error");
            return;
        }

        clearCharts();

        try {
            const res = await fetch(`http://localhost:5000/api/sessions/vehicle/${vehicleId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Data fetch failed: ${res.status}`);
            
            const sessions = await res.json();
            if (sessions.length === 0) {
                showCyberAlert("NO DATA STREAMS FOUND", "error");
                return;
            }

            processDataStreams(sessions);
        } catch (error) {
            showCyberAlert(`DATA CORRUPTION: ${error.message}`, "error");
        }
    }

    function processDataStreams(sessions) {
        const metrics = {
            depthOfDischarge: {
                label: "Depth of Discharge (%)",
                data: sessions.map(s => parseFloat(s.depthOfDischarge) || 0),
                threshold: 80,
                isLowerBetter: false,
                advice: {
                    good: "Battery discharge is optimal. Maintain above 20% to prolong battery life.",
                    bad: "Abnormal Depth of Discharge: Battery is over-discharged (above 80%). Avoid letting it drop below 20%."
                }
            },
            temperatureStressScore: {
                label: "Thermal Stress Index",
                data: sessions.map(s => parseFloat(s.temperatureStressScore) || 0),
                threshold: 1,
                isLowerBetter: false,
                advice: {
                    good: "Thermal conditions are optimal for battery health.",
                    bad: "Abnormal Thermal Stress: Battery temperature is high. Avoid charging or operating in hot conditions."
                }
            },
            chargingEfficiency: {
                label: "Charge Efficiency (%)",
                data: sessions.map(s => parseFloat(s.chargingEfficiency) || 0),
                threshold: 90,
                isLowerBetter: true,
                advice: {
                    good: "Charging efficiency is optimal (90% or above).",
                    bad: "Abnormal Charging Efficiency: Efficiency is below 90%. Consider checking your charging system or opting for slower charging."
                }
            },
            energyPerKm: {
                label: "Energy Consumption (Wh/km)",
                data: sessions.map(s => {
                    const batteryCapacity = parseFloat(s.batteryCapacity) || 1;
                    const distance = parseFloat(s.distanceDriven) || 0;
                    return distance > 0 ? (batteryCapacity / distance) : 0;
                }),
                threshold: 0.2,
                isLowerBetter: false,
                advice: {
                    good: "Energy consumption is efficient.",
                    bad: "Abnormal Energy Consumption: High energy usage per km detected. Review driving habits or check battery health."
                }
            }
        };

        // Create charts for each metric
        Object.entries(metrics).forEach(([metric, config]) => {
            createCyberChart(
                `${metric}Chart`,
                config.label,
                config.data,
                config.threshold,
                config.advice,
                "line",
                config.isLowerBetter
            );
        });
    }

    function createCyberChart(chartId, label, data, threshold, advice, chartType, isLowerBetter) {
        const ctx = document.getElementById(chartId).getContext("2d");
        
        // Store configuration
        chartConfigs[chartId] = {
            ctx,
            label,
            validatedData: data.map(value => {
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            }),
            threshold,
            advice,
            isLowerBetter,
            chartType,
            neonGreen,
            neonPurple
        };

        createChart(chartId);
    }

    function createChart(chartId) {
        const config = chartConfigs[chartId];
        if (!config) return;

        const ctx = config.ctx;

        // Destroy existing chart
        if (charts[chartId]) {
            charts[chartId].destroy();
            delete charts[chartId];
        }

        const sessionLabels = config.validatedData.map((_, i) => `Session ${i + 1}`);
        let chartOptions = {};
        let chartData = {};
        let chartInstanceType = config.chartType;

        switch (config.chartType) {
            case "pie":
                const segmentColors = config.validatedData.map(value => 
                    (config.isLowerBetter ? value < config.threshold : value > config.threshold) ? '#ff0000' : '#39ff14'
                );
                chartData = {
                    labels: sessionLabels,
                    datasets: [{
                        data: config.validatedData,
                        backgroundColor: segmentColors,
                        borderColor: '#000',
                        borderWidth: 1
                    }]
                };
                chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.raw || 0;
                                    return `${value.toFixed(2)}${chartId === 'energyPerKmChart' ? ' Wh/km' : '%'}`;
                                }
                            }
                        }
                    }
                };
                break;

            case "bar":
                chartData = {
                    labels: sessionLabels,
                    datasets: [{
                        label: config.label,
                        data: config.validatedData,
                        backgroundColor: config.neonGreen,
                        borderColor: config.neonGreen,
                        borderWidth: 1
                    }]
                };
                chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: config.neonGreen } },
                        y: {
                            ticks: {
                                color: config.neonGreen,
                                callback: (value) => chartId === 'energyPerKmChart' ? `${value.toFixed(3)} Wh/km` : `${value.toFixed(2)}%`
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.raw || 0;
                                    return `${value.toFixed(2)}${chartId === 'energyPerKmChart' ? ' Wh/km' : '%'}`;
                                }
                            }
                        }
                    }
                };
                break;

            case "area":
            case "line":
                const isArea = config.chartType === "area";
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, `${config.neonGreen}40`);
                gradient.addColorStop(1, `${config.neonPurple}20`);

                chartData = {
                    labels: sessionLabels,
                    datasets: [{
                        label: config.label,
                        data: config.validatedData,
                        borderColor: config.neonGreen,
                        backgroundColor: isArea ? gradient : undefined,
                        fill: isArea,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: config.validatedData.map(value => 
                            (config.isLowerBetter ? value < config.threshold : value > config.threshold) ? '#ff0000' : '#39ff14'
                        ),
                        pointHoverRadius: 6,
                        tension: 0.3
                    }]
                };
                chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.raw || 0;
                                    return `${value.toFixed(2)}${chartId === 'energyPerKmChart' ? ' Wh/km' : '%'}`;
                                }
                            }
                        },
                        zoom: {
                            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                            pan: { enabled: true, mode: 'xy' }
                        }
                    },
                    scales: {
                        x: { ticks: { color: config.neonGreen } },
                        y: {
                            ticks: {
                                color: config.neonGreen,
                                callback: (value) => chartId === 'energyPerKmChart' ? `${value.toFixed(3)} Wh/km` : `${value.toFixed(2)}%`
                            }
                        }
                    }
                };
                chartInstanceType = 'line'; // Area is a line chart with fill
                break;

            default:
                console.error('Invalid chart type:', config.chartType);
                return;
        }

        // Create new chart instance
        charts[chartId] = new Chart(ctx, {
            type: chartInstanceType,
            data: chartData,
            options: chartOptions
        });

        updateAnalysisBox(chartId, config);
    }

    function updateAnalysisBox(chartId, config) {
        const container = config.ctx.canvas.closest('.cyber-card');
        let analysisBox = container.querySelector('.analysis-box');
        if (analysisBox) analysisBox.remove();

        const abnormalSessions = config.validatedData.filter(value => 
            config.isLowerBetter ? value < config.threshold : value > config.threshold
        ).length;
        const totalSessions = config.validatedData.length;
        const adviceText = abnormalSessions > 0 
            ? `${config.advice.bad} (${abnormalSessions}/${totalSessions} sessions)` 
            : config.advice.good;

        const analysisHTML = `
            <div class="analysis-box">
                <p style="color: ${abnormalSessions > 0 ? '#ff0000' : '#39ff14'}">
                    ${adviceText}
                </p>
                <small class="zoom-hint">(Drag to pan | Scroll to zoom)</small>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', analysisHTML);
    }

    function changeChartType(chartId, newType) {
        if (chartConfigs[chartId]) {
            chartConfigs[chartId].chartType = newType;
            createChart(chartId);
        }
    }
    window.changeChartType = changeChartType;

    function clearCharts() {
        Object.values(charts).forEach(chart => chart.destroy());
        charts = {};
        chartConfigs = {};
        document.querySelectorAll('.analysis-box').forEach(el => el.remove());
    }

    function showCyberAlert(message, type = "success") {
        const alert = document.createElement('div');
        alert.className = `cyber-alert ${type}`;
        alert.innerHTML = `
            <span class="blink">⚠</span> 
            ${message}
            <span class="blink">⚠</span>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    window.loadGraphs = loadGraphs;
});
/**
 * Simple Chart Implementation
 * Creates charts using Canvas API
 */

class SimpleChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            type: 'line',
            data: [],
            labels: [],
            colors: {
                line: '#6366f1',
                fill: 'rgba(99, 102, 241, 0.1)',
                grid: '#e5e7eb',
                text: '#6b7280'
            },
            ...options
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.draw();
    }

    setData(data, labels) {
        this.options.data = data;
        this.options.labels = labels;
        this.draw();
    }

    draw() {
        if (!this.canvas || this.options.data.length === 0) return;
        
        const { width, height } = this.canvas.getBoundingClientRect();
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(width, height, padding, chartWidth, chartHeight);
        
        // Draw chart
        if (this.options.type === 'line') {
            this.drawLineChart(width, height, padding, chartWidth, chartHeight);
        }
    }

    drawGrid(width, height, padding, chartWidth, chartHeight) {
        this.ctx.strokeStyle = this.options.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding + (chartHeight / gridLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        const dataPoints = this.options.data.length;
        if (dataPoints > 1) {
            for (let i = 0; i < dataPoints; i++) {
                const x = padding + (chartWidth / (dataPoints - 1)) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, padding);
                this.ctx.lineTo(x, height - padding);
                this.ctx.stroke();
            }
        }
    }

    drawLineChart(width, height, padding, chartWidth, chartHeight) {
        const data = this.options.data;
        const maxValue = Math.max(...data, 1);
        const minValue = Math.min(...data, 0);
        const range = maxValue - minValue || 1;
        
        // Draw area fill
        this.ctx.fillStyle = this.options.colors.fill;
        this.ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const normalizedValue = (value - minValue) / range;
            const y = height - padding - (chartHeight * normalizedValue);
            
            if (index === 0) {
                this.ctx.moveTo(x, height - padding);
                this.ctx.lineTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw line
        this.ctx.strokeStyle = this.options.colors.line;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const normalizedValue = (value - minValue) / range;
            const y = height - padding - (chartHeight * normalizedValue);
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Draw points
        this.ctx.fillStyle = this.options.colors.line;
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const normalizedValue = (value - minValue) / range;
            const y = height - padding - (chartHeight * normalizedValue);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw labels
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        
        this.options.labels.forEach((label, index) => {
            if (index % Math.ceil(this.options.labels.length / 6) === 0 || index === this.options.labels.length - 1) {
                const x = padding + (chartWidth / (data.length - 1)) * index;
                this.ctx.fillText(label, x, height - padding + 20);
            }
        });
    }
}

/**
 * Simple Donut Chart Implementation
 */
class SimpleDonutChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            data: [],
            labels: [],
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
            innerRadius: 0.6,
            ...options
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.draw();
    }

    setData(data, labels) {
        this.options.data = data;
        this.options.labels = labels;
        this.draw();
    }

    draw() {
        if (!this.canvas || this.options.data.length === 0) return;
        
        const { width, height } = this.canvas.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        const innerRadius = radius * this.options.innerRadius;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        const total = this.options.data.reduce((sum, val) => sum + val, 0);
        if (total === 0) return;
        
        let currentAngle = -Math.PI / 2; // Start at top
        
        // Draw donut segments
        this.options.data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw outer arc
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            this.ctx.closePath();
            this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
            this.ctx.fill();
            
            // Draw border
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = (radius + innerRadius) / 2;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const percentage = ((value / total) * 100).toFixed(0);
            if (percentage > 5) { // Only show label if segment is large enough
                this.ctx.fillText(`${percentage}%`, labelX, labelY);
            }
            
            currentAngle += sliceAngle;
        });
        
        // Draw legend
        const legendX = 20;
        let legendY = 20;
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        this.options.labels.forEach((label, index) => {
            // Draw color box
            this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
            this.ctx.fillRect(legendX, legendY, 12, 12);
            
            // Draw label text
            this.ctx.fillStyle = '#1f2937';
            this.ctx.fillText(label, legendX + 18, legendY);
            
            legendY += 20;
        });
    }
}

/**
 * SVG Donut Chart Implementation
 */
class SVGDonutChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.options = {
            data: [],
            labels: [],
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
            innerRadius: 0.6,
            ...options
        };
        
        this.createSVG();
        window.addEventListener('resize', () => this.resize());
    }

    createSVG() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', '0 0 400 400');
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.maxHeight = '400px';
        
        // Create group for chart
        this.chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.chartGroup.setAttribute('transform', 'translate(200, 200)');
        
        this.svg.appendChild(this.chartGroup);
        this.container.appendChild(this.svg);
    }

    resize() {
        // SVG is responsive via viewBox, no resize needed
        this.draw();
    }

    setData(data, labels, colors = null) {
        this.options.data = data;
        this.options.labels = labels;
        if (colors) {
            this.options.colors = colors;
        }
        this.draw();
    }

    draw() {
        if (!this.chartGroup || this.options.data.length === 0) return;
        
        // Clear previous content
        this.chartGroup.innerHTML = '';
        
        const radius = 150;
        const innerRadius = radius * this.options.innerRadius;
        const total = this.options.data.reduce((sum, val) => sum + val, 0);
        
        if (total === 0) {
            // Draw empty circle
            const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            emptyCircle.setAttribute('cx', '0');
            emptyCircle.setAttribute('cy', '0');
            emptyCircle.setAttribute('r', radius);
            emptyCircle.setAttribute('fill', '#e5e7eb');
            this.chartGroup.appendChild(emptyCircle);
            return;
        }
        
        let currentAngle = -Math.PI / 2; // Start at top
        
        // Draw donut segments
        this.options.data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const endAngle = currentAngle + sliceAngle;
            
            // Create path for donut segment
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            const x1 = Math.cos(currentAngle) * radius;
            const y1 = Math.sin(currentAngle) * radius;
            const x2 = Math.cos(endAngle) * radius;
            const y2 = Math.sin(endAngle) * radius;
            
            const x3 = Math.cos(endAngle) * innerRadius;
            const y3 = Math.sin(endAngle) * innerRadius;
            const x4 = Math.cos(currentAngle) * innerRadius;
            const y4 = Math.sin(currentAngle) * innerRadius;
            
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            
            const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                'Z'
            ].join(' ');
            
            path.setAttribute('d', pathData);
            path.setAttribute('fill', this.options.colors[index % this.options.colors.length]);
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '2');
            
            this.chartGroup.appendChild(path);
            
            // Add label if segment is large enough
            const percentage = ((value / total) * 100).toFixed(0);
            if (percentage > 5) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelRadius = (radius + innerRadius) / 2;
                const labelX = Math.cos(labelAngle) * labelRadius;
                const labelY = Math.sin(labelAngle) * labelRadius;
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', labelX);
                text.setAttribute('y', labelY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', '#1f2937');
                text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', 'bold');
                text.textContent = `${percentage}%`;
                this.chartGroup.appendChild(text);
            }
            
            currentAngle = endAngle;
        });
    }
}

// Export chart classes
window.SimpleChart = SimpleChart;
window.SimpleDonutChart = SimpleDonutChart;
window.SVGDonutChart = SVGDonutChart;
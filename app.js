class DocCheckerAgent {
  constructor() {
    this.uploadedFiles = [];
    this.analysisResults = null;
    this.reports = [];
    this.usage = {
      documentsAnalyzed: 0,
      reportsGenerated: 0,
      creditsUsed: 0
    };
    this.pricing = {
      documentAnalysis: 0.50,
      reportGeneration: 2.00
    };
    
    this.mockContradictions = [
      {
        id: 1,
        type: "Time Conflict",
        severity: "High",
        description: "Conflicting submission deadlines found",
        details: "Project guide states 'submit before 10 PM' while master rules document specifies 'deadline: midnight'",
        sources: ["project_guide.pdf", "master_rules.pdf"],
        suggestion: "Clarify whether 10 PM or midnight is the official deadline across all documents",
        confidence: 0.92
      },
      {
        id: 2,
        type: "Duration Conflict",
        severity: "High",
        description: "Inconsistent notice period requirements",
        details: "HR handbook specifies '2 weeks notice' while employment contract requires '1 month notice'",
        sources: ["hr_handbook.pdf", "employment_contract.pdf"],
        suggestion: "Standardize notice period requirement to either 2 weeks or 1 month in all documents",
        confidence: 0.89
      },
      {
        id: 3,
        type: "Percentage Conflict",
        severity: "Medium",
        description: "Conflicting attendance requirements",
        details: "College circular states 'attendance required: 75%' but another circular mentions 'minimum 65%'",
        sources: ["college_circular_1.pdf", "college_circular_2.pdf"],
        suggestion: "Establish single attendance percentage requirement across all college documents",
        confidence: 0.85
      }
    ];

    this.pathwayAlerts = [
      {
        id: 1,
        timestamp: "2025-09-19T10:15:00Z",
        source: "College Policy Page",
        change: "Attendance policy updated from 75% to 70%",
        impact: "New contradiction detected with existing documents",
        status: "alert"
      },
      {
        id: 2,
        timestamp: "2025-09-19T09:30:00Z",
        source: "HR Portal",
        change: "Leave policy document modified",
        impact: "No contradictions detected",
        status: "ok"
      }
    ];

    this.sampleDocuments = [
      { name: "project_guidelines.pdf", size: 1024000, type: "pdf" },
      { name: "student_handbook.docx", size: 2048000, type: "docx" },
      { name: "college_rules.txt", size: 512000, type: "txt" }
    ];

    this.init();
  }

  init() {
    this.initializeElements();
    this.bindEvents();
    this.updateUsageDisplay();
    this.populatePathwayAlerts();
    this.loadStoredReports();
    this.addDemoButton();
  }

  initializeElements() {
    // Upload elements
    this.uploadZone = document.getElementById('uploadZone');
    this.fileInput = document.getElementById('fileInput');
    this.browseBtn = document.getElementById('browseBtn');
    this.uploadedFilesContainer = document.getElementById('uploadedFiles');
    this.clearBtn = document.getElementById('clearBtn');
    this.analyzeBtn = document.getElementById('analyzeBtn');

    // Analysis elements
    this.analysisSection = document.getElementById('analysisSection');
    this.progressFill = document.getElementById('progressFill');
    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step3 = document.getElementById('step3');

    // Results elements
    this.resultsSection = document.getElementById('resultsSection');
    this.contradictionsFound = document.getElementById('contradictionsFound');
    this.highSeverity = document.getElementById('highSeverity');
    this.mediumSeverity = document.getElementById('mediumSeverity');
    this.lowSeverity = document.getElementById('lowSeverity');
    this.contradictionsList = document.getElementById('contradictionsList');
    this.generateReportBtn = document.getElementById('generateReportBtn');
    this.newAnalysisBtn = document.getElementById('newAnalysisBtn');

    // Reports elements
    this.reportsDashboard = document.getElementById('reportsDashboard');
    this.reportsList = document.getElementById('reportsList');

    // Modal elements
    this.reportModal = document.getElementById('reportModal');
    this.closeModal = document.getElementById('closeModal');
    this.closeReportModal = document.getElementById('closeReportModal');
    this.downloadReport = document.getElementById('downloadReport');
    this.reportContent = document.getElementById('reportContent');

    // Usage elements
    this.docsAnalyzedEl = document.getElementById('docsAnalyzed');
    this.reportsGeneratedEl = document.getElementById('reportsGenerated');
    this.creditsUsedEl = document.getElementById('creditsUsed');

    // Toast container
    this.toastContainer = document.getElementById('toastContainer');

    // Pathway alerts
    this.alertsContainer = document.getElementById('alertsContainer');
  }

  addDemoButton() {
    // Add demo button for testing purposes
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn btn--outline';
    demoBtn.textContent = 'Load Demo Files';
    demoBtn.style.marginLeft = 'var(--space-16)';
    
    demoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadDemoFiles();
    });

    if (this.browseBtn && this.browseBtn.parentNode) {
      this.browseBtn.parentNode.appendChild(demoBtn);
    }
  }

  loadDemoFiles() {
    // Clear existing files first
    this.clearFiles();
    
    // Create mock file objects for demo
    this.sampleDocuments.forEach(doc => {
      const mockFile = {
        name: doc.name,
        size: doc.size,
        type: doc.type,
        lastModified: Date.now()
      };
      this.uploadedFiles.push(mockFile);
      this.createFileCard(mockFile);
    });
    
    this.updateControlsState();
    this.showToast('success', 'Demo Files Loaded', 'Sample documents have been loaded for demonstration.');
  }

  bindEvents() {
    // File upload events with better error handling
    if (this.uploadZone) {
      this.uploadZone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerFileInput();
      });
    }

    if (this.browseBtn) {
      this.browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerFileInput();
      });
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        this.handleFileSelect(e);
      });
    }

    // Drag and drop events
    if (this.uploadZone) {
      this.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleDragOver(e);
      });

      this.uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleDragLeave(e);
      });

      this.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleDrop(e);
      });
    }

    // Control buttons
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearFiles();
      });
    }

    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startAnalysis();
      });
    }

    if (this.generateReportBtn) {
      this.generateReportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.generateReport();
      });
    }

    if (this.newAnalysisBtn) {
      this.newAnalysisBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetForNewAnalysis();
      });
    }

    // Modal events
    if (this.closeModal) {
      this.closeModal.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeReportModal();
      });
    }

    if (this.closeReportModal) {
      this.closeReportModal.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeReportModal();
      });
    }

    if (this.downloadReport) {
      this.downloadReport.addEventListener('click', (e) => {
        e.preventDefault();
        this.downloadReportPDF();
      });
    }

    if (this.reportModal) {
      this.reportModal.addEventListener('click', (e) => {
        if (e.target === this.reportModal || e.target.classList.contains('modal-backdrop')) {
          this.closeReportModal();
        }
      });
    }

    // Keyboard events for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.reportModal && !this.reportModal.classList.contains('hidden')) {
        this.closeReportModal();
      }
    });
  }

  triggerFileInput() {
    try {
      if (this.fileInput) {
        this.fileInput.click();
      } else {
        // Fallback: show demo files if file input not available
        this.showToast('info', 'File Upload', 'File upload not available. Loading demo files instead.');
        setTimeout(() => this.loadDemoFiles(), 500);
      }
    } catch (error) {
      console.warn('File input not available, using demo files:', error);
      this.showToast('info', 'Demo Mode', 'File upload not available. Loading demo files instead.');
      setTimeout(() => this.loadDemoFiles(), 500);
    }
  }

  handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      this.addFiles(files);
      // Reset the file input to allow selecting the same files again
      e.target.value = '';
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    if (this.uploadZone) {
      this.uploadZone.classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    e.preventDefault();
    if (this.uploadZone && !this.uploadZone.contains(e.relatedTarget)) {
      this.uploadZone.classList.remove('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    if (this.uploadZone) {
      this.uploadZone.classList.remove('drag-over');
    }
    
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      this.addFiles(files);
    } else {
      // Fallback for testing environments
      this.showToast('info', 'Demo Mode', 'Drag & drop not available. Loading demo files instead.');
      setTimeout(() => this.loadDemoFiles(), 500);
    }
  }

  addFiles(files) {
    // Filter and validate files
    const validFiles = files.filter(file => {
      const validTypes = ['pdf', 'docx', 'txt'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isValidType = validTypes.includes(fileExtension);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        this.showToast('error', 'Invalid File Type', `${file.name} is not a supported file type.`);
        return false;
      }
      
      if (!isValidSize) {
        this.showToast('error', 'File Too Large', `${file.name} exceeds the 10MB size limit.`);
        return false;
      }
      
      return true;
    });

    // Check total file limit
    if (this.uploadedFiles.length + validFiles.length > 3) {
      this.showToast('warning', 'Too Many Files', 'You can upload a maximum of 3 documents.');
      return;
    }

    // Add files to the list
    validFiles.forEach(file => {
      if (!this.uploadedFiles.some(f => f.name === file.name)) {
        this.uploadedFiles.push(file);
        this.createFileCard(file);
      }
    });

    this.updateControlsState();
    
    if (validFiles.length > 0) {
      this.showToast('success', 'Files Added', `${validFiles.length} document(s) uploaded successfully.`);
    }
  }

  createFileCard(file) {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.dataset.fileName = file.name;

    const fileIcon = this.getFileIcon(file.name);
    const fileSize = this.formatFileSize(file.size);

    fileCard.innerHTML = `
      <div class="file-icon">${fileIcon}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-details">${fileSize} • ${this.getFileType(file.name)}</div>
      </div>
      <button class="file-remove" data-file-name="${file.name}">&times;</button>
    `;

    // Add event listener to remove button
    const removeBtn = fileCard.querySelector('.file-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeFile(file.name);
      });
    }

    if (this.uploadedFilesContainer) {
      this.uploadedFilesContainer.appendChild(fileCard);
    }
  }

  removeFile(fileName) {
    this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
    
    if (this.uploadedFilesContainer) {
      const fileCard = this.uploadedFilesContainer.querySelector(`[data-file-name="${fileName}"]`);
      if (fileCard) {
        fileCard.remove();
      }
    }
    
    this.updateControlsState();
    this.showToast('info', 'File Removed', `${fileName} has been removed.`);
  }

  clearFiles() {
    this.uploadedFiles = [];
    if (this.uploadedFilesContainer) {
      this.uploadedFilesContainer.innerHTML = '';
    }
    this.updateControlsState();
    this.showToast('info', 'Files Cleared', 'All uploaded documents have been removed.');
  }

  updateControlsState() {
    const hasFiles = this.uploadedFiles.length > 0;
    const hasEnoughFiles = this.uploadedFiles.length >= 2;
    
    if (this.clearBtn) {
      this.clearBtn.disabled = !hasFiles;
    }
    
    if (this.analyzeBtn) {
      this.analyzeBtn.disabled = !hasEnoughFiles;
      
      if (hasEnoughFiles) {
        this.analyzeBtn.textContent = `Analyze ${this.uploadedFiles.length} Documents`;
      } else {
        this.analyzeBtn.textContent = 'Analyze Documents (Need 2+ files)';
      }
    }
  }

  async startAnalysis() {
    if (this.uploadedFiles.length < 2) {
      this.showToast('warning', 'Insufficient Files', 'Please upload at least 2 documents for analysis.');
      return;
    }

    // Hide other sections and show analysis
    if (this.resultsSection) {
      this.resultsSection.style.display = 'none';
    }
    if (this.reportsDashboard) {
      this.reportsDashboard.style.display = 'none';
    }
    if (this.analysisSection) {
      this.analysisSection.style.display = 'block';
    }

    // Reset progress
    if (this.progressFill) {
      this.progressFill.style.width = '0%';
    }
    this.resetProgressSteps();

    // Calculate billing
    const analysisCredit = this.uploadedFiles.length * this.pricing.documentAnalysis;
    this.usage.creditsUsed += analysisCredit;

    // Simulate analysis process
    await this.simulateAnalysisSteps();

    // Generate mock results based on uploaded files
    this.generateMockResults();

    // Update usage stats
    this.usage.documentsAnalyzed += this.uploadedFiles.length;
    this.updateUsageDisplay();

    // Show results
    this.displayResults();
    this.showToast('success', 'Analysis Complete', `Found ${this.analysisResults.contradictions.length} contradictions in your documents.`);
  }

  async simulateAnalysisSteps() {
    // Step 1: Parsing documents
    if (this.step1) {
      this.step1.classList.add('active');
    }
    await this.updateProgress(33, 1500);
    if (this.step1) {
      this.step1.classList.remove('active');
      this.step1.classList.add('completed');
    }

    // Step 2: Detecting contradictions
    if (this.step2) {
      this.step2.classList.add('active');
    }
    await this.updateProgress(66, 2000);
    if (this.step2) {
      this.step2.classList.remove('active');
      this.step2.classList.add('completed');
    }

    // Step 3: Generating report
    if (this.step3) {
      this.step3.classList.add('active');
    }
    await this.updateProgress(100, 1000);
    if (this.step3) {
      this.step3.classList.remove('active');
      this.step3.classList.add('completed');
    }
  }

  updateProgress(width, delay) {
    return new Promise(resolve => {
      if (this.progressFill) {
        this.progressFill.style.width = `${width}%`;
      }
      setTimeout(resolve, delay);
    });
  }

  resetProgressSteps() {
    [this.step1, this.step2, this.step3].forEach(step => {
      if (step) {
        step.classList.remove('active', 'completed');
      }
    });
  }

  generateMockResults() {
    // Generate contradictions based on file names and mock data
    const contradictions = this.mockContradictions.map((contradiction, index) => ({
      ...contradiction,
      sources: this.uploadedFiles.slice(0, Math.min(2, this.uploadedFiles.length)).map(file => file.name)
    }));

    // Randomize which contradictions to show (1-3)
    const numContradictions = Math.floor(Math.random() * 3) + 1;
    const selectedContradictions = contradictions.slice(0, numContradictions);

    this.analysisResults = {
      contradictions: selectedContradictions,
      summary: this.generateSummary(selectedContradictions),
      timestamp: new Date().toISOString(),
      filesAnalyzed: this.uploadedFiles.map(file => file.name)
    };
  }

  generateSummary(contradictions) {
    const severityCounts = {
      high: contradictions.filter(c => c.severity === 'High').length,
      medium: contradictions.filter(c => c.severity === 'Medium').length,
      low: contradictions.filter(c => c.severity === 'Low').length
    };

    return {
      total: contradictions.length,
      ...severityCounts
    };
  }

  displayResults() {
    if (this.analysisSection) {
      this.analysisSection.style.display = 'none';
    }
    if (this.resultsSection) {
      this.resultsSection.style.display = 'block';
    }

    // Update summary
    if (this.contradictionsFound) {
      this.contradictionsFound.textContent = this.analysisResults.summary.total;
    }
    if (this.highSeverity) {
      this.highSeverity.textContent = `${this.analysisResults.summary.high} High`;
    }
    if (this.mediumSeverity) {
      this.mediumSeverity.textContent = `${this.analysisResults.summary.medium} Medium`;
    }
    if (this.lowSeverity) {
      this.lowSeverity.textContent = `${this.analysisResults.summary.low} Low`;
    }

    // Display contradictions
    this.displayContradictions();
  }

  displayContradictions() {
    if (!this.contradictionsList) return;
    
    this.contradictionsList.innerHTML = '';

    this.analysisResults.contradictions.forEach(contradiction => {
      const card = document.createElement('div');
      card.className = 'contradiction-card';
      card.innerHTML = this.createContradictionCardHTML(contradiction);
      this.contradictionsList.appendChild(card);
    });
  }

  createContradictionCardHTML(contradiction) {
    const severityClass = `severity-${contradiction.severity.toLowerCase()}`;
    const confidencePercent = Math.round(contradiction.confidence * 100);

    return `
      <div class="contradiction-header">
        <h3 class="contradiction-type">${contradiction.type}</h3>
        <div class="contradiction-severity">
          <span class="severity-badge ${severityClass}">${contradiction.severity}</span>
          <span class="confidence-score">${confidencePercent}% confidence</span>
        </div>
      </div>
      <p class="contradiction-description">${contradiction.description}</p>
      <div class="contradiction-details">
        <p>${contradiction.details}</p>
      </div>
      <div class="contradiction-sources">
        ${contradiction.sources.map(source => `<span class="source-tag">${source}</span>`).join('')}
      </div>
      <div class="contradiction-suggestion">
        <h4 class="suggestion-label">💡 Suggested Resolution:</h4>
        <p class="suggestion-text">${contradiction.suggestion}</p>
      </div>
    `;
  }

  async generateReport() {
    if (!this.analysisResults) return;

    // Calculate billing for report generation
    const reportCredit = this.pricing.reportGeneration;
    this.usage.creditsUsed += reportCredit;
    this.usage.reportsGenerated++;
    this.updateUsageDisplay();

    // Create report
    const report = {
      id: Date.now(),
      title: `Document Analysis Report #${this.usage.reportsGenerated}`,
      timestamp: new Date().toISOString(),
      filesAnalyzed: this.analysisResults.filesAnalyzed,
      contradictions: this.analysisResults.contradictions,
      summary: this.analysisResults.summary
    };

    // Add to reports list
    this.reports.unshift(report);
    this.saveReports();

    // Show report modal
    this.showReportModal(report);
    
    // Show reports dashboard
    this.displayReports();
    if (this.reportsDashboard) {
      this.reportsDashboard.style.display = 'block';
    }

    this.showToast('success', 'Report Generated', 'Your contradiction analysis report has been generated successfully.');
  }

  showReportModal(report) {
    const reportHTML = this.generateReportHTML(report);
    if (this.reportContent) {
      this.reportContent.innerHTML = reportHTML;
    }
    if (this.reportModal) {
      this.reportModal.classList.remove('hidden');
    }
    document.body.style.overflow = 'hidden';
  }

  closeReportModal() {
    if (this.reportModal) {
      this.reportModal.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
  }

  generateReportHTML(report) {
    const date = new Date(report.timestamp).toLocaleString();
    
    return `
      <div class="report-summary">
        <h2>${report.title}</h2>
        <p><strong>Generated:</strong> ${date}</p>
        <p><strong>Files Analyzed:</strong> ${report.filesAnalyzed.join(', ')}</p>
        <p><strong>Contradictions Found:</strong> ${report.summary.total}</p>
      </div>
      
      <div class="report-breakdown">
        <h3>Severity Breakdown</h3>
        <ul>
          <li>High Severity: ${report.summary.high}</li>
          <li>Medium Severity: ${report.summary.medium}</li>
          <li>Low Severity: ${report.summary.low}</li>
        </ul>
      </div>

      <div class="report-contradictions">
        <h3>Detailed Findings</h3>
        ${report.contradictions.map((c, index) => `
          <div class="report-contradiction">
            <h4>${index + 1}. ${c.type} (${c.severity} Severity)</h4>
            <p><strong>Description:</strong> ${c.description}</p>
            <p><strong>Details:</strong> ${c.details}</p>
            <p><strong>Sources:</strong> ${c.sources.join(', ')}</p>
            <p><strong>Recommendation:</strong> ${c.suggestion}</p>
            <p><strong>Confidence:</strong> ${Math.round(c.confidence * 100)}%</p>
          </div>
        `).join('')}
      </div>

      <div class="report-footer">
        <p><em>Generated by DocChecker Agent - Smart Document Contradiction Detection</em></p>
        <p>This report identifies potential contradictions in your documents. Please review each finding and implement the suggested resolutions to maintain document consistency.</p>
      </div>
    `;
  }

  downloadReportPDF() {
    // Simulate PDF download
    this.showToast('info', 'Download Started', 'Your report PDF is being prepared for download.');
    
    // In a real implementation, this would generate and download a PDF
    setTimeout(() => {
      this.showToast('success', 'Download Complete', 'Report has been downloaded successfully.');
    }, 2000);
  }

  displayReports() {
    if (!this.reportsList) return;
    
    this.reportsList.innerHTML = '';

    if (this.reports.length === 0) {
      this.reportsList.innerHTML = '<p>No reports generated yet. Analyze documents to create your first report.</p>';
      return;
    }

    this.reports.forEach(report => {
      const reportCard = document.createElement('div');
      reportCard.className = 'report-card';
      reportCard.innerHTML = this.createReportCardHTML(report);
      
      // Add event listeners to buttons
      const viewBtn = reportCard.querySelector('.view-report-btn');
      const downloadBtn = reportCard.querySelector('.download-report-btn');
      
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.viewReport(report.id);
        });
      }
      
      if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.downloadSingleReport(report.id);
        });
      }
      
      this.reportsList.appendChild(reportCard);
    });
  }

  createReportCardHTML(report) {
    const date = new Date(report.timestamp).toLocaleDateString();
    
    return `
      <h3 class="report-title">${report.title}</h3>
      <p class="report-meta">Generated on ${date}</p>
      <div class="report-stats">
        <div class="report-stat">
          <div class="report-stat-value">${report.summary.total}</div>
          <div class="report-stat-label">Contradictions</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-value">${report.filesAnalyzed.length}</div>
          <div class="report-stat-label">Files</div>
        </div>
      </div>
      <div class="report-actions-card">
        <button class="btn btn--sm btn--outline view-report-btn">View</button>
        <button class="btn btn--sm btn--secondary download-report-btn">Download</button>
      </div>
    `;
  }

  viewReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      this.showReportModal(report);
    }
  }

  downloadSingleReport(reportId) {
    this.downloadReportPDF();
  }

  resetForNewAnalysis() {
    this.clearFiles();
    this.analysisResults = null;
    if (this.resultsSection) {
      this.resultsSection.style.display = 'none';
    }
    if (this.analysisSection) {
      this.analysisSection.style.display = 'none';
    }
    this.showToast('info', 'Ready for New Analysis', 'Upload new documents to start a fresh analysis.');
  }

  updateUsageDisplay() {
    if (this.docsAnalyzedEl) {
      this.docsAnalyzedEl.textContent = this.usage.documentsAnalyzed;
    }
    if (this.reportsGeneratedEl) {
      this.reportsGeneratedEl.textContent = this.usage.reportsGenerated;
    }
    if (this.creditsUsedEl) {
      this.creditsUsedEl.textContent = `$${this.usage.creditsUsed.toFixed(2)}`;
    }
  }

  populatePathwayAlerts() {
    if (!this.alertsContainer) return;
    
    this.alertsContainer.innerHTML = '';

    this.pathwayAlerts.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert-item';
      
      const timeAgo = this.getTimeAgo(alert.timestamp);
      
      alertElement.innerHTML = `
        <div class="alert-content">
          <p class="alert-source">${alert.source}</p>
          <p class="alert-change">${alert.change}</p>
        </div>
        <div class="alert-time">${timeAgo}</div>
        <div class="alert-status ${alert.status}"></div>
      `;
      
      this.alertsContainer.appendChild(alertElement);
    });
  }

  showToast(type, title, message) {
    if (!this.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  // Utility functions
  getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      docx: '📝',
      txt: '📃'
    };
    return icons[extension] || '📄';
  }

  getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const types = {
      pdf: 'PDF Document',
      docx: 'Word Document',
      txt: 'Text Document'
    };
    return types[extension] || 'Document';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  }

  saveReports() {
    // In a real app, this would save to a backend
    // For demo purposes, we'll use sessionStorage if available
    try {
      if (typeof Storage !== "undefined") {
        sessionStorage.setItem('docCheckerReports', JSON.stringify(this.reports));
      }
    } catch (e) {
      console.log('Could not save reports to storage');
    }
  }

  loadStoredReports() {
    try {
      if (typeof Storage !== "undefined") {
        const stored = sessionStorage.getItem('docCheckerReports');
        if (stored) {
          this.reports = JSON.parse(stored);
          if (this.reports.length > 0) {
            this.displayReports();
            if (this.reportsDashboard) {
              this.reportsDashboard.style.display = 'block';
            }
          }
        }
      }
    } catch (e) {
      console.log('Could not load reports from storage');
    }
  }
}

// Initialize the application
let docChecker;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing DocChecker Agent...');
  
  try {
    docChecker = new DocCheckerAgent();
    
    // Make globally available for any inline event handlers
    window.docChecker = docChecker;
    
    console.log('DocChecker Agent initialized successfully!');
    
    // Show welcome message
    setTimeout(() => {
      if (docChecker && docChecker.showToast) {
        docChecker.showToast('info', 'Welcome!', 'Upload 2-3 documents to start detecting contradictions, or click "Load Demo Files" to try the application.');
      }
    }, 1000);
    
    // Simulate periodic Pathway monitoring updates
    setInterval(() => {
      if (docChecker && Math.random() < 0.3) { // 30% chance every 30 seconds
        const mockAlert = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          source: 'External Policy Monitor',
          change: 'Document update detected',
          impact: 'Checking for new contradictions...',
          status: 'ok'
        };
        
        docChecker.pathwayAlerts.unshift(mockAlert);
        docChecker.pathwayAlerts = docChecker.pathwayAlerts.slice(0, 5); // Keep only latest 5
        docChecker.populatePathwayAlerts();
      }
    }, 30000);
    
  } catch (error) {
    console.error('Failed to initialize DocChecker Agent:', error);
  }
});
import React, { useState } from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';

interface GroundedDataPanelProps {
  groundedText: string;
  setGroundedText: (text: string) => void;
}

interface GroundedTemplate {
  name: string;
  type: 'pdf' | 'csv' | 'url';
  content: string;
}

const TEMPLATES: GroundedTemplate[] = [
  {
    name: 'forklift_nearmiss_log.csv',
    type: 'csv',
    content: `Incident ID,Date,Location,Asset,ViolationType,Distance,PPEStatus
INC-2248,2026-05-18,Aisle C,Forklift #4,Pedestrian Proximity,1.2m (Threshold 3m),Hi-Vis Active
INC-2249,2026-05-19,Corridor B,Forklift #2,Speed Limit Exceeded,14km/h (Limit 8km/h),N/A
INC-2250,2026-05-22,Zone D Loading,Forklift #9,No-Go Zone Entry,0.0m (Inside Restricted Zone),Hi-Vis Active`
  },
  {
    name: 'directors_compliance_audit.pdf',
    type: 'pdf',
    content: `Health & Safety at Work Act (HSWA) compliance directives for board directors:
- Directors must take 'all practicable steps' to manage operational risks.
- Written checklists and spreadsheet audits are considered hindsight-based and insufficient.
- Visual, automated telemetry validation (continuous auditing) is the gold standard of safety governance.
- seeo.ai visual 'cultural artefacts' provide absolute confirmation of safety diligence.`
  },
  {
    name: 'seedigital_20yr_cctv_evolution.txt',
    type: 'pdf',
    content: `Historical review of CCTV application in NZ commerce (seedigital 2003-2026):
- 2003: legacy CCTV systems designed for asset protection and evidence collection post-theft.
- 2012: introduction of remote live guard validation and network video recorders.
- 2026: layering active edge-AI video analytics to turn cameras into real-time safety telemetry systems.
- Conclusion: Passive security systems must transition into active operational risk mitigators.`
  }
];

export const GroundedDataPanel: React.FC<GroundedDataPanelProps> = ({
  groundedText,
  setGroundedText
}) => {
  const [activeFiles, setActiveFiles] = useState<string[]>([]);
  const [isDndActive, setIsDndActive] = useState(false);

  const handleImportTemplate = (tpl: GroundedTemplate) => {
    if (activeFiles.includes(tpl.name)) {
      // Remove
      setActiveFiles(activeFiles.filter((f) => f !== tpl.name));
      setGroundedText('');
    } else {
      // Add
      setActiveFiles([...activeFiles, tpl.name]);
      setGroundedText(tpl.content);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDndActive(true);
  };

  const handleDragLeave = () => {
    setIsDndActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDndActive(false);
    
    // Simulate drop file
    const mockFileName = 'uploaded_incident_report.pdf';
    setActiveFiles([...activeFiles, mockFileName]);
    setGroundedText(`Source: /uploads/${mockFileName}
Incident summary: Forklift operation was flagged under speed limit violations in Loading Zone 2. The dynamic video safety analytics platform tracked the forklift operating at 12km/h (safety threshold is 6km/h) for 45 seconds while pedestrians were active in the vicinity. Bounding box warning triggered successfully.`);
  };

  return (
    <div className="glass-card grounded-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--color-primary)" /> Grounded Context & Files
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grounded generation</span>
      </div>

      {/* Drag & Drop simulated area */}
      <div
        className={`dnd-area ${isDndActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          setActiveFiles([...activeFiles, 'manual_site_audit.csv']);
          setGroundedText('Audit Date: 2026-05-24\nFacility: Christchurch Depot\nFindings: Bounding boxes verified. 10 near-miss events logged. Corrective safety vest coaching executed.');
        }}
      >
        <Upload className="dnd-icon" />
        <div style={{ fontSize: '13px', fontWeight: 600 }}>Drag SOPs, logs, or reports here</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supports PDF, CSV, or TXT (Simulated)</div>
      </div>

      {/* Quick Import Templates */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="var(--color-primary)" />
          <span>Quick Context Presets (Co-founder Data)</span>
        </div>
        <div className="file-list">
          {TEMPLATES.map((tpl) => {
            const isActive = activeFiles.includes(tpl.name);
            return (
              <div
                key={tpl.name}
                className={`file-tag active ${isActive ? '' : 'inactive'}`}
                onClick={() => handleImportTemplate(tpl)}
                style={{ cursor: 'pointer', opacity: isActive ? 1 : 0.6, border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)' }}
              >
                {tpl.type === 'csv' ? <FileText size={12} /> : <FileText size={12} />}
                <span>{tpl.name}</span>
                {isActive && <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 800 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Input text box */}
      <div style={{ marginTop: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Direct Grounded Context Editor</label>
        <textarea
          className="text-input-grounded"
          placeholder="Paste real website text, forklift incident details, or director statements to inject into the post generation..."
          value={groundedText}
          onChange={(e) => setGroundedText(e.target.value)}
        />
      </div>
    </div>
  );
};

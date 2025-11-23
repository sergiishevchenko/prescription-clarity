import { ArrowLeft, Printer, Camera } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { analyzeSchedulePhoto, updateMedicationRecords } from '../utils/photoAnalyzer';
import logoImage from 'figma:asset/1365186ed792a761a8bbf201e130c3178c120715.png';

// Real Logo for Print
const PrintLogo = () => (
  <img 
    src={logoImage} 
    alt="Prescription Clarity Logo" 
    style={{ 
      width: '48px', 
      height: '48px', 
      objectFit: 'contain',
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact'
    }} 
  />
);

interface PrintScheduleProps {
  darkMode: boolean;
  setCurrentPage: (page: string) => void;
  medications?: any[];
  currentUser?: any;
}

export default function PrintSchedule({ darkMode, setCurrentPage, medications = [], currentUser }: PrintScheduleProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState(currentUser?.name || 'User');
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    // Check if printing for specific person (caregiver/doctor flow)
    const scheduleData = localStorage.getItem('printScheduleData');
    if (scheduleData) {
      try {
        const data = JSON.parse(scheduleData);
        setPrintData(data);
        setUserName(data.personName);
        // Clear after reading
        localStorage.removeItem('printScheduleData');
      } catch (e) {
        // Continue with default flow
      }
    } else {
      // Default: print for current user
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUserName(userData.name || currentUser?.name || 'User');
        } catch (e) {
          // Use default
        }
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Show initial toast
    toast.loading('Uploading to Google Drive...', {
      id: 'photo-analysis',
      duration: Infinity,
    });
    
    try {
      // Step 1: Analyze photo (includes Google Drive upload)
      const result = await analyzeSchedulePhoto(file, true);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to analyze photo', {
          id: 'photo-analysis',
          duration: 5000,
        });
        return;
      }
      
      // Step 2: Update UI with QR scan results
      toast.loading(`Patient: ${result.patientName}. Running Tesseract OCR...`, {
        id: 'photo-analysis',
        duration: 3000,
      });
      
      // Step 3: Update medication records
      setTimeout(async () => {
        const updated = await updateMedicationRecords(result, currentUser);
        
        if (updated) {
          toast.success('Analysis complete!', {
            id: 'photo-analysis',
            description: `Found ${result.checkmarksDetected} of ${(result.medicationsFound || 0) * 7} medications taken. Week: ${result.weekStart}`,
            duration: 7000,
            action: result.driveFileUrl ? {
              label: 'View on Drive',
              onClick: () => window.open(result.driveFileUrl, '_blank'),
            } : undefined,
          });
        } else {
          toast.error('Failed to update medication records', {
            id: 'photo-analysis',
            duration: 5000,
          });
        }
      }, 2000);
    } catch (error) {
      toast.error('Photo analysis failed', {
        id: 'photo-analysis',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000,
      });
    }
  };

  // Calculate current week date range
  const getWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  const weekDateRange = getWeekDateRange();

  // Use printData prescriptions if available, otherwise use medications prop
  const activeMedications = printData?.prescriptions || medications;

  // Get doctor info if available
  const doctorInfo = printData?.doctorInfo || null;

  // Days of week for horizontal layout
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayKeys: Record<string, keyof any> = {
    'Mon': 'mon',
    'Tue': 'tue',
    'Wed': 'wed',
    'Thu': 'thu',
    'Fri': 'fri',
    'Sat': 'sat',
    'Sun': 'sun'
  };

  // Group medications by time slot + meal timing for horizontal layout
  const timeSlotMealCombos = new Set<string>();
  activeMedications.forEach((med: any) => {
    const mealTiming = med.mealTiming || 'anytime';
    // Support both single time and multiple times
    if (med.times && Array.isArray(med.times)) {
      med.times.forEach((t: string) => {
        timeSlotMealCombos.add(`${t}|${mealTiming}`);
      });
    } else if (med.time) {
      timeSlotMealCombos.add(`${med.time}|${mealTiming}`);
    }
  });
  
  // Sort by time first, then by meal timing order
  const sortedCombos = Array.from(timeSlotMealCombos).sort((a, b) => {
    const [timeA, mealA] = a.split('|');
    const [timeB, mealB] = b.split('|');
    
    // Compare times first
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }
    
    // If same time, sort by meal timing
    const mealOrder: Record<string, number> = {
      'before meal': 1,
      'with meal': 2,
      'after meal': 3,
      'anytime': 4
    };
    return (mealOrder[mealA] || 5) - (mealOrder[mealB] || 5);
  });

  // Build schedule grid: combo (time|meal) -> day -> medications
  const scheduleGrid: Record<string, Record<string, any[]>> = {};
  
  sortedCombos.forEach(combo => {
    const [timeSlot, mealTiming] = combo.split('|');
    scheduleGrid[combo] = {};
    
    daysOfWeek.forEach(day => {
      const dayKey = dayKeys[day];
      const dayMeds = activeMedications
        .filter((med: any) => {
          // Check meal timing match
          if ((med.mealTiming || 'anytime') !== mealTiming) return false;
          
          // Check if medication is scheduled for this time slot
          let hasTime = false;
          if (med.times && Array.isArray(med.times)) {
            hasTime = med.times.includes(timeSlot);
          } else if (med.time) {
            hasTime = med.time === timeSlot;
          }
          
          if (!hasTime) return false;
          
          // Check if medication is scheduled for this day
          if (!med.daysOfWeek) return true;
          return med.daysOfWeek[dayKey];
        })
        .sort((a: any, b: any) => {
          // Sort alphabetically by name
          return (a.name || a.medication || '').localeCompare(b.name || b.medication || '');
        });
      scheduleGrid[combo][day] = dayMeds;
    });
  });

  // FILTER OUT EMPTY ROWS: Remove combos where ALL days have zero medications
  const nonEmptyCombos = sortedCombos.filter(combo => {
    return daysOfWeek.some(day => scheduleGrid[combo][day].length > 0);
  });

  // Helper function to get meal timing CSS class for B&W printing
  const getMealClass = (mealTiming: string) => {
    switch (mealTiming) {
      case 'before meal':
        return 'before';
      case 'with meal':
        return 'with';
      case 'after meal':
        return 'after';
      default:
        return 'anytime';
    }
  };

  // Helper to get form abbreviation
  const getFormAbbreviation = (form: string) => {
    const formMap: Record<string, string> = {
      'Tablets': 'tab',
      'Capsules': 'cap',
      'Liquids/Syrups': 'liq',
      'Injections': 'inj',
      'Creams/Ointments': 'crm',
      'Inhalers': 'inh',
      'Powders': 'pwd',
    };
    return formMap[form] || 'tab';
  };

  // Generate QR code data with patient and week info for photo upload tracking
  // MINIMAL DATA - only identifiers to prevent "Data too long" error
  const monday = new Date();
  const dayOfWeek = monday.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + mondayOffset);
  
  const qrData = JSON.stringify({
    p: userName,                              // Patient name
    w: monday.toISOString().split('T')[0],    // Week start (YYYY-MM-DD)
    y: new Date().getFullYear(),              // Year
    c: activeMedications.length,              // Medication count
    t: new Date().getTime()                   // Timestamp for uniqueness
  });

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm 6mm 5mm 6mm;
          }
          
          /* Hide all UI elements during print */
          nav,
          header,
          .no-print,
          [role="status"],
          [data-sonner-toaster],
          [data-sonner-toast],
          button,
          .lg\\:left-\\[280px\\] {
            display: none !important;
            visibility: hidden !important;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            background: white !important;
            margin: 0;
            padding: 0;
            color: #000 !important;
            overflow: hidden !important;
          }
          
          body * {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          .print-header {
            margin-bottom: 1mm !important;
            padding: 0 !important;
            background: white !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            border-bottom: none !important;
            flex-shrink: 0 !important;
          }
          
          .print-header-left h1 {
            font-size: 16pt !important;
            font-weight: bold !important;
            margin: 0 !important;
            color: #000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          
          .print-header-left img,
          .print-header-left svg {
            background: transparent !important;
            filter: none !important;
          }
          
          .print-header-left p {
            font-size: 8pt !important;
            color: #000 !important;
            margin: 1mm 0 0 0 !important;
          }
          
          .print-week-info {
            font-size: 11pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 0 !important;
            line-height: 1.3 !important;
          }
          
          .print-date {
            font-size: 8pt !important;
            font-weight: normal !important;
            color: #000 !important;
          }
          
          .print-qr-wrapper {
            display: block !important;
            width: 20mm !important;
            height: 20mm !important;
            border: 2px solid #000 !important;
            padding: 1mm !important;
            background: white !important;
            flex-shrink: 0 !important;
          }
          
          .print-qr-wrapper svg {
            width: 18mm !important;
            height: 18mm !important;
          }
          
          .print-table-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            border: 1px solid #000 !important;
            border-radius: 3mm !important;
            flex: 1 !important;
            overflow: hidden !important;
          }

          /* Hide outer borders of the table to use wrapper border instead (allows rounded corners) */
          .print-table tr:first-child th { border-top: none !important; }
          .print-table tr:last-child td { border-bottom: none !important; }
          .print-table th:first-child, .print-table td:first-child { border-left: none !important; }
          .print-table th:last-child, .print-table td:last-child { border-right: none !important; }
          
          .print-table {
            width: 100% !important;
            table-layout: fixed !important;
            font-size: 11pt !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            margin: 0 !important;
            border: none !important; /* Remove outer border to prevent double thickness */
            border-radius: 0 !important;
            overflow: hidden !important;
          }
          
          .print-table th {
            padding: 1.5mm !important;
            font-size: 11pt !important;
            font-weight: bold !important;
            background-color: #e0e0e0 !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            text-align: center !important;
            white-space: nowrap !important;
          }
          
          .print-table td {
            padding: 1mm !important;
            font-size: 9pt !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            vertical-align: top !important;
            line-height: 1.1 !important;
          }
          
          .print-table th.time-col {
            width: 14mm !important;
          }
          
          .print-table th.meal-col,
          .print-table td.meal-col {
            width: 7mm !important;
            text-align: center !important;
            font-size: 14pt !important;
            font-weight: bold !important;
            padding: 0 !important;
            vertical-align: middle !important;
            font-family: 'Arial Unicode MS', 'Segoe UI Symbol', monospace !important;
            border: 1px solid #000 !important;
          }
          
          .print-table th.meal-col {
            font-size: 14pt !important;
            line-height: 1.1 !important;
          }
          
          .print-table td.meal-col {
            line-height: 1 !important;
          }
          
          .meal-symbol {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 5mm !important;
            height: 5mm !important;
            border-radius: 50% !important;
            border: 2px solid #000 !important;
            background: white !important;
            position: relative !important;
            font-size: 0 !important;
          }
          
          .meal-symbol.before {
            background: white !important;
          }
          
          .meal-symbol.with {
            background: linear-gradient(90deg, #000 0%, #000 50%, white 50%, white 100%) !important;
          }
          
          .meal-symbol.after {
            background: #000 !important;
          }
          
          .meal-symbol.anytime {
            border-radius: 0 !important;
            background: #000 !important;
            height: 1.5px !important;
          }
          
          .print-table td.time-col {
            font-weight: bold !important;
            background-color: #f0f0f0 !important;
            text-align: center !important;
            vertical-align: middle !important;
            font-size: 12pt !important;
            border: 1px solid #000 !important;
          }
          
          .med-item {
            margin-bottom: 0.8mm !important;
            padding-bottom: 0.8mm !important;
            border-bottom: 1px dashed #000 !important;
          }
          
          .med-item:last-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
          
          .med-name {
            font-weight: 700 !important;
            font-size: 10pt !important;
            color: #000 !important;
            display: block !important;
            line-height: 1.15 !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            hyphens: auto !important;
          }
          
          .med-details {
            font-size: 9pt !important;
            color: #333 !important;
            display: block !important;
            margin: 0.2mm 0 !important;
            line-height: 1.1 !important;
          }
          
          .med-instruction {
            font-size: 10pt !important;
            font-weight: 700 !important;
            color: #000 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 0.3mm 0 0 0 !important;
            line-height: 1.15 !important;
          }
          
          .med-checkbox-row {
            display: flex !important;
            align-items: center !important;
            gap: 1.5mm !important;
            margin-top: 1mm !important;
          }
          
          input[type="checkbox"] {
            border: 1px solid #000 !important;
            width: 4.5mm !important;
            height: 4.5mm !important;
            min-width: 4.5mm !important;
            min-height: 4.5mm !important;
            margin: 0 !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            background: white !important;
            border-radius: 1px !important;
          }
          
          input[type="checkbox"]:checked {
            background: #000 !important;
          }
          
          .checkbox-label {
            font-size: 8pt !important;
            color: #000 !important;
            font-weight: 600 !important;
          }
          
          .print-footer {
            margin-top: 1.5mm !important;
            padding: 1.5mm 0 !important;
            border-top: 1.5px solid #000 !important;
            text-align: center !important;
            font-size: 8pt !important;
            color: #666 !important;
            flex-shrink: 0 !important;
          }
          
          .print-legend {
            margin-top: 2mm !important;
            padding: 2mm 2mm !important;
            background-color: #f5f5f5 !important;
            border: 1px solid #000 !important;
            border-radius: 3mm !important;
            text-align: center !important;
            font-size: 11pt !important;
            color: #000 !important;
            font-weight: normal !important;
            flex-shrink: 0 !important;
            line-height: 1.4 !important;
          }
          
          .print-legend strong {
            font-weight: bold !important;
          }
          
          .legend-symbol {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 5mm !important;
            height: 5mm !important;
            border-radius: 50% !important;
            border: 2px solid #000 !important;
            background: white !important;
            position: relative !important;
            font-size: 0 !important;
            vertical-align: middle !important;
            margin: 0 1mm !important;
          }
          
          .legend-symbol.before {
            background: white !important;
          }
          
          .legend-symbol.with {
            background: linear-gradient(90deg, #000 0%, #000 50%, white 50%, white 100%) !important;
          }
          
          .legend-symbol.after {
            background: #000 !important;
          }
          
          .legend-symbol.anytime {
            border-radius: 0 !important;
            background: #000 !important;
            height: 2px !important;
            width: 5mm !important;
          }
          
          .print-doctor {
            display: inline !important;
            font-size: 8pt !important;
            color: #000 !important;
            margin-right: 5mm !important;
          }
          
          .empty-cell {
            background-color: #fafafa !important;
            color: #ccc !important;
            text-align: center !important;
            font-size: 9pt !important;
          }
          
          * {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Landscape orientation support */
        @media print and (orientation: landscape) {
          @page {
            size: A4 landscape;
            margin: 5mm 6mm 5mm 3mm;
          }
          
          .print-header {
            margin-bottom: 2mm !important;
          }
          
          .print-header-left h1 {
            font-size: 14pt !important;
          }
          
          .print-header-left p {
            font-size: 7pt !important;
          }
          
          .print-qr-wrapper {
            width: 18mm !important;
            height: 18mm !important;
          }
          
          .print-qr-wrapper svg {
            width: 16mm !important;
            height: 16mm !important;
          }
          
          .print-table {
            font-size: 10pt !important;
          }
          
          .print-table th {
            font-size: 10pt !important;
            padding: 1mm !important;
          }
          
          .print-table th.time-col {
            width: 10mm !important;
          }
          
          .print-table td {
            font-size: 8pt !important;
            padding: 1mm !important;
          }
          
          .print-table td.time-col {
            font-size: 9pt !important;
            padding: 1mm !important;
          }
          
          .med-name {
            font-size: 10pt !important;
          }
          
          .med-details {
            font-size: 9pt !important;
          }
          
          .med-instruction {
            font-size: 10pt !important;
          }
          
          input[type="checkbox"] {
            width: 4mm !important;
            height: 4mm !important;
            min-width: 4mm !important;
            min-height: 4mm !important;
          }
          
          .checkbox-label {
            font-size: 7pt !important;
          }
          
          .print-legend {
            font-size: 8pt !important;
            padding: 1mm 2mm !important;
          }
          
          .print-footer {
            font-size: 7pt !important;
            padding: 1mm 0 !important;
          }
          
          .print-doctor {
            font-size: 7pt !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#E8F4F8] pb-6 sm:pb-8">
        {/* Header - No Print */}
        <div className="bg-white border-b-2 border-gray-300 px-6 lg:px-8 py-5 lg:py-6 sticky top-0 z-10 shadow-sm no-print">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setCurrentPage('main')}
              className="min-w-[60px] min-h-[60px] w-[60px] h-[60px] flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors touch-manipulation"
              aria-label="Back to main"
            >
              <ArrowLeft size={32} className="text-gray-700" strokeWidth={2.5} />
            </button>
            <h1 className="text-gray-900">Print Schedule</h1>
          </div>
        </div>

        {/* Action Buttons - No Print */}
        <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto no-print">
          <div className="grid grid-cols-1 gap-5 lg:gap-6">
            <button
              onClick={handlePrint}
              disabled={activeMedications.length === 0}
              className="flex items-center justify-center gap-5 px-8 py-6 bg-[#2196F3] text-white rounded-2xl hover:bg-[#1976D2] shadow-lg hover:shadow-xl transition-all min-h-[72px] lg:min-h-[80px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={36} className="flex-shrink-0" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <div className="text-xl lg:text-2xl mb-1">Print Schedule</div>
                <div className="opacity-90">Compact 1-page format with QR code</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-5 px-8 py-6 bg-green-600 text-white rounded-2xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all min-h-[72px] lg:min-h-[80px] touch-manipulation"
            >
              <Camera size={36} className="flex-shrink-0" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <div className="text-xl lg:text-2xl mb-1">Upload Photo</div>
                <div className="opacity-90">Scan QR + analyze checkmarks</div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          <div className="mt-6 lg:mt-8 p-6 lg:p-8 bg-blue-50 border-2 border-blue-200 rounded-2xl">
            <p className="text-gray-800 leading-relaxed">
              <strong className="block mb-3 text-xl lg:text-2xl">How to use:</strong>
              <span className="block mb-2">1. Print schedule (QR code included)</span>
              <span className="block mb-2">2. Mark checkboxes after taking meds</span>
              <span className="block mb-2">3. Take photo of completed schedule</span>
              <span className="block">4. Upload - QR identifies patient & week</span>
            </p>
            <div className="mt-4 p-4 bg-white rounded-xl border-2 border-blue-300">
              <p className="text-gray-700 mb-2"><strong>Meal timing symbols (B&W friendly):</strong></p>
              <p className="text-gray-700">○ Before meal | ◐ With meal | ● After meal | — Anytime</p>
            </div>
          </div>
        </div>

        {/* Printable Content */}
        <div className="print-container px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
          {/* Print Header with QR Code */}
          <div className="print-header mb-3 bg-white p-2 flex justify-between items-start gap-2">
            <div className="print-header-left flex items-start gap-2 flex-1">
              <div className="flex-shrink-0">
                <PrintLogo />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-[#2196F3] mb-1" style={{ fontSize: '10pt', letterSpacing: '1px' }}>PRESCRIPTION CLARITY</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-0 uppercase tracking-tight">{userName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="print-week-info text-sm text-gray-900 font-bold m-0" style={{ fontSize: '9pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                Week: {weekDateRange}<br />
                <span className="print-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
              <div className="print-qr-wrapper border-2 border-gray-300 p-1 rounded no-print-hide flex-shrink-0">
                <QRCodeSVG 
                  value={qrData} 
                  size={60}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* Compact Schedule Table */}
          {activeMedications.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-600 text-lg">No medications to display. Please add medications first.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 no-print">
                <p className="text-gray-700 text-center bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
                  📄 <strong>Print Preview:</strong> Optimized for 1-page A4 portrait with QR code (B&W compatible)
                </p>
              </div>
              
              <div className="print-table-wrapper overflow-x-auto bg-white rounded-2xl shadow-md">
                <table className="print-table w-full border-collapse">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="time-col px-2 py-2">
                        Time
                      </th>
                      <th className="meal-col">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 auto' }}>
                          {/* Fork - Left side */}
                          <line x1="5" y1="3" x2="5" y2="21" />
                          <line x1="9" y1="3" x2="9" y2="10" />
                          <line x1="13" y1="3" x2="13" y2="10" />
                          <line x1="5" y1="10" x2="13" y2="10" />
                          {/* Knife - Right side */}
                          <line x1="19" y1="3" x2="19" y2="21" />
                          <line x1="16" y1="6" x2="19" y2="3" />
                        </svg>
                      </th>
                      {daysOfWeek.map((day, index) => (
                        <th key={index} className="px-1 py-2">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nonEmptyCombos.map((combo, timeIndex) => {
                      const [timeSlot, mealTiming] = combo.split('|');
                      return (
                        <tr key={timeIndex} className={timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="time-col px-2 py-2">
                            {timeSlot}
                          </td>
                          <td className="meal-col">
                            <span className={`meal-symbol ${getMealClass(mealTiming)}`}></span>
                          </td>
                          {daysOfWeek.map((day, dayIndex) => {
                            const meds = scheduleGrid[combo][day];
                            return (
                              <td key={dayIndex} className={`px-1 py-1 ${meds.length === 0 ? 'empty-cell' : ''}`}>
                                {meds.length === 0 ? (
                                  <span className="text-gray-400">—</span>
                                ) : (
                                  <div className="space-y-1">
                                    {meds.map((med: any, medIndex: number) => (
                                      <div key={medIndex} className="med-item">
                                        <span className="med-name">{med.name || med.medication}</span>
                                        <span className="med-details">
                                          {med.dosage}
                                        </span>
                                        <span className="med-instruction">
                                          <span>{med.quantity || '1'} {getFormAbbreviation(med.form)}</span>
                                          <input 
                                            type="checkbox" 
                                            className="rounded bg-white" 
                                            aria-label={`${med.name} taken`}
                                          />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Legend for Meal Timing Symbols */}
          <div className="print-legend bg-gray-100 border border-gray-300 p-2 text-center mt-2">
            <strong>Meal Timing:</strong> <span className="legend-symbol before"></span> Before meal | <span className="legend-symbol with"></span> With meal | <span className="legend-symbol after"></span> After meal | <span className="legend-symbol anytime"></span> Anytime
          </div>

          {/* Compact Footer with Doctor Info */}
          <div className="print-footer">
            {doctorInfo && (
              <span className="print-doctor">
                Dr: {doctorInfo.name}
                {doctorInfo.phone && ` | ${doctorInfo.phone}`}
                {doctorInfo.email && ` | ${doctorInfo.email}`}
              </span>
            )}
            <span>Prescription Clarity | {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>
    </>
  );
}
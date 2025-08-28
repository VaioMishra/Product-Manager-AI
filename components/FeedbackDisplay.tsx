import React, { useRef, useState } from 'react';
import { Feedback, User } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Declare CDN libraries for TypeScript
// FIX: Corrected `jsPDF` to `jspdf` to match the global variable name from the CDN.
declare const jspdf: any;
declare const html2canvas: any;

interface FeedbackDisplayProps {
  feedback: Feedback;
  user: User;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, user }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const radarChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  
  const scores: Partial<Feedback['scores']> = feedback.scores || {};
  const chartData = [
    { skill: 'Structure', score: scores.structure || 0, fullMark: 10 },
    { skill: 'Creativity', score: scores.creativity || 0, fullMark: 10 },
    { skill: 'Strategy', score: scores.strategy || 0, fullMark: 10 },
    { skill: 'Prioritization', score: scores.prioritization || 0, fullMark: 10 },
    { skill: 'Communication', score: scores.communication || 0, fullMark: 10 },
  ];
  
  const handleDownloadPdf = async () => {
    if (!radarChartRef.current || !barChartRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // FIX: Correctly instantiate jsPDF from the `jspdf` global provided by the script tag.
      const { jsPDF } = jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      const margin = 40;
      const docWidth = doc.internal.pageSize.getWidth();
      const contentWidth = docWidth - margin * 2;
      let yPos = margin;

      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PM Interview Feedback Report', docWidth / 2, yPos, { align: 'center' });
      yPos += 30;

      // User Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Candidate: ${user.name} (${user.yoe} YoE)`, margin, yPos);
      yPos += 40;

      // Capture charts as images
      const radarCanvas = await html2canvas(radarChartRef.current, { backgroundColor: '#1F2937', scale: 2 });
      const barCanvas = await html2canvas(barChartRef.current, { backgroundColor: '#1F2937', scale: 2 });
      
      const radarImgData = radarCanvas.toDataURL('image/png');
      const barImgData = barCanvas.toDataURL('image/png');

      const radarImgProps = doc.getImageProperties(radarImgData);
      const barImgProps = doc.getImageProperties(barImgData);

      const chartWidth = contentWidth / 2 - 10;
      const radarImgHeight = (radarImgProps.height * chartWidth) / radarImgProps.width;
      const barImgHeight = (barImgProps.height * chartWidth) / barImgProps.width;
      
      doc.addImage(radarImgData, 'PNG', margin, yPos, chartWidth, radarImgHeight);
      doc.addImage(barImgData, 'PNG', margin + chartWidth + 20, yPos, chartWidth, barImgHeight);
      
      yPos += Math.max(radarImgHeight, barImgHeight) + 30;

      // Feedback Text
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Feedback', margin, yPos);
      yPos += 20;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const renderList = (title: string, items: string[], color: [number, number, number]) => {
          if (yPos > doc.internal.pageSize.getHeight() - margin * 3) {
            doc.addPage();
            yPos = margin;
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...color);
          doc.text(title, margin, yPos);
          yPos += 18;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(209, 213, 219);
          (items || []).forEach(item => {
              const splitText = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
              if (yPos + (splitText.length * 12) > doc.internal.pageSize.getHeight() - margin) {
                  doc.addPage();
                  yPos = margin;
              }
              doc.text(splitText, margin + 10, yPos);
              yPos += splitText.length * 12 + 5;
          });
          yPos += 15;
      }

      renderList('✅ Strengths', feedback.strengths, [74, 222, 128]);
      renderList('⚠️ Weaknesses', feedback.weaknesses, [250, 204, 21]);
      renderList('🚀 Improvements', feedback.improvements, [96, 165, 250]);

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const creatorLink = 'https://www.linkedin.com/in/vaiomishra/';
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const footerY = doc.internal.pageSize.getHeight() - 20;
          doc.setFontSize(8);

          // Left side footer
          doc.setTextColor(156, 163, 175);
          doc.text(`Report generated by PM Interview Coach.`, margin, footerY);
          
          // Right side footer (with hyperlink)
          const creatorTextPrefix = 'Built by ';
          const creatorName = 'Vaibhav Mishra';
          const creatorTextSuffix = ` (${creatorLink})`;
          
          // Measure widths for manual right-alignment
          const nameWidth = doc.getTextWidth(creatorName);
          const prefixWidth = doc.getTextWidth(creatorTextPrefix);
          const suffixWidth = doc.getTextWidth(creatorTextSuffix);
          const totalCreatorTextWidth = prefixWidth + nameWidth + suffixWidth;
          
          let currentX = docWidth - margin - totalCreatorTextWidth;

          // Draw prefix in gray
          doc.setTextColor(156, 163, 175);
          doc.text(creatorTextPrefix, currentX, footerY);
          currentX += prefixWidth;
          
          const linkStartX = currentX;

          // Draw name in highlighted blue
          doc.setTextColor(96, 165, 250); 
          doc.text(creatorName, currentX, footerY);
          currentX += nameWidth;

          // Draw suffix in gray
          doc.setTextColor(156, 163, 175);
          doc.text(creatorTextSuffix, currentX, footerY);

          // Add link annotation over the name
          doc.link(linkStartX, footerY - 8, nameWidth, 10, { url: creatorLink });
      }
      
      doc.save(`PM-Feedback-Report-${user.name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, an error occurred while generating the PDF report.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const FeedbackList = ({ title, items, colorClass }: { title: string; items: string[]; colorClass: string; }) => (
    <div>
      <h4 className={`text-lg font-semibold mb-2 ${colorClass}`}>{title}</h4>
      <ul className="list-disc list-inside space-y-1 text-content-200">
        {(items || []).map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Your Performance Feedback</h3>
        <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf} size="sm" className="inline-flex items-center">
          {isGeneratingPdf ? <Spinner /> : <DocumentArrowDownIcon className="w-5 h-5 mr-2" />}
          {isGeneratingPdf ? 'Generating...' : 'Download Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2" ref={radarChartRef}>
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-center">Skills Radar</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#D1D5DB', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'none' }} axisLine={{ stroke: 'none' }}/>
                <Radar name="Your Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-3" ref={barChartRef}>
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-center">Score Breakdown</h4>
             <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fill: '#D1D5DB' }} stroke="#374151"/>
                <YAxis type="category" dataKey="skill" width={100} tick={{ fill: '#D1D5DB' }} stroke="#374151"/>
                <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{backgroundColor: '#374151', border: 'none'}}/>
                <Bar dataKey="score" fill="#4F46E5" background={{ fill: '#374151' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeedbackList title="✅ Strengths" items={feedback.strengths} colorClass="text-green-400" />
          <FeedbackList title="⚠️ Weaknesses" items={feedback.weaknesses} colorClass="text-yellow-400" />
          <FeedbackList title="🚀 Improvements" items={feedback.improvements} colorClass="text-blue-400" />
        </div>
      </Card>
    </div>
  );
};

export default FeedbackDisplay;
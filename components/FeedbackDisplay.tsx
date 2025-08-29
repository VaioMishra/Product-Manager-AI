import React, { useRef, useState } from 'react';
import { Feedback, User } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { StarIcon } from './icons/StarIcon';
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

declare const jspdf: any;
declare const html2canvas: any;

interface FeedbackDisplayProps {
  feedback: Feedback;
  user: User;
}

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <StarIcon
                    key={index}
                    className={`w-6 h-6 ${index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                />
            ))}
            <span className="ml-2 text-lg font-bold text-text-primary">{rating.toFixed(1)} / 5.0</span>
        </div>
    );
};

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, user }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  const scores: Partial<Feedback['scores']> = feedback.scores || {};
  const chartData = [
    { skill: 'Structure', score: scores.structure || 0, fullMark: 10 },
    { skill: 'Creativity', score: scores.creativity || 0, fullMark: 10 },
    { skill: 'Strategy', score: scores.strategy || 0, fullMark: 10 },
    { skill: 'Prioritization', score: scores.prioritization || 0, fullMark: 10 },
    { skill: 'Communication', score: scores.communication || 0, fullMark: 10 },
  ];
  
  const handleDownloadPdf = async () => {
    if (!pdfContentRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      const margin = 40;
      const docWidth = doc.internal.pageSize.getWidth();
      
      const canvas = await html2canvas(pdfContentRef.current, {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#F5F5F7',
          scale: 2,
          useCORS: true,
          onclone: (document) => {
            document.querySelectorAll('svg').forEach(svg => {
                svg.style.width = svg.getBoundingClientRect().width + 'px';
                svg.style.height = svg.getBoundingClientRect().height + 'px';
            });
          }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = docWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(`PM-Feedback-Report-${user.name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, an error occurred while generating the PDF report. Charts might not render correctly.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const FeedbackList = ({ title, items, colorClass }: { title: string; items: string[]; colorClass: string; }) => (
    <div>
      <h4 className={`text-lg font-semibold mb-2 ${colorClass}`}>{title}</h4>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        {(items || []).map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-2xl font-bold text-center sm:text-left">Your Performance Feedback</h3>
        <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf} size="sm" className="inline-flex items-center">
          {isGeneratingPdf ? <Spinner /> : <DocumentArrowDownIcon className="w-5 h-5 mr-2" />}
          {isGeneratingPdf ? 'Generating...' : 'Download Report'}
        </Button>
      </div>

      <div ref={pdfContentRef} className="p-4 bg-bg-primary">
        {feedback.overallRating && (
            <Card className="mb-6">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h4 className="text-xl font-semibold">Overall Rating</h4>
                    <StarRating rating={feedback.overallRating} />
                </div>
            </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-4 text-center">Skills Radar</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="var(--color-border-primary)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'none' }} axisLine={{ stroke: 'none' }}/>
                  <Radar name="Your Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="lg:col-span-3">
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-4 text-center">Score Breakdown</h4>
               <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--color-text-secondary)' }} stroke="var(--color-border-primary)"/>
                  <YAxis type="category" dataKey="skill" width={100} tick={{ fill: 'var(--color-text-secondary)' }} stroke="var(--color-border-primary)"/>
                  <Tooltip cursor={{fill: 'var(--color-surface-primary)'}} contentStyle={{backgroundColor: 'var(--color-surface-secondary)', border: 'none', borderRadius: '8px'}}/>
                  <Bar dataKey="score" fill="#4F46E5" background={{ fill: 'var(--color-surface-secondary)' }} radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="mt-6">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeedbackList title="✅ Strengths" items={feedback.strengths} colorClass="text-green-400" />
            <FeedbackList title="⚠️ Weaknesses" items={feedback.weaknesses} colorClass="text-yellow-400" />
            <FeedbackList title="🚀 Improvements" items={feedback.improvements} colorClass="text-blue-400" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
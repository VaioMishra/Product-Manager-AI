import React, { useState, useEffect } from 'react';
import { getFrameworkExplanation, getSampleAnswer } from '../services/geminiService';
import { User, InterviewCategory } from '../types';
import Modal from './common/Modal';
import Spinner from './common/Spinner';
import Button from './common/Button';

interface HelpGuideProps {
    onClose: () => void;
    question: string;
    category: InterviewCategory;
    user: User;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ onClose, question, category, user }) => {
    const [step, setStep] = useState(0); // 0: framework, 1: answer
    const [explanation, setExplanation] = useState('');
    const [sampleAnswer, setSampleAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExplanation = async () => {
            setIsLoading(true);
            const result = await getFrameworkExplanation(question, category);
            setExplanation(result);
            setIsLoading(false);
        };
        fetchExplanation();
    }, [question, category]);
    
    const fetchSampleAnswer = async () => {
        setIsLoading(true);
        setStep(1);
        if (!sampleAnswer) { // Fetch only if we don't have it
            const result = await getSampleAnswer(question, user, category);
            setSampleAnswer(result);
        }
        setIsLoading(false);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col justify-center items-center min-h-[300px]">
                    <Spinner />
                    <p className="mt-4 text-content-200">
                        {step === 0 ? "Loading expert approach..." : "Generating sample answer..."}
                    </p>
                </div>
            );
        }

        if (step === 0) {
            return (
                <div>
                    <h4 className="font-bold text-lg mb-4 text-content-100">How to Approach This Question</h4>
                    <div className="prose prose-invert max-w-none prose-p:text-content-200">
                        <p className="whitespace-pre-wrap">{explanation}</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={fetchSampleAnswer}>Next: See a Sample Answer</Button>
                    </div>
                </div>
            );
        }

        if (step === 1) {
            return (
                 <div>
                    <h4 className="font-bold text-lg mb-4 text-content-100">Sample Expert Answer</h4>
                     <div className="prose prose-invert max-w-none prose-p:text-content-200 bg-base-100 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{sampleAnswer}</p>
                     </div>
                     <div className="mt-6 flex justify-end">
                        <Button onClick={() => setStep(0)} variant="secondary" className="mr-2">Back to Approach</Button>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <Modal title="Help Guide" onClose={onClose}>
            {renderContent()}
        </Modal>
    );
};

export default HelpGuide;

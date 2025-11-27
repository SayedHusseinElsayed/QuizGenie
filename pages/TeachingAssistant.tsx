

import React, { useState } from 'react';
import { useApp } from '../App';
import { generateTeachingGuide } from '../services/geminiService';
import { fileToBase64 } from '../services/dbService';
import { TeachingGuide } from '../types';
import { Book, Check, Upload, Sparkles } from 'lucide-react';

const TeachingAssistant = () => {
  const { language } = useApp();
  const [files, setFiles] = useState<File[]>([]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<TeachingGuide | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const resources = await Promise.all(files.map(async (f) => ({
        mimeType: f.type,
        data: await fileToBase64(f)
      })));
      
      const result = await generateTeachingGuide(topic, resources, language);
      setGuide(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Book className="text-primary-600" /> AI Teaching Assistant
      </h1>

      {!guide ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block font-bold text-slate-700 mb-2">What do you want to teach?</label>
            <input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3"
              placeholder="e.g. Introduction to Quantum Physics for High Schoolers"
            />
          </div>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
             <input type="file" multiple onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="hidden" id="guide-upload" />
             <label htmlFor="guide-upload" className="cursor-pointer flex flex-col items-center gap-2 text-slate-500 hover:text-primary-600">
                <Upload size={32} />
                <span>Upload Reference Materials</span>
             </label>
             {files.length > 0 && <p className="mt-2 text-sm text-green-600">{files.length} files selected</p>}
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Sparkles className="animate-spin" /> : <Sparkles />}
            Generate Lesson Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setGuide(null)} className="text-sm text-slate-500 hover:underline">← Start Over</button>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{guide.title}</h2>
            <div className="bg-primary-50 p-4 rounded-lg text-primary-800 mb-8">
              <h3 className="font-bold text-sm uppercase mb-2 opacity-70">Summary</h3>
              <p>{guide.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Check size={20} className="text-green-500" /> Key Learning Points</h3>
                <ul className="space-y-2">
                  {guide.key_points?.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5" />
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Suggestions</h3>
                <ul className="space-y-2">
                  {guide.suggestions?.map((s, i) => (
                    <li key={i} className="text-slate-600 text-sm italic border-l-4 border-primary-200 pl-3 py-1">
                      "{s}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-xl mb-6 border-b pb-2">Teaching Steps</h3>
            <div className="space-y-6">
              {guide.teaching_steps?.map((step, i) => (
                <div key={i} className="flex gap-4">
                   <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
                     {i + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-slate-900">{step.step}</h4>
                     <p className="text-slate-600 mt-1">{step.detail}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingAssistant;

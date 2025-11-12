import React, { useState } from 'react';
import './DISCQuestionnaire.css';

const questions = [
  { id: 1, text: "I seldom toot my own horn", type: "S" },
  { id: 2, text: "I make lots of noise", type: "I" },
  { id: 3, text: "I am always on the look out for ways to make money", type: "D" },
  { id: 4, text: "I have a strong need for power", type: "D" },
  { id: 5, text: "I try to outdo others", type: "D" },
  { id: 6, text: "I read the fine print", type: "C" },
  { id: 7, text: "I hesitate to criticize other people's ideas", type: "S" },
  { id: 8, text: "I love order and regularity", type: "C" },
  { id: 9, text: "I am emotionally reserved", type: "C" },
  { id: 10, text: "I just want everyone to be equal", type: "S" },
  { id: 11, text: "I joke around a lot", type: "I" },
  { id: 12, text: "I enjoy being part of a loud crowd", type: "I" },
  { id: 13, text: "I put people under pressure", type: "D" },
  { id: 14, text: "I want strangers to love me", type: "I" },
  { id: 15, text: "My first reaction to an idea is to see its flaws", type: "C" },
  { id: 16, text: "I value cooperation over competition", type: "S" }
];

const responseOptions = [
  { value: 1, label: "Disagree" },
  { value: 2, label: "Slightly disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Slightly agree" },
  { value: 5, label: "Agree" }
];

const DISCQuestionnaire = ({ onComplete, initialScores = null }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showIntro, setShowIntro] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState(null);

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      calculateScores(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScores = (allAnswers) => {
    const typeScores = { D: 0, I: 0, S: 0, C: 0 };
    const typeCounts = { D: 0, I: 0, S: 0, C: 0 };

    questions.forEach((question, index) => {
      const answer = allAnswers[index];
      if (answer) {
        typeScores[question.type] += answer;
        typeCounts[question.type]++;
      }
    });

    // Calculate percentage scores
    const calculatedScores = {
      dominance: Math.round((typeScores.D / (typeCounts.D * 5)) * 100) || 0,
      influence: Math.round((typeScores.I / (typeCounts.I * 5)) * 100) || 0,
      steadiness: Math.round((typeScores.S / (typeCounts.S * 5)) * 100) || 0,
      conscientiousness: Math.round((typeScores.C / (typeCounts.C * 5)) * 100) || 0
    };

    // Determine primary type
    const maxScore = Math.max(
      calculatedScores.dominance,
      calculatedScores.influence,
      calculatedScores.steadiness,
      calculatedScores.conscientiousness
    );

    let primaryType = 'D';
    if (calculatedScores.influence === maxScore) primaryType = 'I';
    else if (calculatedScores.steadiness === maxScore) primaryType = 'S';
    else if (calculatedScores.conscientiousness === maxScore) primaryType = 'C';

    calculatedScores.primaryType = primaryType;

    setScores(calculatedScores);
    setShowResults(true);
    
    // Call the onComplete callback with the scores
    if (onComplete) {
      onComplete(calculatedScores);
    }
  };

  const getTypeDescription = (type) => {
    const descriptions = {
      D: {
        title: "Dominance",
        description: "You are results-oriented, decisive, and direct. You enjoy challenges and taking charge.",
        traits: ["Direct", "Results-oriented", "Firm", "Strong-willed", "Forceful"],
        workplace: "In the workplace, you excel at driving results, making tough decisions, and leading change initiatives."
      },
      I: {
        title: "Influence", 
        description: "You are enthusiastic, optimistic, and enjoy collaborating with others. You thrive in social situations.",
        traits: ["Enthusiastic", "Optimistic", "Warm", "Convincing", "Magnetic"],
        workplace: "In the workplace, you excel at building relationships, motivating teams, and creating positive environments."
      },
      S: {
        title: "Steadiness",
        description: "You are patient, loyal, and prefer stable environments. You value cooperation and helping others.",
        traits: ["Patient", "Loyal", "Predictable", "Team-oriented", "Calm"],
        workplace: "In the workplace, you excel at supporting others, maintaining harmony, and ensuring consistent quality."
      },
      C: {
        title: "Conscientiousness",
        description: "You are analytical, detail-oriented, and value accuracy. You prefer systematic approaches to problems.",
        traits: ["Precise", "Analytical", "Systematic", "Reserved", "Disciplined"],
        workplace: "In the workplace, you excel at quality control, data analysis, and developing efficient processes."
      }
    };
    return descriptions[type];
  };

  const startTest = () => {
    setShowIntro(false);
    setShowResults(false);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const retakeTest = () => {
    setScores(null);
    setShowResults(false);
    setShowIntro(true);
    setCurrentQuestion(0);
    setAnswers({});
  };

  if (showIntro) {
    return (
      <div className="disc-intro">
        <h2>DISC Assessment Test</h2>
        <div className="info-box">
          <h3>About the DISC Assessment</h3>
          <p>
            The DISC assessment is a behavioral assessment tool based on the DISC theory of psychologist William Moulton Marston. 
            It centers on four different personality traits: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C).
          </p>
          <p>
            This quick assessment consists of 16 questions and takes about 4-6 minutes to complete. 
            Answer honestly based on how you typically behave, not how you think you should behave.
          </p>
        </div>
        <button className="start-button" onClick={startTest}>
          Begin Assessment
        </button>
      </div>
    );
  }

  if (showResults && scores) {
    const typeDesc = getTypeDescription(scores.primaryType);
    return (
      <div className="disc-results">
        <h2>Your DISC Assessment Results</h2>
        
        <div className="scores-chart">
          <div className="score-bar">
            <label>D - Dominance</label>
            <div className="bar-container">
              <div className="bar" style={{ width: `${scores.dominance}%` }}>
                {scores.dominance}%
              </div>
            </div>
          </div>
          <div className="score-bar">
            <label>I - Influence</label>
            <div className="bar-container">
              <div className="bar" style={{ width: `${scores.influence}%` }}>
                {scores.influence}%
              </div>
            </div>
          </div>
          <div className="score-bar">
            <label>S - Steadiness</label>
            <div className="bar-container">
              <div className="bar" style={{ width: `${scores.steadiness}%` }}>
                {scores.steadiness}%
              </div>
            </div>
          </div>
          <div className="score-bar">
            <label>C - Conscientiousness</label>
            <div className="bar-container">
              <div className="bar" style={{ width: `${scores.conscientiousness}%` }}>
                {scores.conscientiousness}%
              </div>
            </div>
          </div>
        </div>

        <div className="primary-type">
          <h3>Your Primary Type: {typeDesc.title}</h3>
          <p>{typeDesc.description}</p>
          
          <div className="traits">
            <h4>Key Characteristics:</h4>
            <ul>
              {typeDesc.traits.map((trait, index) => (
                <li key={index}>{trait}</li>
              ))}
            </ul>
          </div>
          
          <div className="workplace">
            <h4>In the Workplace:</h4>
            <p>{typeDesc.workplace}</p>
          </div>
        </div>

        <button className="retake-button" onClick={retakeTest}>
          Retake Assessment
        </button>
      </div>
    );
  }


  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="disc-questionnaire">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="question-counter">
        {currentQuestion + 1} / {questions.length}
      </div>

      <div className="question-content">
        <h3>{question.text}</h3>
        
        <div className="response-options">
          {responseOptions.map(option => (
            <label key={option.value} className="response-option">
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={option.value}
                checked={answers[currentQuestion] === option.value}
                onChange={() => handleAnswer(option.value)}
              />
              <span className="option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {currentQuestion > 0 && (
        <button className="nav-button prev-button" onClick={handlePrevious}>
          ← Redo last question
        </button>
      )}
    </div>
  );
};

export default DISCQuestionnaire;
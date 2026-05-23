// Temporary data for testing challenges and rankings
// Run this to populate Firestore with test data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-4045646230-a45fb",
  "appId": "1:674681440284:web:154b9bc6239caff039b7d9",
  "apiKey": "AIzaSyBG62k8-Irbyr7SFVaCEYs-VBU9xBs3AO0",
  "authDomain": "studio-4045646230-a45fb.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "674681440284"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Temporary challenge data
const tempChallenges = [
  {
    id: 'challenge-1',
    title: 'Array Sum Challenge',
    description: 'Write a function that returns the sum of all elements in an array',
    difficulty: 'easy',
    category: 'Programming',
    totalPoints: 50,
    questions: [
      {
        id: 'q1',
        question: 'What is the time complexity of a linear array sum?',
        options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 'q2',
        question: 'Which method is used to sum arrays in JavaScript?',
        options: ['reduce()', 'map()', 'filter()', 'forEach()'],
        correctAnswer: 0,
        points: 15
      },
      {
        id: 'q3',
        question: 'What will [1,2,3].reduce((a,b) => a+b) return?',
        options: ['123', '6', 'undefined', 'error'],
        correctAnswer: 1,
        points: 25
      }
    ],
    createdAt: new Date('2025-04-10')
  },
  {
    id: 'challenge-2',
    title: 'String Reversal',
    description: 'Reverse a string without using built-in methods',
    difficulty: 'easy',
    category: 'Programming',
    totalPoints: 40,
    questions: [
      {
        id: 'q1',
        question: 'How to reverse a string in JavaScript?',
        options: ['split().reverse().join()', 'reverse()', 'flip()', 'swap()'],
        correctAnswer: 0,
        points: 20
      },
      {
        id: 'q2',
        question: 'What does split("") do?',
        options: ['Creates array of characters', 'Reverses string', 'Joins strings', 'Splits by space'],
        correctAnswer: 0,
        points: 20
      }
    ],
    createdAt: new Date('2025-04-11')
  },
  {
    id: 'challenge-3',
    title: 'Binary Search',
    description: 'Implement binary search algorithm',
    difficulty: 'medium',
    category: 'Programming',
    totalPoints: 100,
    questions: [
      {
        id: 'q1',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        points: 25
      },
      {
        id: 'q2',
        question: 'Binary search requires the array to be:',
        options: ['Random', 'Sorted', 'Unique', 'Large'],
        correctAnswer: 1,
        points: 25
      },
      {
        id: 'q3',
        question: 'How many elements can binary search check from 1M items?',
        options: ['1M', '500K', '~20', '100K'],
        correctAnswer: 2,
        points: 25
      },
      {
        id: 'q4',
        question: 'Which is more efficient: linear or binary search?',
        options: ['Linear', 'Binary', 'Same', 'Depends'],
        correctAnswer: 1,
        points: 25
      }
    ],
    createdAt: new Date('2025-04-12')
  },
  {
    id: 'challenge-4',
    title: 'Two Sum Problem',
    description: 'Find two numbers that add up to a target sum',
    difficulty: 'medium',
    category: 'Programming',
    totalPoints: 90,
    questions: [
      {
        id: 'q1',
        question: 'Optimal approach for Two Sum is using:',
        options: ['Nested loops', 'Hash map', 'Sorting', 'Random'],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 'q2',
        question: 'Best time complexity for Two Sum:',
        options: ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 'q3',
        question: 'For array [2,7,11,15], target 9, answer is:',
        options: ['[0,1]', '[2,3]', '[1,2]', 'No solution'],
        correctAnswer: 0,
        points: 30
      }
    ],
    createdAt: new Date('2025-04-13')
  },
  {
    id: 'challenge-5',
    title: 'Dynamic Programming Basics',
    description: 'Master dynamic programming concepts',
    difficulty: 'hard',
    category: 'Programming',
    totalPoints: 200,
    questions: [
      {
        id: 'q1',
        question: 'DP stands for:',
        options: ['Digital Programming', 'Dynamic Programming', 'Data Processing', 'Distributed Protocol'],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 'q2',
        question: 'First principle of DP is:',
        options: ['Greedy', 'Optimal substructure', 'Recursion', 'Sorting'],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 'q3',
        question: 'Memoization stores:',
        options: ['Previous results', 'Input data', 'Code', 'Variables'],
        correctAnswer: 0,
        points: 35
      },
      {
        id: 'q4',
        question: 'Fibonacci DP reduces complexity from:',
        options: ['O(n) to O(1)', 'O(2^n) to O(n)', 'O(n²) to O(n)', 'Stays same'],
        correctAnswer: 1,
        points: 35
      },
      {
        id: 'q5',
        question: 'Tabulation is a:',
        options: ['Top-down approach', 'Bottom-up approach', 'Linear search', 'Sorting method'],
        correctAnswer: 1,
        points: 40
      }
    ],
    createdAt: new Date('2025-04-14')
  }
];

// Temporary student results data
const tempResults = [
  {
    id: 'result-1',
    userId: 'student-1',
    userEmail: 'student1@school.com',
    displayName: 'Rajesh Kumar',
    challengeId: 'challenge-1',
    challengeTitle: 'Array Sum Challenge',
    correctAnswers: 3,
    totalQuestions: 3,
    percentage: 100,
    totalPoints: 50,
    difficulty: 'easy',
    solvedAt: new Date('2025-04-15T08:00:00')
  },
  {
    id: 'result-2',
    userId: 'student-1',
    userEmail: 'student1@school.com',
    displayName: 'Rajesh Kumar',
    challengeId: 'challenge-2',
    challengeTitle: 'String Reversal',
    correctAnswers: 2,
    totalQuestions: 2,
    percentage: 100,
    totalPoints: 40,
    difficulty: 'easy',
    solvedAt: new Date('2025-04-15T08:15:00')
  },
  {
    id: 'result-3',
    userId: 'student-2',
    userEmail: 'student2@school.com',
    displayName: 'Priya Singh',
    challengeId: 'challenge-1',
    challengeTitle: 'Array Sum Challenge',
    correctAnswers: 3,
    totalQuestions: 3,
    percentage: 100,
    totalPoints: 50,
    difficulty: 'easy',
    solvedAt: new Date('2025-04-15T09:00:00')
  },
  {
    id: 'result-4',
    userId: 'student-3',
    userEmail: 'student3@school.com',
    displayName: 'Arjun Patel',
    challengeId: 'challenge-3',
    challengeTitle: 'Binary Search',
    correctAnswers: 4,
    totalQuestions: 4,
    percentage: 100,
    totalPoints: 100,
    difficulty: 'medium',
    solvedAt: new Date('2025-04-15T10:00:00')
  },
  {
    id: 'result-5',
    userId: 'student-2',
    userEmail: 'student2@school.com',
    displayName: 'Priya Singh',
    challengeId: 'challenge-3',
    challengeTitle: 'Binary Search',
    correctAnswers: 3,
    totalQuestions: 4,
    percentage: 75,
    totalPoints: 75,
    difficulty: 'medium',
    solvedAt: new Date('2025-04-15T10:30:00')
  },
  {
    id: 'result-6',
    userId: 'student-4',
    userEmail: 'student4@school.com',
    displayName: 'Neha Gupta',
    challengeId: 'challenge-2',
    challengeTitle: 'String Reversal',
    correctAnswers: 2,
    totalQuestions: 2,
    percentage: 100,
    totalPoints: 40,
    difficulty: 'easy',
    solvedAt: new Date('2025-04-15T11:00:00')
  },
  {
    id: 'result-7',
    userId: 'student-5',
    userEmail: 'student5@school.com',
    displayName: 'Vikram Sharma',
    challengeId: 'challenge-4',
    challengeTitle: 'Two Sum Problem',
    correctAnswers: 3,
    totalQuestions: 3,
    percentage: 100,
    totalPoints: 90,
    difficulty: 'medium',
    solvedAt: new Date('2025-04-15T12:00:00')
  },
  {
    id: 'result-8',
    userId: 'student-6',
    userEmail: 'student6@school.com',
    displayName: 'Isha Verma',
    challengeId: 'challenge-5',
    challengeTitle: 'Dynamic Programming Basics',
    correctAnswers: 5,
    totalQuestions: 5,
    percentage: 100,
    totalPoints: 200,
    difficulty: 'hard',
    solvedAt: new Date('2025-04-15T13:00:00')
  },
  {
    id: 'result-9',
    userId: 'student-1',
    userEmail: 'student1@school.com',
    displayName: 'Rajesh Kumar',
    challengeId: 'challenge-3',
    challengeTitle: 'Binary Search',
    correctAnswers: 4,
    totalQuestions: 4,
    percentage: 100,
    totalPoints: 100,
    difficulty: 'medium',
    solvedAt: new Date('2025-04-15T13:30:00')
  },
  {
    id: 'result-10',
    userId: 'student-3',
    userEmail: 'student3@school.com',
    displayName: 'Arjun Patel',
    challengeId: 'challenge-4',
    challengeTitle: 'Two Sum Problem',
    correctAnswers: 3,
    totalQuestions: 3,
    percentage: 100,
    totalPoints: 90,
    difficulty: 'medium',
    solvedAt: new Date('2025-04-15T14:00:00')
  }
];

async function addTemporaryData() {
  console.log('🔄 Adding temporary challenge data to Firestore...');
  
  try {
    // Add challenges
    for (const challenge of tempChallenges) {
      await setDoc(doc(db, 'challenges', challenge.id), challenge);
      console.log(`✅ Added challenge: ${challenge.title}`);
    }

    // Add results
    for (const result of tempResults) {
      await setDoc(doc(db, 'challengeResults', result.id), result);
    }
    console.log(`✅ Added ${tempResults.length} challenge results`);

    console.log('✨ Temporary data successfully added!');
    console.log('📊 Rankings should now be visible on the home page');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding data:', error);
    process.exit(1);
  }
}

addTemporaryData();

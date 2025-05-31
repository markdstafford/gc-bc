import React from 'react';
import { cn } from '../utils/cn';

const sentimentColors = {
  APPROVE: 'bg-green-100 text-green-800 border-green-200',
  DISAPPROVE: 'bg-red-100 text-red-800 border-red-200',
  OK: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  POSITIVE: 'bg-green-100 text-green-800 border-green-200',
  NEGATIVE: 'bg-red-100 text-red-800 border-red-200',
  NEUTRAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  NO_OPINION: 'bg-gray-100 text-gray-800 border-gray-200'
};

const sentimentLabels = {
  APPROVE: 'Approve',
  DISAPPROVE: 'Disapprove',
  OK: 'Ok',
  POSITIVE: 'Positive',
  NEGATIVE: 'Negative',
  NEUTRAL: 'Neutral',
  NO_OPINION: 'No Opinion'
};

export function SentimentBadge({ value, className }) {
  if (!value) return null;
  
  const color = sentimentColors[value] || sentimentColors.NEUTRAL;
  const label = sentimentLabels[value] || value;
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      color,
      className
    )}>
      {label}
    </span>
  );
} 
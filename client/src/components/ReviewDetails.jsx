import React from "react";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import { StarRating } from "./StarRating";
import { SentimentBadge } from "./SentimentBadge";
import { Briefcase, Calendar, User } from "lucide-react";

export function ReviewDetails({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        Selected reviews ({reviews.length})
      </h3>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.reviewId}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="space-y-4">
              {/* Header with title and overall rating */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {review.summary || "No title"}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(review.reviewDateTime), "MMM d, yyyy")}
                    </span>
                    {review.jobTitle?.title && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {review.jobTitle.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {review.employmentStatus}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-600 mb-1">
                    Overall rating
                  </div>
                  {review.ratingOverall > 0 ? (
                    <StarRating rating={review.ratingOverall} />
                  ) : null}
                </div>
              </div>

              {/* Ratings section - stacked layout */}
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-3">
                  Detailed ratings
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {review.ratingCeo &&
                    review.ratingCeo !== "UNKNOWN" &&
                    review.ratingCeo !== "0" &&
                    review.ratingCeo !== 0 &&
                    review.ratingCeo !== -0.1 && (
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-sm text-gray-600 mb-1">
                          CEO approval
                        </div>
                        <SentimentBadge value={review.ratingCeo} />
                      </div>
                    )}
                  {review.ratingSeniorLeadership > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        Leadership
                      </div>
                      <StarRating rating={review.ratingSeniorLeadership} />
                    </div>
                  )}
                  {review.ratingBusinessOutlook &&
                    review.ratingBusinessOutlook !== "UNKNOWN" &&
                    review.ratingBusinessOutlook !== "0" &&
                    review.ratingBusinessOutlook !== 0 &&
                    review.ratingBusinessOutlook !== -0.1 && (
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-sm text-gray-600 mb-1">
                          Business outlook
                        </div>
                        <SentimentBadge value={review.ratingBusinessOutlook} />
                      </div>
                    )}
                  {review.ratingRecommendToFriend &&
                    review.ratingRecommendToFriend !== "UNKNOWN" &&
                    review.ratingRecommendToFriend !== "0" &&
                    review.ratingRecommendToFriend !== 0 &&
                    review.ratingRecommendToFriend !== -0.1 && (
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-sm text-gray-600 mb-1">
                          Recommend
                        </div>
                        <SentimentBadge
                          value={review.ratingRecommendToFriend}
                        />
                      </div>
                    )}
                  {review.ratingCultureAndValues > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">Culture</div>
                      <StarRating rating={review.ratingCultureAndValues} />
                    </div>
                  )}
                  {review.ratingWorkLifeBalance > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        Work-life balance
                      </div>
                      <StarRating rating={review.ratingWorkLifeBalance} />
                    </div>
                  )}
                  {review.ratingCompensationAndBenefits > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        Compensation
                      </div>
                      <StarRating
                        rating={review.ratingCompensationAndBenefits}
                      />
                    </div>
                  )}
                  {review.ratingCareerOpportunities > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        Career opportunities
                      </div>
                      <StarRating rating={review.ratingCareerOpportunities} />
                    </div>
                  )}
                  {review.ratingDiversityAndInclusion > 0 && (
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        Diversity
                      </div>
                      <StarRating rating={review.ratingDiversityAndInclusion} />
                    </div>
                  )}
                </div>
              </div>

              {/* Review content */}
              <div className="border-t pt-4 space-y-4">
                {review.advice && (
                  <div>
                    <h5 className="font-semibold text-blue-700 mb-2">
                      💡 Advice to management
                    </h5>
                    <div className="text-gray-700 prose prose-sm max-w-none bg-blue-50 p-3 rounded">
                      <ReactMarkdown>{review.advice}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {review.pros && (
                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">
                      ✓ Pros
                    </h5>
                    <div className="text-gray-700 prose prose-sm max-w-none bg-green-50 p-3 rounded">
                      <ReactMarkdown>{review.pros}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {review.cons && (
                  <div>
                    <h5 className="font-semibold text-red-700 mb-2">✗ Cons</h5>
                    <div className="text-gray-700 prose prose-sm max-w-none bg-red-50 p-3 rounded">
                      <ReactMarkdown>{review.cons}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

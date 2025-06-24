"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function InterestsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const interestCategories = {
    "Culture": [
      "Architecture",
      "Art",
      "Comics and anime",
      "Entertainment",
      "Fashion",
      "Literature",
      "Music",
      "Performing arts",
      "Sports",
      "TV and film",
      "Video games"
    ],
    "History and Society": [
      "Biography (all)",
      "Biography (women)",
      "Business and economics",
      "Education",
      "Food and drink",
      "History",
      "Military and warfare",
      "Philosophy and religion",
      "Politics and government",
      "Society",
      "Transportation"
    ],
    "Science, Technology, and Math": [
      "Biology",
      "Chemistry",
      "Computers and internet",
      "Engineering",
      "Mathematics",
      "Medicine and health",
      "Physics",
      "Space and astronomy",
      "Technology"
    ]
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const selectAllInCategory = (category) => {
    const categoryInterests = interestCategories[category];
    const newSelected = new Set([...selectedInterests]);
    
    const allCategorySelected = categoryInterests.every(interest => 
      selectedInterests.includes(interest)
    );

    if (allCategorySelected) {
      // Remove all interests in this category
      categoryInterests.forEach(interest => {
        newSelected.delete(interest);
      });
    } else {
      // Add all interests in this category
      categoryInterests.forEach(interest => {
        newSelected.add(interest);
      });
    }

    setSelectedInterests([...newSelected]);
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length === 0) {
      alert("Please select at least one interest");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interests: selectedInterests }),
      });

      if (response.ok) {
        router.push("/chat");
      } else {
        throw new Error("Failed to save interests");
      }
    } catch (error) {
      console.error("Error saving interests:", error);
      alert("Failed to save interests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1650px] mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-[16px] font-bold">Select interests</h1>
          <button
            onClick={handleSaveInterests}
            disabled={isLoading || selectedInterests.length === 0}
            className={`px-6 py-2 rounded-[60px] text-white font-medium transition-colors
              ${isLoading || selectedInterests.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#1877F2] hover:bg-[#166bdb]"
              }`}
          >
            {isLoading ? "Saving..." : "Done"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-lg text-gray-700 mb-8">
          Choose some topics you are interested in
        </p>

        <div className="space-y-10">
          {Object.entries(interestCategories).map(([category, interests]) => (
            <div key={category} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-900">{category}</h2>
                <button
                  onClick={() => selectAllInCategory(category)}
                  className="text-[#1877F2] hover:text-[#166bdb] text-sm font-medium"
                >
                  Select all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`
                      px-4 py-2 rounded-full text-sm transition-colors
                      ${selectedInterests.includes(interest)
                        ? "bg-[#1877F2] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedInterests.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
            <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1877F2] rounded-full"></div>
              <span className="text-sm text-gray-600">
                {selectedInterests.length} Interest{selectedInterests.length !== 1 ? 's' : ''} picked
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
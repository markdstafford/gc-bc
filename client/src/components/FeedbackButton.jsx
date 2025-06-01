import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";

export function FeedbackButton() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenForm}
        className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
        title="Submit Feedback"
      >
        <Megaphone size={20} />
      </button>

      <FeedbackForm isOpen={isFormOpen} onClose={handleCloseForm} />
    </>
  );
}

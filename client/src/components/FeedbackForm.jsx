import React, { useState, useEffect } from "react";
import { submitBugReport, submitFeatureRequest } from "../utils/linearService";
import { Modal } from "./Modal";

export function FeedbackForm({ isOpen, onClose, initialType = "bug" }) {
  const [type, setType] = useState(initialType); // "bug" or "feature"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setType(initialType);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = { title, description, priority };

      if (type === "bug") {
        await submitBugReport(data);
      } else {
        await submitFeatureRequest(data);
      }

      setSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError(err.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold mb-3">
              Submit {type === "bug" ? "Bug Report" : "Feature Request"}
            </h3>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`px-3 py-1 text-sm rounded-l-md ${
                  type === "bug"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Bug
              </button>
              <button
                type="button"
                onClick={() => setType("feature")}
                className={`px-3 py-1 text-sm rounded-r-md ${
                  type === "feature"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Feature
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Your {type === "bug" ? "bug report" : "feature request"} has been
            submitted successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder={
              type === "bug"
                ? "Describe the issue briefly"
                : "Feature name or short description"
            }
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-32"
            placeholder={
              type === "bug"
                ? "Please include:\n1. Steps to reproduce\n2. Expected behavior\n3. Actual behavior\n4. Any error messages"
                : "Please describe the feature you'd like to see and how it would benefit you"
            }
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${
              type === "bug" ? "bg-red-600" : "bg-green-600"
            } hover:opacity-90 text-white py-2 px-4 rounded disabled:opacity-50`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; subject?: string; message?: string; agreed?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { email?: string; subject?: string; message?: string; agreed?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!message.trim()) {
      newErrors.message = "Message is required";
    }
    
    if (!agreed) {
      newErrors.agreed = "You must agree to be contacted";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError(null);
      return;
    }
    
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          agreed: agreed,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setAgreed(false);
        setFormError(null);
      } else if (response.status === 429) {
        setFormError("Too many requests. Please try again later.");
        setErrors({});
      } else if (response.status === 400) {
        try {
          const errorData = await response.json();
          const fieldErrors: { email?: string; subject?: string; message?: string; agreed?: string } = {};
          if (errorData.email) fieldErrors.email = errorData.email;
          if (errorData.subject) fieldErrors.subject = errorData.subject;
          if (errorData.message) fieldErrors.message = errorData.message;
          if (errorData.agreed) fieldErrors.agreed = errorData.agreed;
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
          
          if (errorData.error && !fieldErrors.email && !fieldErrors.subject && !fieldErrors.message && !fieldErrors.agreed) {
            setFormError(errorData.error);
          } else if (!Object.keys(fieldErrors).length) {
            setFormError("Something went wrong. Please try again.");
          }
        } catch {
          setFormError("Something went wrong. Please try again.");
        }
      } else {
        setFormError("Something went wrong. Please try again.");
        setErrors({});
      }
    } catch (error) {
      setFormError("Something went wrong. Please try again.");
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          id="contactName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          id="contactEmail"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.email ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="contactSubject" className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <input
          id="contactSubject"
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors({ ...errors, subject: undefined });
          }}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.subject ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="contactMessage" className="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          id="contactMessage"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors({ ...errors, message: undefined });
          }}
          required
          rows={6}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.message ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (errors.agreed) setErrors({ ...errors, agreed: undefined });
            }}
            className="mt-1 mr-2 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">
            I agree to be contacted about this request. *
          </span>
        </label>
        {errors.agreed && (
          <p className="mt-1 text-sm text-red-600 ml-6">{errors.agreed}</p>
        )}
      </div>

      {showSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-sm text-teal-800">
            Thanks — we received your message and will reply within 1–2 business days.
          </p>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{formError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium ${
          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}


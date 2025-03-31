import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const BigModal = ({ isOpen, onClose, content }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.keyCode === 27) onClose();
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "auto";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-hidden bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="w-dvw h-dvh sm:w-auto sm:h-auto sm:rounded-md sm:shadow-lg overflow-hidden sm:mt-[8dvh] sm:mb-[8dvh]"
      >
        <div className="flex flex-col h-full max-h-full sm:max-h-[90vh] overflow-auto">
          {content}
        </div>
      </div>
    </div>,
    document.getElementById("big-modal-container")
  );
};

export default BigModal;
